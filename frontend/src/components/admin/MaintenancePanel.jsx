import { Database, HardDrive, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function MaintenancePanel({
  backups,
  loading,
  creating,
  restoringId,
  onRefresh,
  onCreateBackup,
  onRestore,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Data Protection
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Backup &amp; Restore</h2>
            <p className="text-sm text-slate-500 mt-1">
              Create a point-in-time snapshot of the database or restore the system to a previous state.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh list
            </Button>
            <Button
              className="gap-2"
              onClick={onCreateBackup}
              disabled={creating}
            >
              <HardDrive className={`h-4 w-4 ${creating ? 'animate-spin' : ''}`} />
              {creating ? 'Creating…' : 'Create backup'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100">
          <Database className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-slate-900">Available snapshots</h3>
            <p className="text-sm text-slate-500">Restore the platform to any recorded snapshot.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="inline-flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading backups…
            </div>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No backups have been created yet. Generate your first snapshot to populate this list.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tables
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{formatDateTime(backup.createdAt)}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{backup.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {backup.tables?.length || 0} tables
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-xs">
                        {backup.tables?.join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{backup.totalRows ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{formatBytes(backup.sizeBytes)}</td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => onRestore(backup.id)}
                        disabled={restoringId === backup.id}
                      >
                        <RotateCcw className={`h-4 w-4 ${restoringId === backup.id ? 'animate-spin' : ''}`} />
                        {restoringId === backup.id ? 'Restoring…' : 'Restore'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

