package com.clinic.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final com.clinic.websocket.WebSocketHandler webSocketHandler;

    public WebSocketConfig(com.clinic.websocket.WebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // frontend connects to ws://localhost:8081/ws
        registry.addHandler(webSocketHandler, "/ws")
                .setAllowedOrigins("*"); // adjust origins for production
    }
    
}
