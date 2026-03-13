package com.example.Backend.controller;

import com.example.Backend.dto.ChatMessageDTO;
import com.example.Backend.dto.ChatUserDTO;
import com.example.Backend.dto.ConversationDTO;
import com.example.Backend.entity.User;
import com.example.Backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for chat operations (history, conversations, police users).
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin
public class ChatRestController {

    private final ChatService chatService;

    /**
     * Get all conversations for the current user.
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getConversations(user.getId()));
    }

    /**
     * Get message history with another user.
     */
    @GetMapping("/messages/{otherUserId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(
            @AuthenticationPrincipal User user,
            @PathVariable Long otherUserId) {
        return ResponseEntity.ok(chatService.getMessages(user.getId(), otherUserId));
    }

    /**
     * Mark all messages from a sender as read.
     */
    @PostMapping("/messages/read/{senderId}")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long senderId) {
        int count = chatService.markAsRead(senderId, user.getId());
        return ResponseEntity.ok(Map.of("markedAsRead", count));
    }

    /**
     * Delete a message.
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long messageId) {
        chatService.deleteMessage(messageId, user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Get all police users (excluding current user) with online status.
     */
    @GetMapping("/police-users")
    public ResponseEntity<List<ChatUserDTO>> getPoliceUsers(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getPoliceUsers(user.getId()));
    }

    /**
     * Get current user info (for chat context).
     */
    @GetMapping("/me")
    public ResponseEntity<ChatUserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.toUserDTO(user));
    }
}
