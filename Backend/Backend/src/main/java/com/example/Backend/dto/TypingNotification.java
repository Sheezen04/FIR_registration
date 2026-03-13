package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingNotification {
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private boolean typing;
}
