// src/pages/Police/PoliceChat.tsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  chatService,
  ChatUser,
  ChatMessage,
  Conversation,
} from "@/services/chatService";
import {
  Shield,
  FileText,
  Scale,
  Users,
  Calendar,
  MessageCircle,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  Pin,
  Trash2,
  Reply,
  Copy,
  X,
  Image,
  ChevronDown,
  Circle,
  UserPlus,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", href: "/police/dashboard", icon: <Shield className="h-4 w-4" /> },
  { label: "Calendar", href: "/police/calendar", icon: <Calendar className="h-4 w-4" /> },
  { label: "Chat", href: "/police/chat", icon: <MessageCircle className="h-4 w-4" /> },
  { label: "Rules & Laws", href: "/police/rules", icon: <Scale className="h-4 w-4" /> },
];

// ── Helper Functions ──
const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-IN", { weekday: "short" });
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatChatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getDateLabel = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (id: string): string => {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-violet-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
    "from-lime-500 to-green-600",
    "from-fuchsia-500 to-purple-600",
  ];
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
};

// ── Message Status Icon ──
const MessageStatus = ({ status }: { status: string }) => {
  switch (status) {
    case "sent":
      return <Check className="w-3.5 h-3.5 text-slate-400" />;
    case "delivered":
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    case "read":
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  }
};

// ── Online Status Dot ──
const OnlineStatus = ({
  isOnline,
  size = "sm",
}: {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full border-2 border-white ${
        isOnline ? "bg-green-500" : "bg-slate-400"
      }`}
    />
  );
};

export default function PoliceChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allUsers = chatService.getUsers();

  // ── Load Data ──
  const loadConversations = useCallback(() => {
    setConversations(chatService.getConversations());
  }, []);

  const loadMessages = useCallback((convId: string) => {
    setMessages(chatService.getMessages(convId));
  }, []);

  useEffect(() => {
    loadConversations();

    // Check mobile
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [loadConversations]);

  // Poll for new messages
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadConversations();
      if (activeConversation) {
        loadMessages(activeConversation);
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeConversation, loadConversations, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Active conversation data ──
  const activeConvData = useMemo(
    () => conversations.find((c) => c.id === activeConversation),
    [conversations, activeConversation]
  );

  const activeUser = activeConvData?.participants[0];

  // ── Filtered conversations ──
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participants.some(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.station.toLowerCase().includes(query)
        ) ||
        c.lastMessage?.content.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // ── Filtered users for new chat ──
  const filteredUsers = useMemo(() => {
    const existingUserIds = conversations.flatMap((c) =>
      c.participants.map((p) => p.id)
    );
    let users = allUsers;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.station.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }
    return users;
  }, [allUsers, searchQuery, conversations]);

  // ── Group messages by date ──
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.timestamp);
      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        groups.push({ date: dateLabel, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  // ── Select conversation ──
  const selectConversation = (convId: string) => {
    setActiveConversation(convId);
    chatService.markAsRead(convId);
    loadMessages(convId);
    loadConversations();
    setShowUserList(false);
    if (isMobileView) setShowChatOnMobile(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Start new chat ──
  const startNewChat = (userId: string) => {
    const convId = chatService.startConversation(userId);
    setActiveConversation(convId);
    loadMessages(convId);
    setShowUserList(false);
    if (isMobileView) setShowChatOnMobile(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Send message ──
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation || !activeUser) return;

    chatService.sendMessage(
      activeUser.id,
      newMessage.trim(),
      activeConversation,
      "text",
      undefined,
      replyingTo?.id
    );

    setNewMessage("");
    setReplyingTo(null);
    loadMessages(activeConversation);
    loadConversations();

    // Simulate typing indicator
    setTimeout(() => setIsTyping(true), 1500);
    setTimeout(() => {
      setIsTyping(false);
      loadMessages(activeConversation);
      loadConversations();
    }, 4000 + Math.random() * 4000);
  };

  // ── Handle key press ──
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Delete message ──
  const deleteMessage = (msgId: string) => {
    chatService.deleteMessage(msgId);
    if (activeConversation) {
      loadMessages(activeConversation);
      loadConversations();
    }
  };

  // ── Copy message ──
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // ── Back to list (mobile) ──
  const goBackToList = () => {
    setShowChatOnMobile(false);
    setActiveConversation(null);
  };

  // Total unread
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <DashboardLayout title="Police Chat" navItems={navItems}>
      <div className="h-[calc(100vh-130px)] flex rounded-2xl overflow-hidden border-2 border-slate-200 shadow-2xl bg-white">
        {/* ══════════ LEFT SIDEBAR — Conversation List ══════════ */}
        <div
          className={`${
            isMobileView && showChatOnMobile ? "hidden" : "flex"
          } flex-col w-full md:w-[380px] md:min-w-[380px] border-r-2 border-slate-200 bg-white`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name ? getInitials(user.name) : "ME"}
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">
                    {user?.name || "Officer"}
                  </h2>
                  <p className="text-white/50 text-xs">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-2">
                    {totalUnread}
                  </Badge>
                )}
                <button
                  onClick={() => setShowUserList(!showUserList)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search chats or officers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:bg-slate-600"
              />
            </div>
          </div>

          {/* User List (New Chat) */}
          <AnimatePresence>
            {showUserList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b-2 border-slate-200 overflow-hidden"
              >
                <div className="p-3 bg-indigo-50">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                    Start New Chat
                  </p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {filteredUsers.map((chatUser) => (
                      <button
                        key={chatUser.id}
                        onClick={() => startNewChat(chatUser.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white transition-all"
                      >
                        <div className="relative">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(chatUser.id)} flex items-center justify-center text-white font-bold text-xs`}
                          >
                            {getInitials(chatUser.name)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineStatus isOnline={chatUser.isOnline} />
                          </div>
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {chatUser.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {chatUser.station}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No conversations yet</p>
                <p className="text-slate-400 text-sm mt-1">
                  Click + to start a new chat
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const participant = conv.participants[0];
                const isActive = conv.id === activeConversation;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-slate-100 transition-all hover:bg-slate-50 ${
                      isActive ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(participant.id)} flex items-center justify-center text-white font-bold text-sm`}
                      >
                        {getInitials(participant.name)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineStatus isOnline={participant.isOnline} size="md" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            isActive ? "text-indigo-700" : "text-slate-800"
                          }`}
                        >
                          {participant.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.lastMessage
                            ? formatMessageTime(conv.lastMessage.timestamp)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          {conv.lastMessage?.senderId === "current" && (
                            <MessageStatus
                              status={conv.lastMessage.status}
                            />
                          )}
                          {conv.lastMessage?.content || "Start chatting..."}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {participant.station}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══════════ RIGHT SIDE — Chat Area ══════════ */}
        <div
          className={`${
            isMobileView && !showChatOnMobile ? "hidden" : "flex"
          } flex-1 flex-col bg-slate-50`}
        >
          {!activeConversation || !activeUser ? (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-700 mb-2">
                  Police Chat
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Select a conversation or start a new chat with fellow officers
                  to coordinate on cases.
                </p>
                <button
                  onClick={() => setShowUserList(true)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Start New Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Chat Header ── */}
              <div className="flex items-center justify-between px-5 py-3 bg-white border-b-2 border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  {isMobileView && (
                    <button
                      onClick={goBackToList}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors mr-1"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                  )}
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(activeUser.id)} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {getInitials(activeUser.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineStatus isOnline={activeUser.isOnline} size="md" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {activeUser.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isTyping ? (
                        <span className="text-green-600 font-medium">
                          typing...
                        </span>
                      ) : activeUser.isOnline ? (
                        <span className="text-green-600">Online</span>
                      ) : (
                        `Last seen ${formatMessageTime(activeUser.lastSeen)}`
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Phone className="w-5 h-5 text-slate-500" />
                  </button>
                  <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Video className="w-5 h-5 text-slate-500" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <MoreVertical className="w-5 h-5 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Search className="w-4 h-4 mr-2" /> Search in chat
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pin className="w-4 h-4 mr-2" /> Pin conversation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ── Messages Area ── */}
              <div
                className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      No messages yet
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((group, groupIdx) => (
                    <div key={groupIdx}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-4">
                        <span className="px-4 py-1.5 bg-white rounded-full text-xs font-semibold text-slate-500 shadow-sm border border-slate-200">
                          {group.date}
                        </span>
                      </div>

                      {/* Messages */}
                      {group.messages.map((msg, msgIdx) => {
                        const isMine = msg.senderId === "current";
                        const showAvatar =
                          !isMine &&
                          (msgIdx === 0 ||
                            group.messages[msgIdx - 1]?.senderId === "current");

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2, delay: msgIdx * 0.03 }}
                            className={`flex items-end gap-2 mb-1 ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            {/* Avatar for other user */}
                            {!isMine && showAvatar ? (
                              <div
                                className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(msg.senderId)} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
                              >
                                {activeUser
                                  ? getInitials(activeUser.name)
                                  : "?"}
                              </div>
                            ) : !isMine ? (
                              <div className="w-7 shrink-0" />
                            ) : null}

                            {/* Message bubble */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div
                                  className={`group relative max-w-[75%] px-4 py-2.5 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                                    isMine
                                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-md"
                                      : "bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100"
                                  }`}
                                >
                                  {/* Reply reference */}
                                  {msg.replyTo && (
                                    <div
                                      className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                                        isMine
                                          ? "bg-indigo-400/30 border-white/50"
                                          : "bg-slate-100 border-indigo-400"
                                      }`}
                                    >
                                      <p className="truncate opacity-80">
                                        {messages.find(
                                          (m) => m.id === msg.replyTo
                                        )?.content || "Original message"}
                                      </p>
                                    </div>
                                  )}

                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>

                                  <div
                                    className={`flex items-center justify-end gap-1.5 mt-1 ${
                                      isMine ? "text-indigo-200" : "text-slate-400"
                                    }`}
                                  >
                                    <span className="text-[10px]">
                                      {formatChatTime(msg.timestamp)}
                                    </span>
                                    {isMine && (
                                      <MessageStatus status={msg.status} />
                                    )}
                                  </div>
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align={isMine ? "end" : "start"}
                                className="w-40"
                              >
                                <DropdownMenuItem
                                  onClick={() => setReplyingTo(msg)}
                                >
                                  <Reply className="w-4 h-4 mr-2" /> Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyMessage(msg.content)}
                                >
                                  <Copy className="w-4 h-4 mr-2" /> Copy
                                </DropdownMenuItem>
                                {isMine && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteMessage(msg.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />{" "}
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-end gap-2"
                    >
                      <div
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(activeUser?.id || "")} flex items-center justify-center text-white font-bold text-[10px]`}
                      >
                        {activeUser ? getInitials(activeUser.name) : "?"}
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                        <div className="flex gap-1.5">
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* ── Reply Bar ── */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-indigo-500 rounded-full" />
                        <div>
                          <p className="text-xs font-bold text-indigo-600">
                            Replying to{" "}
                            {replyingTo.senderId === "current"
                              ? "yourself"
                              : activeUser?.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[300px]">
                            {replyingTo.content}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Message Input ── */}
              <div className="px-4 py-3 bg-white border-t-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Smile className="w-5 h-5 text-slate-500" />
                  </button>
                  <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Paperclip className="w-5 h-5 text-slate-500" />
                  </button>

                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message..."
                      className="pr-4 bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      newMessage.trim()
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-110 hover:shadow-lg shadow-indigo-200 active:scale-95"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}