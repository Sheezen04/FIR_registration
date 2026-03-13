package com.example.Backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks online/offline status of users via WebSocket sessions.
 * Uses in-memory storage — online status is lost on server restart.
 */
@Service
public class OnlineStatusService {

    // userId -> Set of session IDs (a user can have multiple tabs/devices)
    private final Map<Long, Set<String>> onlineSessions = new ConcurrentHashMap<>();

    // userId -> last seen timestamp
    private final Map<Long, LocalDateTime> lastSeenMap = new ConcurrentHashMap<>();

    public void userConnected(Long userId, String sessionId) {
        onlineSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void userDisconnected(Long userId, String sessionId) {
        Set<String> sessions = onlineSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                onlineSessions.remove(userId);
                lastSeenMap.put(userId, LocalDateTime.now());
            }
        }
    }

    public boolean isOnline(Long userId) {
        Set<String> sessions = onlineSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public String getLastSeen(Long userId) {
        if (isOnline(userId)) {
            return LocalDateTime.now().atOffset(ZoneOffset.UTC).toString();
        }
        LocalDateTime lastSeen = lastSeenMap.get(userId);
        if (lastSeen != null) {
            return lastSeen.atOffset(ZoneOffset.UTC).toString();
        }
        return null;
    }

    public Set<Long> getOnlineUserIds() {
        return onlineSessions.keySet();
    }
}
