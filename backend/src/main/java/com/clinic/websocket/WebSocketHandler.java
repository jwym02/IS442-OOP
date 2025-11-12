package com.clinic.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.CloseStatus;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.Map;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(WebSocketHandler.class);
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        session.sendMessage(new TextMessage("{\"type\":\"connected\",\"message\":\"welcome\"}"));
        log.info("WebSocket connected: sessionId={}, sessions={}", session.getId(), sessions.size());
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        session.sendMessage(new TextMessage("{\"type\":\"echo\",\"payload\":" + escapeForJson(payload) + "}"));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
    }

    /**
     * Broadcast a queue update JSON to all connected websocket clients.
     */
    public void sendQueueUpdate(Long clinicId, int total, Map<String, Object> next, List<Map<String, Object>> queue) {
        try {
            ObjectNode root = mapper.createObjectNode();
            root.put("type", "queue_update");
            if (clinicId != null) root.put("clinicId", clinicId);
            root.put("total", total);
            if (next != null) root.set("next", mapper.valueToTree(next));
            if (queue != null) root.set("queue", mapper.valueToTree(queue));
            String payload = root.toString();
            log.debug("Broadcasting queue_update for clinicId={} total={} sessions={}", clinicId, total, sessions.size());
            sendMessageToAll(payload);
        } catch (Exception ex) {
            log.warn("Failed to prepare queue_update payload: {}", ex.getMessage());
        }
    }

    public void sendMessageToAll(String text) {
        TextMessage msg = new TextMessage(text);
        sessions.forEach(s -> {
            if (s.isOpen()) {
                try {
                    s.sendMessage(msg);
                } catch (IOException ex) {
                    log.warn("Failed to send ws message to sessionId={}: {}", s.getId(), ex.getMessage());
                }
            }
        });
    }

    private String escapeForJson(String s) {
        if (s == null) return "\"\"";
        s = s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
        return "\"" + s + "\"";
    }
}
