package com.example.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_sender_receiver", columnList = "sender_id, receiver_id"),
    @Index(name = "idx_receiver_status", columnList = "receiver_id, status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type = MessageType.TEXT;

    private String firReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageStatus status = MessageStatus.SENT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private ChatMessage replyTo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
