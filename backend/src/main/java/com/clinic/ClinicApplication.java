package com.clinic;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {
    public static void main(String[] args) {
        // Load .env file explicitly, ignore if missing
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

        // Inject each .env entry as a system property
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
        SpringApplication.run(ClinicApplication.class, args);
    }
}
