package com.example.Backend.controller;

import com.example.Backend.dto.*;
import com.example.Backend.entity.User;
import com.example.Backend.service.ChatService;
import com.example.Backend.service.OnlineStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Handles WebSocket STOMP messages for real-time chat.
 */
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineStatusService onlineStatusService;

    /**
     * Client sends to: /app/chat.send
     * This saves the message and pushes it to the receiver via their personal queue.
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        User sender = extractUser(principal);
        if (sender == null) return;

        ChatMessageDTO saved = chatService.sendMessage(
                sender.getId(),
                request.getReceiverId(),
                request.getContent(),
                request.getType(),
                request.getFirReference(),
                request.getReplyToId()
        );

        // Send to receiver's personal queue (using topic with userId)
        messagingTemplate.convertAndSend(
                "/topic/user." + request.getReceiverId() + ".messages",
                saved
        );

        // Also send back to sender (for confirmation / multi-device sync)
        messagingTemplate.convertAndSend(
                "/topic/user." + sender.getId() + ".messages",
                saved
        );
    }

    /**
     * Client sends to: /app/chat.typing
     * Forwards typing notification to the target user.
     */
    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingNotification notification, Principal principal) {
        User sender = extractUser(principal);
        if (sender == null) return;

        notification.setSenderId(sender.getId());
        notification.setSenderName(sender.getName());

        messagingTemplate.convertAndSend(
                "/topic/user." + notification.getReceiverId() + ".typing",
                notification
        );
    }

    /**
     * Client sends to: /app/chat.read
     * Marks messages as read and notifies the original sender.
     */
    @MessageMapping("/chat.read")
    public void markRead(@Payload ReadReceipt receipt, Principal principal) {
        User reader = extractUser(principal);
        if (reader == null) return;

        chatService.markAsRead(receipt.getSenderId(), reader.getId());

        // Notify the original sender that their messages have been read
        messagingTemplate.convertAndSend(
                "/topic/user." + receipt.getSenderId() + ".read-receipt",
                ReadReceipt.builder()
                        .senderId(receipt.getSenderId())
                        .readerId(reader.getId())
                        .build()
        );
    }

    private User extractUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof User user) {
                return user;
            }
        }
        return null;
    }

    /**
     * Simple DTO for read receipts
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ReadReceipt {
        private Long senderId;
        private Long readerId;
    }
}
