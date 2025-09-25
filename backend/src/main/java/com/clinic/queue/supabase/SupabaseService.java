package com.clinic.queue.supabase;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;

@Service
@CrossOrigin(origins = "*")
public class SupabaseService {
    private final WebClient supabaseClient;

    // WebClient is provided by your SupabaseConfig @Bean
    public SupabaseService(WebClient supabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    /** Fetch all columns from the given table (e.g., "appointments"). */
    public String fetchData(String table) {
        return supabaseClient.get()
                .uri(uri -> uri.path("/" + table)
                               .queryParam("select", "*")
                               .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    public String patchById(String table, String idCol, long id, Map<String, Object> update) {
    String uri = "/" + table + "?" + idCol + "=eq." + id;
    return supabaseClient.patch()
        .uri(uri)
        .contentType(MediaType.APPLICATION_JSON)
        .header("Prefer", "return=representation")
        .body(BodyInserters.fromValue(update))
        .retrieve()
        .bodyToMono(String.class)
        .block();
    }
     // NEW 5-arg overload
    public String patchById(String table, String idCol, long id, String field, Object value) {
        return patchById(table, idCol, id, Map.of(field, value));
    }

    // // ---- test endpoints ----
    //  @GetMapping("/test")
    // public String httpFetch(@RequestParam String table) {
    //     return fetchData(table);
    // }

    // @PatchMapping("/{table}/{id}")
    // @CrossOrigin(origins = "*")
    // public String httpPatch(
    //         @PathVariable String table,
    //         @PathVariable long id,
    //         @RequestParam(defaultValue = "id") String idCol,
    //         @RequestBody Map<String, Object> body) {
    //     return patchById(table, idCol, id, body);
    // }
}
