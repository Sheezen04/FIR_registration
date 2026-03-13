package com.example.Backend.repository;

import com.example.Backend.entity.ChatMessage;
import com.example.Backend.entity.MessageStatus;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Get messages between two users, ordered by time
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findMessagesBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Get all messages involving a user (for building conversations list)
    @Query("SELECT m FROM ChatMessage m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.createdAt DESC")
    List<ChatMessage> findAllByUser(@Param("userId") Long userId);

    // Count unread messages from a specific sender to a specific receiver
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.status != 'READ'")
    int countUnreadMessages(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    // Mark all messages from sender to receiver as read
    @Modifying
    @Query("UPDATE ChatMessage m SET m.status = :status WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.status != :status")
    int markMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId, @Param("status") MessageStatus status);

    // Get the latest message between two users
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.createdAt DESC LIMIT 1")
    ChatMessage findLatestMessageBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Find distinct user IDs that the given user has chatted with
    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver.id ELSE m.sender.id END " +
           "FROM ChatMessage m WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    List<Long> findChatPartnerIds(@Param("userId") Long userId);

    // Delete a message
    void deleteById(Long id);
}
