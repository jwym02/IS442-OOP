package com.clinic.application;

import com.clinic.domain.value.BackupMetadata;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;

@Service
public class BackupService {
    private static final Logger log = LoggerFactory.getLogger(BackupService.class);
    private static final DateTimeFormatter ID_FORMATTER =
        DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9\\-]+");
    private static final String DATA_SUFFIX = ".snapshot.json";
    private static final String META_SUFFIX = ".meta.json";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final Path backupDir;

    public BackupService(JdbcTemplate jdbcTemplate,
                         ObjectMapper objectMapper,
                         @Value("${app.backups.dir:backups}") String backupsDir) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.backupDir = Paths.get(backupsDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.backupDir);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to prepare backup directory", e);
        }
    }

    @Transactional(readOnly = true)
    public BackupMetadata createSnapshot() {
        try {
            Instant now = Instant.now();
            String id = buildId(now);
            SnapshotDocument snapshot = new SnapshotDocument();
            snapshot.setCreatedAt(now);
            snapshot.setTables(captureTables());

            Path dataFile = dataPath(id);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(dataFile.toFile(), snapshot);

            BackupMetadata metadata = buildMetadata(id, snapshot, dataFile);
            writeMetadata(metadata);

            log.info("Backup snapshot {} created with {} tables", id, snapshot.getTables().size());
            return metadata;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed to create backup snapshot", ex);
        }
    }

    @Transactional(readOnly = true)
    public List<BackupMetadata> listSnapshots() {
        try (Stream<Path> files = Files.list(backupDir)) {
            return files
                .filter(path -> path.getFileName().toString().endsWith(META_SUFFIX))
                .map(this::readMetadata)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(BackupMetadata::getCreatedAt).reversed())
                .collect(Collectors.toList());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to list backups", ex);
        }
    }

    @Transactional
    public void restoreSnapshot(String backupId) {
        String sanitizedId = sanitizeId(backupId);
        Path dataFile = dataPath(sanitizedId);
        if (!Files.exists(dataFile)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Backup not found: " + sanitizedId);
        }

        try {
            SnapshotDocument snapshot = objectMapper.readValue(dataFile.toFile(), SnapshotDocument.class);
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");
            try {
                for (TableData table : snapshot.getTables()) {
                    restoreTable(table);
                }
            } finally {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");
            }
            log.info("Backup {} restored successfully", sanitizedId);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed to read backup file " + sanitizedId, ex);
        }
    }

    private BackupMetadata buildMetadata(String id, SnapshotDocument snapshot, Path dataFile) throws IOException {
        BackupMetadata metadata = new BackupMetadata();
        metadata.setId(id);
        metadata.setCreatedAt(snapshot.getCreatedAt());
        metadata.setTables(snapshot.getTables().stream()
            .map(TableData::getName)
            .collect(Collectors.toList()));
        metadata.setTotalRows(snapshot.getTables().stream()
            .mapToLong(table -> table.getRows() != null ? table.getRows().size() : 0)
            .sum());
        metadata.setSizeBytes(Files.size(dataFile));
        return metadata;
    }

    private void writeMetadata(BackupMetadata metadata) throws IOException {
        Path metaFile = metaPath(metadata.getId());
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(metaFile.toFile(), metadata);
    }

    private BackupMetadata readMetadata(Path metaFile) {
        try {
            return objectMapper.readValue(metaFile.toFile(), BackupMetadata.class);
        } catch (IOException ex) {
            log.warn("Failed to read metadata file {}", metaFile, ex);
            return null;
        }
    }

    private List<TableData> captureTables() {
        List<String> tables = listDatabaseTables();
        List<TableData> snapshots = new ArrayList<>();
        for (String table : tables) {
            TableData data = jdbcTemplate.query("SELECT * FROM " + quote(table), extractTable(table));
            if (data == null) {
                data = new TableData();
                data.setName(table);
                data.setColumns(List.of());
                data.setColumnTypes(List.of());
                data.setRows(List.of());
            }
            snapshots.add(data);
        }
        return snapshots;
    }

    private ResultSetExtractor<TableData> extractTable(String tableName) {
        return (ResultSet rs) -> {
            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();
            List<String> columns = new ArrayList<>(columnCount);
            List<Integer> columnTypes = new ArrayList<>(columnCount);
            for (int i = 1; i <= columnCount; i++) {
                columns.add(meta.getColumnName(i));
                columnTypes.add(meta.getColumnType(i));
            }
            List<List<Object>> rows = new ArrayList<>();
            while (rs.next()) {
                List<Object> row = new ArrayList<>(columnCount);
                for (int i = 1; i <= columnCount; i++) {
                    row.add(rs.getObject(i));
                }
                rows.add(row);
            }
            TableData table = new TableData();
            table.setName(tableName);
            table.setColumns(columns);
            table.setColumnTypes(columnTypes);
            table.setRows(rows);
            return table;
        };
    }

    private List<String> listDatabaseTables() {
        String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        if (schema == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No active schema for backup");
        }
        String sql = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = ?
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """;
        return jdbcTemplate.queryForList(sql, String.class, schema);
    }

    private void restoreTable(TableData table) {
        String tableName = table.getName();
        jdbcTemplate.execute("TRUNCATE TABLE " + quote(tableName));
        List<List<Object>> rows = table.getRows();
        if (rows == null || rows.isEmpty()) {
            return;
        }
        List<String> columns = table.getColumns();
        String columnSql = columns.stream().map(this::quote).collect(Collectors.joining(", "));
        String placeholders = columns.stream().map(col -> "?").collect(Collectors.joining(", "));
        String sql = "INSERT INTO " + quote(tableName) + " (" + columnSql + ") VALUES (" + placeholders + ")";

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                List<Object> row = rows.get(i);
                for (int col = 0; col < columns.size(); col++) {
                    Object value = col < row.size() ? row.get(col) : null;
                    int jdbcType = table.getColumnTypes().get(col);
                    ps.setObject(col + 1, normalizeValue(value, jdbcType));
                }
            }

            @Override
            public int getBatchSize() {
                return rows.size();
            }
        });
    }

    private Object normalizeValue(Object value, int jdbcType) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            if (jdbcType == Types.BIGINT) {
                return number.longValue();
            }
            if (jdbcType == Types.INTEGER || jdbcType == Types.SMALLINT || jdbcType == Types.TINYINT) {
                return number.intValue();
            }
            if (jdbcType == Types.FLOAT || jdbcType == Types.REAL || jdbcType == Types.DOUBLE) {
                return number.doubleValue();
            }
            if (jdbcType == Types.NUMERIC || jdbcType == Types.DECIMAL) {
                return new BigDecimal(number.toString());
            }
        }
        if (value instanceof String str && (jdbcType == Types.NUMERIC || jdbcType == Types.DECIMAL)) {
            try {
                return new BigDecimal(str);
            } catch (NumberFormatException ignore) {
                return str;
            }
        }
        if (value instanceof String str) {
            if (isTemporal(jdbcType)) {
                return parseTemporal(str, jdbcType);
            }
            if (isBinary(jdbcType)) {
                return Base64.getDecoder().decode(str);
            }
            return str;
        }
        if (value instanceof List<?> list && isBinary(jdbcType)) {
            byte[] bytes = new byte[list.size()];
            for (int i = 0; i < list.size(); i++) {
                bytes[i] = ((Number) list.get(i)).byteValue();
            }
            return bytes;
        }
        return value;
    }

    private boolean isTemporal(int jdbcType) {
        return switch (jdbcType) {
            case Types.TIMESTAMP, Types.TIMESTAMP_WITH_TIMEZONE,
                Types.DATE, Types.TIME, Types.TIME_WITH_TIMEZONE -> true;
            default -> false;
        };
    }

    private Object parseTemporal(String value, int jdbcType) {
        try {
            Instant instant = Instant.parse(value);
            if (jdbcType == Types.DATE) {
                return instant.atZone(ZoneOffset.UTC).toLocalDate();
            }
            if (jdbcType == Types.TIME || jdbcType == Types.TIME_WITH_TIMEZONE) {
                return instant.atZone(ZoneOffset.UTC).toLocalTime();
            }
            return Timestamp.from(instant);
        } catch (DateTimeParseException ex) {
            try {
                LocalDateTime dateTime = LocalDateTime.parse(value);
                if (jdbcType == Types.DATE) {
                    return dateTime.toLocalDate();
                }
                if (jdbcType == Types.TIME || jdbcType == Types.TIME_WITH_TIMEZONE) {
                    return dateTime.toLocalTime();
                }
                return Timestamp.valueOf(dateTime);
            } catch (DateTimeParseException inner) {
                return value;
            }
        }
    }

    private boolean isBinary(int jdbcType) {
        return switch (jdbcType) {
            case Types.BINARY, Types.VARBINARY, Types.LONGVARBINARY, Types.BLOB -> true;
            default -> false;
        };
    }

    private String buildId(Instant instant) {
        String timestamp = ID_FORMATTER.format(instant);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toLowerCase(Locale.ROOT);
        return "backup-" + timestamp + "-" + suffix;
    }

    private String sanitizeId(String id) {
        if (id == null || !SAFE_ID.matcher(id).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid backup identifier");
        }
        return id;
    }

    private Path dataPath(String id) {
        return backupDir.resolve(id + DATA_SUFFIX);
    }

    private Path metaPath(String id) {
        return backupDir.resolve(id + META_SUFFIX);
    }

    private String quote(String identifier) {
        return "`" + identifier.replace("`", "``") + "`";
    }

    private static class SnapshotDocument {
        private Instant createdAt;
        private List<TableData> tables;

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public List<TableData> getTables() {
            return tables;
        }

        public void setTables(List<TableData> tables) {
            this.tables = tables;
        }
    }

    private static class TableData {
        private String name;
        private List<String> columns;
        private List<Integer> columnTypes;
        private List<List<Object>> rows;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getColumns() {
            return columns;
        }

        public void setColumns(List<String> columns) {
            this.columns = columns;
        }

        public List<Integer> getColumnTypes() {
            return columnTypes;
        }

        public void setColumnTypes(List<Integer> columnTypes) {
            this.columnTypes = columnTypes;
        }

        public List<List<Object>> getRows() {
            return rows;
        }

        public void setRows(List<List<Object>> rows) {
            this.rows = rows;
        }
    }
}
