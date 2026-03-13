package com.example.Backend.service;

import com.example.Backend.dto.ChatMessageDTO;
import com.example.Backend.dto.ChatUserDTO;
import com.example.Backend.dto.ConversationDTO;
import com.example.Backend.entity.*;
import com.example.Backend.repository.ChatMessageRepository;
import com.example.Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final OnlineStatusService onlineStatusService;

    // ── Send a message ──
    @Transactional
    public ChatMessageDTO sendMessage(Long senderId, Long receiverId, String content, String type,
                                       String firReference, Long replyToId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .type(MessageType.valueOf(type != null ? type.toUpperCase() : "TEXT"))
                .firReference(firReference)
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .build();

        if (replyToId != null) {
            ChatMessage replyTo = chatMessageRepository.findById(replyToId).orElse(null);
            message.setReplyTo(replyTo);
        }

        ChatMessage saved = chatMessageRepository.save(message);

        // Auto-mark as delivered if receiver is online
        if (onlineStatusService.isOnline(receiverId)) {
            saved.setStatus(MessageStatus.DELIVERED);
            chatMessageRepository.save(saved);
        }

        return toDTO(saved);
    }

    // ── Get messages between two users ──
    public List<ChatMessageDTO> getMessages(Long userId1, Long userId2) {
        List<ChatMessage> messages = chatMessageRepository.findMessagesBetweenUsers(userId1, userId2);
        return messages.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Get all conversations for a user ──
    public List<ConversationDTO> getConversations(Long userId) {
        List<Long> partnerIds = chatMessageRepository.findChatPartnerIds(userId);

        List<ConversationDTO> conversations = new ArrayList<>();
        for (Long partnerId : partnerIds) {
            User partner = userRepository.findById(partnerId).orElse(null);
            if (partner == null) continue;

            ChatMessage lastMessage = chatMessageRepository.findLatestMessageBetweenUsers(userId, partnerId);
            int unreadCount = chatMessageRepository.countUnreadMessages(partnerId, userId);

            ConversationDTO conv = ConversationDTO.builder()
                    .otherUser(toUserDTO(partner))
                    .lastMessage(lastMessage != null ? toDTO(lastMessage) : null)
                    .unreadCount(unreadCount)
                    .updatedAt(lastMessage != null ? lastMessage.getCreatedAt().atOffset(ZoneOffset.UTC).toString() : null)
                    .build();

            conversations.add(conv);
        }

        // Sort by latest message
        conversations.sort((a, b) -> {
            if (a.getUpdatedAt() == null) return 1;
            if (b.getUpdatedAt() == null) return -1;
            return b.getUpdatedAt().compareTo(a.getUpdatedAt());
        });

        return conversations;
    }

    // ── Mark messages as read ──
    @Transactional
    public int markAsRead(Long senderId, Long receiverId) {
        return chatMessageRepository.markMessagesAsRead(senderId, receiverId, MessageStatus.READ);
    }

    // ── Delete a message ──
    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        // Only sender can delete
        if (!msg.getSender().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own messages");
        }
        chatMessageRepository.deleteById(messageId);
    }

    // ── Get all police users (for "start new chat") ──
    public List<ChatUserDTO> getPoliceUsers(Long excludeUserId) {
        List<User> policeUsers = userRepository.findByRole(Role.POLICE);
        return policeUsers.stream()
                .filter(u -> !u.getId().equals(excludeUserId))
                .map(this::toUserDTO)
                .collect(Collectors.toList());
    }

    // ── DTO Mappers ──
    public ChatMessageDTO toDTO(ChatMessage msg) {
        ChatMessageDTO dto = ChatMessageDTO.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .receiverId(msg.getReceiver().getId())
                .receiverName(msg.getReceiver().getName())
                .content(msg.getContent())
                .type(msg.getType().name())
                .firReference(msg.getFirReference())
                .status(msg.getStatus().name())
                .timestamp(msg.getCreatedAt().atOffset(ZoneOffset.UTC).toString())
                .build();

        if (msg.getReplyTo() != null) {
            dto.setReplyToId(msg.getReplyTo().getId());
            dto.setReplyToContent(msg.getReplyTo().getContent());
        }

        return dto;
    }

    public ChatUserDTO toUserDTO(User user) {
        return ChatUserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .station(user.getStation())
                .online(onlineStatusService.isOnline(user.getId()))
                .lastSeen(onlineStatusService.getLastSeen(user.getId()))
                .build();
    }
}
