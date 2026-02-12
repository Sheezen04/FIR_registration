// src/services/chatService.ts

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
  receiverId: string;
  conversationId: string;
  content: string;
  type: "text" | "image" | "file" | "fir_share";
  firReference?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  replyTo?: string;
}

export interface Conversation {
  id: string;
  participants: ChatUser[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isPinned: boolean;
  updatedAt: string;
}

// ── Local Storage Based Chat (No Backend Needed) ──
const STORAGE_KEYS = {
  MESSAGES: "police_chat_messages",
  CONVERSATIONS: "police_chat_conversations",
  USERS: "police_chat_users",
};

// Demo police users
const DEMO_USERS: ChatUser[] = [
  {
    id: "user-1",
    name: "Inspector Rajesh Kumar",
    email: "rajesh@police.gov.in",
    station: "Central Police Station",
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-2",
    name: "SI Priya Sharma",
    email: "priya@police.gov.in",
    station: "South Zone Station",
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-3",
    name: "ASI Mohammed Khan",
    email: "khan@police.gov.in",
    station: "East Division",
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "user-4",
    name: "Inspector Deepa Nair",
    email: "deepa@police.gov.in",
    station: "Cyber Crime Cell",
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-5",
    name: "SI Arjun Patel",
    email: "arjun@police.gov.in",
    station: "Traffic Division",
    isOnline: false,
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "user-6",
    name: "DSP Kavitha Reddy",
    email: "kavitha@police.gov.in",
    station: "Crime Branch",
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-7",
    name: "Constable Suresh Yadav",
    email: "suresh@police.gov.in",
    station: "North Zone Station",
    isOnline: false,
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "user-8",
    name: "Inspector Fatima Begum",
    email: "fatima@police.gov.in",
    station: "Women's Help Desk",
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
];

// Demo messages
const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    senderId: "user-2",
    receiverId: "current",
    conversationId: "conv-1",
    content: "Sir, the suspect in FIR-2024-0042 has been spotted near Market Road.",
    type: "text",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: "read",
  },
  {
    id: "msg-2",
    senderId: "current",
    receiverId: "user-2",
    conversationId: "conv-1",
    content: "Good work! Send a patrol team immediately. I'll coordinate from here.",
    type: "text",
    timestamp: new Date(Date.now() - 240000).toISOString(),
    status: "read",
  },
  {
    id: "msg-3",
    senderId: "user-2",
    receiverId: "current",
    conversationId: "conv-1",
    content: "Patrol team dispatched. ETA 10 minutes. Also, the witness statement has been recorded.",
    type: "text",
    timestamp: new Date(Date.now() - 180000).toISOString(),
    status: "read",
  },
  {
    id: "msg-4",
    senderId: "current",
    receiverId: "user-2",
    conversationId: "conv-1",
    content: "Excellent. Keep me updated on the situation.",
    type: "text",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    status: "delivered",
  },
  {
    id: "msg-5",
    senderId: "user-4",
    receiverId: "current",
    conversationId: "conv-2",
    content: "We've traced the IP address from the cyber fraud case. Sending report.",
    type: "text",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: "read",
  },
  {
    id: "msg-6",
    senderId: "current",
    receiverId: "user-4",
    conversationId: "conv-2",
    content: "Great! Forward it to the legal team as well.",
    type: "text",
    timestamp: new Date(Date.now() - 500000).toISOString(),
    status: "read",
  },
  {
    id: "msg-7",
    senderId: "user-6",
    receiverId: "current",
    conversationId: "conv-3",
    content: "Meeting scheduled for tomorrow at 10 AM regarding the joint operation.",
    type: "text",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "read",
  },
  {
    id: "msg-8",
    senderId: "user-3",
    receiverId: "current",
    conversationId: "conv-4",
    content: "The forensic report for case #78 is ready. Shall I send it over?",
    type: "text",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: "read",
  },
  {
    id: "msg-9",
    senderId: "user-8",
    receiverId: "current",
    conversationId: "conv-5",
    content: "New complaint registered at Women's Help Desk. FIR reference shared.",
    type: "text",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    status: "read",
  },
];

const getStoredData = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const storeData = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const chatService = {
  // Get all police users (excluding current user)
  getUsers: (): ChatUser[] => {
    return getStoredData(STORAGE_KEYS.USERS, DEMO_USERS);
  },

  // Get conversations for current user
  getConversations: (): Conversation[] => {
    const messages = chatService.getAllMessages();
    const users = chatService.getUsers();
    const conversationMap = new Map<string, Conversation>();

    messages.forEach((msg) => {
      const otherUserId =
        msg.senderId === "current" ? msg.receiverId : msg.senderId;
      const otherUser = users.find((u) => u.id === otherUserId);

      if (!otherUser) return;

      if (!conversationMap.has(msg.conversationId)) {
        conversationMap.set(msg.conversationId, {
          id: msg.conversationId,
          participants: [otherUser],
          lastMessage: msg,
          unreadCount: 0,
          isPinned: false,
          updatedAt: msg.timestamp,
        });
      } else {
        const conv = conversationMap.get(msg.conversationId)!;
        if (
          new Date(msg.timestamp) > new Date(conv.lastMessage?.timestamp || 0)
        ) {
          conv.lastMessage = msg;
          conv.updatedAt = msg.timestamp;
        }
      }

      // Count unread
      if (msg.senderId !== "current" && msg.status !== "read") {
        const conv = conversationMap.get(msg.conversationId)!;
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  // Get all messages
  getAllMessages: (): ChatMessage[] => {
    return getStoredData(STORAGE_KEYS.MESSAGES, DEMO_MESSAGES);
  },

  // Get messages for a conversation
  getMessages: (conversationId: string): ChatMessage[] => {
    const messages = chatService.getAllMessages();
    return messages
      .filter((m) => m.conversationId === conversationId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  },

  // Send a message
  sendMessage: (
    receiverId: string,
    content: string,
    conversationId: string,
    type: "text" | "fir_share" = "text",
    firReference?: string,
    replyTo?: string
  ): ChatMessage => {
    const messages = chatService.getAllMessages();
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: "current",
      receiverId,
      conversationId,
      content,
      type,
      firReference,
      timestamp: new Date().toISOString(),
      status: "sent",
      replyTo,
    };
    messages.push(newMessage);
    storeData(STORAGE_KEYS.MESSAGES, messages);

    // Simulate delivery after 1s
    setTimeout(() => {
      const msgs = chatService.getAllMessages();
      const msg = msgs.find((m) => m.id === newMessage.id);
      if (msg) {
        msg.status = "delivered";
        storeData(STORAGE_KEYS.MESSAGES, msgs);
      }
    }, 1000);

    // Simulate auto-reply after 3-8s
    setTimeout(
      () => {
        const autoReplies = [
          "Roger that. Will follow up.",
          "Understood. Taking necessary action.",
          "Copy that. Updating the records.",
          "Acknowledged. Will report back soon.",
          "Got it. Coordinating with the team.",
          "Thanks for the update. Will proceed accordingly.",
          "Noted. Sending a team to investigate.",
          "Received. Will keep you posted.",
        ];
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          senderId: receiverId,
          receiverId: "current",
          conversationId,
          content:
            autoReplies[Math.floor(Math.random() * autoReplies.length)],
          type: "text",
          timestamp: new Date().toISOString(),
          status: "delivered",
        };
        const msgs = chatService.getAllMessages();
        msgs.push(reply);
        storeData(STORAGE_KEYS.MESSAGES, msgs);
      },
      3000 + Math.random() * 5000
    );

    return newMessage;
  },

  // Start new conversation
  startConversation: (userId: string): string => {
    const existingConvs = chatService.getConversations();
    const existing = existingConvs.find((c) =>
      c.participants.some((p) => p.id === userId)
    );
    if (existing) return existing.id;
    return `conv-${Date.now()}`;
  },

  // Mark messages as read
  markAsRead: (conversationId: string): void => {
    const messages = chatService.getAllMessages();
    messages.forEach((m) => {
      if (m.conversationId === conversationId && m.senderId !== "current") {
        m.status = "read";
      }
    });
    storeData(STORAGE_KEYS.MESSAGES, messages);
  },

  // Delete a message
  deleteMessage: (messageId: string): void => {
    const messages = chatService.getAllMessages();
    const filtered = messages.filter((m) => m.id !== messageId);
    storeData(STORAGE_KEYS.MESSAGES, filtered);
  },

  // Search messages
  searchMessages: (query: string): ChatMessage[] => {
    const messages = chatService.getAllMessages();
    return messages.filter((m) =>
      m.content.toLowerCase().includes(query.toLowerCase())
    );
  },
};