package com.example.Backend.config;

import com.example.Backend.dto.StatusUpdate;
import com.example.Backend.entity.User;
import com.example.Backend.service.OnlineStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Listens for WebSocket connect/disconnect events to track online status.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final OnlineStatusService onlineStatusService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnect(SessionConnectedEvent event) {
        var principal = event.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User user) {
                String sessionId = getSessionId(event);
                onlineStatusService.userConnected(user.getId(), sessionId);
                log.info("User connected: {} (ID: {}, session: {})", user.getName(), user.getId(), sessionId);

                // Broadcast online status
                broadcastStatus(user, true);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        var principal = event.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User user) {
                String sessionId = event.getSessionId();
                onlineStatusService.userDisconnected(user.getId(), sessionId);
                log.info("User disconnected: {} (ID: {}, session: {})", user.getName(), user.getId(), sessionId);

                // Only broadcast offline if user has no more sessions
                if (!onlineStatusService.isOnline(user.getId())) {
                    broadcastStatus(user, false);
                }
            }
        }
    }

    private void broadcastStatus(User user, boolean online) {
        StatusUpdate status = StatusUpdate.builder()
                .userId(user.getId())
                .userName(user.getName())
                .online(online)
                .lastSeen(LocalDateTime.now().atOffset(ZoneOffset.UTC).toString())
                .build();
        messagingTemplate.convertAndSend("/topic/status", status);
    }

    private String getSessionId(SessionConnectedEvent event) {
        // Extract session ID from the event's message headers
        var headers = event.getMessage().getHeaders();
        return (String) headers.get("simpSessionId");
    }
}
