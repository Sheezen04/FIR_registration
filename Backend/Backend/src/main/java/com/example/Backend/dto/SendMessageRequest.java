package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private Long receiverId;
    private String content;
    private String type;        // TEXT, IMAGE, VIDEO, AUDIO, PDF, FILE, FIR_SHARE
    private String firReference;
    private Long replyToId;
}
