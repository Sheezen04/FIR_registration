package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private ChatUserDTO otherUser;
    private ChatMessageDTO lastMessage;
    private int unreadCount;
    private String updatedAt;
}
