package com.clinic.queue.config;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.reactive.function.client.WebClient;
@Configuration
public class SupabaseConfig {

    @Bean
    public WebClient supabaseClient(
            @Value("${supabase.projectUrl}") String projectUrl,
            @Value("${supabase.anon-key}") String anon_key) {

        // Dotenv dotenv = Dotenv.configure()
        //         .ignoreIfMalformed()
        //         .ignoreIfMissing()
        //         .load();

        // String url = firstNonBlank(
        //         System.getProperty("supabase.projectUrl"),
        //         projectUrl,                                     // from application.properties
        //         System.getenv("SUPABASE_URL"),              // OS env
        //         dotenv.get("SUPABASE_URL")                  // .env
        // );
        // String key = firstNonBlank(
        //         System.getProperty("supabase.key"),
        //         anon_key,
        //         System.getenv("SUPABASE_KEY"),
        //         dotenv.get("SUPABASE_KEY")
        // );

        return WebClient.builder()
                .baseUrl(projectUrl + "/rest/v1")
                .defaultHeader("apikey", anon_key)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + anon_key) // anon/service key
                .build();
    }

//      private static String firstNonBlank(String... vals) {
//         for (String v : vals) if (!isBlank(v)) return v;
//         return null;
//     }

//     private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
