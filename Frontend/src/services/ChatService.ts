// src/services/chatService.ts
// Real backend-powered chat service with WebSocket support

import { Client, IMessage } from "@stomp/stompjs";
import api from "./api";

// ── Types ──

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  station: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  receiverName?: string;
  conversationId: string; // derived: "conv-{min}-{max}"
  content: string;
  type: "text" | "image" | "file" | "fir_share" | "video" | "audio" | "pdf";
  firReference?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  replyToContent?: string;
}

export interface Conversation {
  id: string;
  participants: ChatUser[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isPinned: boolean;
  updatedAt: string;
}

// ── Backend DTO types (from API) ──

interface BackendChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  type: string;
  firReference?: string;
  status: string;
  replyToId?: number;
  replyToContent?: string;
  timestamp: string;
}

interface BackendChatUser {
  id: number;
  name: string;
  email: string;
  station: string;
  online: boolean;
  lastSeen: string;
}

interface BackendConversation {
  otherUser: BackendChatUser;
  lastMessage: BackendChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

// ── Mappers ──

function makeConversationId(id1: string, id2: string): string {
  const a = parseInt(id1);
  const b = parseInt(id2);
  return `conv-${Math.min(a, b)}-${Math.max(a, b)}`;
}

function mapUser(u: BackendChatUser): ChatUser {
  return {
    id: u.id.toString(),
    name: u.name,
    email: u.email,
    station: u.station || "",
    isOnline: u.online,
    lastSeen: u.lastSeen || new Date().toISOString(),
  };
}

function mapMessage(m: BackendChatMessage, currentUserId: string): ChatMessage {
  return {
    id: m.id.toString(),
    senderId: m.senderId.toString(),
    senderName: m.senderName,
    receiverId: m.receiverId.toString(),
    receiverName: m.receiverName,
    conversationId: makeConversationId(m.senderId.toString(), m.receiverId.toString()),
    content: m.content,
    type: m.type.toLowerCase() as ChatMessage["type"],
    firReference: m.firReference,
    timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
    status: m.status.toLowerCase() as ChatMessage["status"],
    replyTo: m.replyToId?.toString(),
    replyToContent: m.replyToContent,
  };
}

function mapConversation(c: BackendConversation, currentUserId: string): Conversation {
  const otherUser = mapUser(c.otherUser);
  const convId = makeConversationId(currentUserId, otherUser.id);
  return {
    id: convId,
    participants: [otherUser],
    lastMessage: c.lastMessage ? mapMessage(c.lastMessage, currentUserId) : null,
    unreadCount: c.unreadCount,
    isPinned: false,
    updatedAt: c.updatedAt || new Date().toISOString(),
  };
}

// ── WebSocket Manager ──

type MessageCallback = (msg: ChatMessage) => void;
type TypingCallback = (data: { senderId: string; senderName: string; typing: boolean }) => void;
type StatusCallback = (data: { userId: string; userName: string; online: boolean; lastSeen: string }) => void;
type ReadReceiptCallback = (data: { senderId: string; readerId: string }) => void;

class WebSocketManager {
  private client: Client | null = null;
  private connected = false;
  private userId: string | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private readReceiptCallbacks: ReadReceiptCallback[] = [];

  connect(userId: string, token: string) {
    if (this.connected && this.userId === userId) return;
    this.userId = userId;

    // Disconnect existing connection
    this.disconnect();

    // Build the WebSocket URL based on the current page location
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        token: token,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        // Uncomment for debugging: console.log("[STOMP]", str);
      },
      onConnect: () => {
        this.connected = true;
        console.log("[Chat] WebSocket connected for user:", userId);
        this.subscribeAll();
      },
      onStompError: (frame) => {
        console.error("[Chat] STOMP error:", frame.headers["message"]);
      },
      onDisconnect: () => {
        this.connected = false;
        console.log("[Chat] WebSocket disconnected");
      },
    });

    this.client.activate();
  }

  private subscribeAll() {
    if (!this.client || !this.userId) return;

    // Subscribe to personal messages
    this.client.subscribe(`/topic/user.${this.userId}.messages`, (msg: IMessage) => {
      const data: BackendChatMessage = JSON.parse(msg.body);
      const mapped = mapMessage(data, this.userId!);
      this.messageCallbacks.forEach((cb) => cb(mapped));
    });

    // Subscribe to typing notifications
    this.client.subscribe(`/topic/user.${this.userId}.typing`, (msg: IMessage) => {
      const data = JSON.parse(msg.body);
      this.typingCallbacks.forEach((cb) =>
        cb({
          senderId: data.senderId?.toString(),
          senderName: data.senderName,
          typing: data.typing,
        })
      );
    });

    // Subscribe to online/offline status broadcasts
    this.client.subscribe("/topic/status", (msg: IMessage) => {
      const data = JSON.parse(msg.body);
      this.statusCallbacks.forEach((cb) =>
        cb({
          userId: data.userId?.toString(),
          userName: data.userName,
          online: data.online,
          lastSeen: data.lastSeen,
        })
      );
    });

    // Subscribe to read receipts
    this.client.subscribe(`/topic/user.${this.userId}.read-receipt`, (msg: IMessage) => {
      const data = JSON.parse(msg.body);
      this.readReceiptCallbacks.forEach((cb) =>
        cb({
          senderId: data.senderId?.toString(),
          readerId: data.readerId?.toString(),
        })
      );
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  // ── Send via WebSocket ──

  sendMessage(receiverId: string, content: string, type: string, firReference?: string, replyToId?: string) {
    if (!this.client || !this.connected) {
      console.warn("[Chat] Not connected, cannot send message");
      return;
    }
    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({
        receiverId: parseInt(receiverId),
        content,
        type: type.toUpperCase(),
        firReference: firReference || null,
        replyToId: replyToId ? parseInt(replyToId) : null,
      }),
    });
  }

  sendTyping(receiverId: string, typing: boolean) {
    if (!this.client || !this.connected) return;
    this.client.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        receiverId: parseInt(receiverId),
        typing,
      }),
    });
  }

  sendReadReceipt(senderId: string) {
    if (!this.client || !this.connected) return;
    this.client.publish({
      destination: "/app/chat.read",
      body: JSON.stringify({
        senderId: parseInt(senderId),
      }),
    });
  }

  // ── Callbacks ──

  onMessage(cb: MessageCallback) {
    this.messageCallbacks.push(cb);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((c) => c !== cb);
    };
  }

  onTyping(cb: TypingCallback) {
    this.typingCallbacks.push(cb);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter((c) => c !== cb);
    };
  }

  onStatusChange(cb: StatusCallback) {
    this.statusCallbacks.push(cb);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((c) => c !== cb);
    };
  }

  onReadReceipt(cb: ReadReceiptCallback) {
    this.readReceiptCallbacks.push(cb);
    return () => {
      this.readReceiptCallbacks = this.readReceiptCallbacks.filter((c) => c !== cb);
    };
  }

  isConnected() {
    return this.connected;
  }
}

// Singleton WebSocket manager
export const wsManager = new WebSocketManager();

// ── Chat Service (REST + WS) ──

export const chatService = {
  // Get all police users (excluding current user)
  getUsers: async (): Promise<ChatUser[]> => {
    const res = await api.get<BackendChatUser[]>("/chat/police-users");
    return res.data.map(mapUser);
  },

  // Get conversations for current user
  getConversations: async (currentUserId: string): Promise<Conversation[]> => {
    const res = await api.get<BackendConversation[]>("/chat/conversations");
    return res.data.map((c) => mapConversation(c, currentUserId));
  },

  // Get messages between current user and another user
  getMessages: async (otherUserId: string, currentUserId: string): Promise<ChatMessage[]> => {
    const res = await api.get<BackendChatMessage[]>(`/chat/messages/${otherUserId}`);
    return res.data.map((m) => mapMessage(m, currentUserId));
  },

  // Mark messages from a user as read (REST call + WebSocket notification)
  markAsRead: async (senderId: string): Promise<void> => {
    await api.post(`/api/chat/messages/read/${senderId}`);
    wsManager.sendReadReceipt(senderId);
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(`/api/chat/messages/${messageId}`);
  },

  // Send message via WebSocket (real-time)
  sendMessage: (receiverId: string, content: string, type: string = "TEXT", firReference?: string, replyToId?: string) => {
    wsManager.sendMessage(receiverId, content, type, firReference, replyToId);
  },

  // Send typing indicator
  sendTyping: (receiverId: string, typing: boolean) => {
    wsManager.sendTyping(receiverId, typing);
  },

  // Get current user info for chat
  getCurrentUser: async (): Promise<ChatUser> => {
    const res = await api.get<BackendChatUser>("/chat/me");
    return mapUser(res.data);
  },
};