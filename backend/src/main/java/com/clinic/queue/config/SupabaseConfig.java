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

        return WebClient.builder()
                .baseUrl(projectUrl + "/rest/v1")
                .defaultHeader("apikey", anon_key)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + anon_key) // anon/service key
                .build();
    }

}
