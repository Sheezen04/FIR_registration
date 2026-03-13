package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String content;
    private String type;       // TEXT, IMAGE, VIDEO, AUDIO, PDF, FILE, FIR_SHARE
    private String firReference;
    private String status;     // SENT, DELIVERED, READ
    private Long replyToId;
    private String replyToContent;
    private String timestamp;
}
