import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  chatService,
  wsManager,
  ChatMessage,
  Conversation,
  ChatUser,
} from "@/services/ChatService";
import { fileApi } from "@/services/api"; 
import {
  Shield,
  Scale,
  Calendar,
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  ArrowLeft,
  Trash2,
  Reply,
  X,
  UserPlus,
  Image as ImageIcon,
  FileText,
  Video as VideoIcon,
  Headphones,
  Download,
  Pin,
  PinOff,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Navigation Items ──
const navItems = [
  { label: "Dashboard", href: "/police/dashboard", icon: <Shield className="h-4 w-4" /> },
  { label: "Calendar of F.I.Rs", href: "/police/calendar", icon: <Calendar className="h-4 w-4" /> },
  { label: "Chat", href: "/police/chat", icon: <MessageCircle className="h-4 w-4" /> },
  { label: "Rules & Laws", href: "/police/rules", icon: <Scale className="h-4 w-4" /> },
];

// ── Helper Functions ──
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const diffMins = Math.floor((new Date().getTime() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatChatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getAvatarColor = (id: string) => {
  const colors = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-purple-500 to-violet-600", "from-rose-500 to-pink-600", "from-amber-500 to-orange-600"];
  return colors[id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length];
};

const MessageStatus = ({ status }: { status: string }) => {
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
  return <Check className="w-3.5 h-3.5 text-slate-400" />;
};

const OnlineStatus = ({ isOnline, size = "sm" }: { isOnline: boolean; size?: "sm" | "md" }) => (
  <div className={`${size === "md" ? "w-3 h-3" : "w-2.5 h-2.5"} rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
);

// ── Circular Progress Component ──
const CircularProgress = ({ progress, onClick }: { progress: number; onClick: (e: React.MouseEvent) => void }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center cursor-pointer" onClick={onClick}>
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle cx="20" cy="20" r={radius} stroke="rgba(0,0,0,0.1)" strokeWidth="3" fill="none" />
        <circle cx="20" cy="20" r={radius} stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-200 ease-linear text-indigo-600" />
      </svg>
      <X className="w-4 h-4 z-10 text-slate-500 hover:text-red-500" />
    </div>
  );
};

const PRESET_EMOJIS = ["👍", "👋", "👮", "🚓", "🚨", "📝", "✅", "❌", "📍", "📅", "⚖️", "📷", "🔍", "🛑", "⭐", "🤝"];

export default function PoliceChat() {
  const { user, token } = useAuth();
  const currentUserId = user?.id || "";
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(true);
  const [policeUsers, setPoliceUsers] = useState<ChatUser[]>([]);
  
  // ── Reply State ──
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  
  // UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── NEW FEATURES STATES ──
  const [pinnedChatIds, setPinnedChatIds] = useState<Set<string>>(new Set());
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Download State
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadedFiles, setDownloadedFiles] = useState<Record<string, boolean>>({});

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true); 
  
  // Ref to store message elements for scrolling
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatSearchInputRef = useRef<HTMLInputElement>(null);

  // ── Derived active conversation and user ──
  const activeConversation = useMemo(() => {
    if (!activeOtherUserId) return null;
    return conversations.find(c => c.participants[0]?.id === activeOtherUserId) || null;
  }, [conversations, activeOtherUserId]);

  const activeUser = activeConversation?.participants[0] || policeUsers.find(u => u.id === activeOtherUserId) || null;

  const isTyping = activeOtherUserId ? typingUsers[activeOtherUserId] || false : false;

  // ── Load Data (async) ──
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const convs = await chatService.getConversations(currentUserId);
      setConversations(convs);
    } catch (err) {
      console.error("[Chat] Failed to load conversations:", err);
    }
  }, [currentUserId]);

  const loadMessages = useCallback(async (otherUserId: string) => {
    if (!currentUserId) return;
    try {
      const msgs = await chatService.getMessages(otherUserId, currentUserId);
      setMessages(msgs);
    } catch (err) {
      console.error("[Chat] Failed to load messages:", err);
    }
  }, [currentUserId]);

  const loadPoliceUsers = useCallback(async () => {
    try {
      const users = await chatService.getUsers();
      setPoliceUsers(users);
    } catch (err) {
      console.error("[Chat] Failed to load police users:", err);
    }
  }, []);

  // ── WebSocket Connection ──
  useEffect(() => {
    if (!currentUserId || !token) return;

    wsManager.connect(currentUserId, token);

    const init = async () => {
      await loadPoliceUsers();
      await loadConversations();
    };

    init();

    const unsubMsg = wsManager.onMessage((msg) => {
      setMessages(prev => {
        const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        if (otherUserId === activeOtherUserId) {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });
      loadConversations();
    });

    const unsubTyping = wsManager.onTyping((data) => {
      setTypingUsers(prev => ({ ...prev, [data.senderId]: data.typing }));
      if (data.typing) {
        setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [data.senderId]: false }));
        }, 3000);
      }
    });

    const unsubStatus = wsManager.onStatusChange((data) => {
      setConversations(prev => prev.map(c => ({
        ...c,
        participants: c.participants.map(p =>
          p.id === data.userId ? { ...p, isOnline: data.online, lastSeen: data.lastSeen } : p
        ),
      })));
      setPoliceUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, isOnline: data.online, lastSeen: data.lastSeen } : u
      ));
    });

    const unsubRead = wsManager.onReadReceipt((data) => {
      setMessages(prev => prev.map(m =>
        m.senderId === currentUserId && m.receiverId === data.readerId
          ? { ...m, status: "read" as const }
          : m
      ));
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubStatus();
      unsubRead();
      wsManager.disconnect();
    };
  }, [currentUserId, token]);

  useEffect(() => {
    if (activeOtherUserId) {
      loadMessages(activeOtherUserId);
    }
  }, [activeOtherUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const unsubMsg = wsManager.onMessage((msg) => {
      const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      if (otherUserId === activeOtherUserId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      loadConversations();
    });
    return () => unsubMsg();
  }, [activeOtherUserId, currentUserId, loadConversations]);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ── Smart Scroll Logic ──
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (activeOtherUserId && !isSearchingChat) {
      isUserAtBottomRef.current = true;
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [activeOtherUserId, isSearchingChat]);

  useEffect(() => {
    if (isUserAtBottomRef.current && !isSearchingChat) scrollToBottom();
  }, [messages, isSearchingChat]);

  const handleScroll = () => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isUserAtBottomRef.current = distanceFromBottom < 100;
  };

  // ── SEARCH LOGIC: Find Matches and Scroll ──
  useEffect(() => {
    if (!chatSearchQuery.trim()) {
      setSearchResults([]);
      setCurrentMatchIndex(0);
      return;
    }

    const query = chatSearchQuery.toLowerCase();
    // Find all message IDs that match
    const matches = messages
      .filter(m => m.content.toLowerCase().includes(query))
      .map(m => m.id);
    
    setSearchResults(matches);
    
    // Reset to last match (newest) when query changes
    if (matches.length > 0) {
      setCurrentMatchIndex(matches.length - 1);
    }
  }, [chatSearchQuery, messages]);

  // Scroll to active match when index or results change
  useEffect(() => {
    if (searchResults.length > 0 && isSearchingChat) {
      const activeMsgId = searchResults[currentMatchIndex];
      const element = messageRefs.current.get(activeMsgId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, searchResults, isSearchingChat]);

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    setCurrentMatchIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    setCurrentMatchIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
  };

  // ── SORTED CONVERSATIONS ──
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = conversations.filter(c => c.participants.some(p => p.name.toLowerCase().includes(query)) || c.lastMessage?.content.toLowerCase().includes(query));
    }
    return filtered.sort((a, b) => {
      const aId = a.participants[0]?.id;
      const bId = b.participants[0]?.id;
      const aPinned = pinnedChatIds.has(aId);
      const bPinned = pinnedChatIds.has(bId);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.lastMessage?.timestamp || b.updatedAt).getTime() - new Date(a.lastMessage?.timestamp || a.updatedAt).getTime();
    });
  }, [conversations, searchQuery, pinnedChatIds]);

  // ── Actions ──
  const selectConversation = (otherUserId: string) => {
    setActiveOtherUserId(otherUserId);
    chatService.markAsRead(otherUserId).then(() => loadConversations());
    loadMessages(otherUserId);
    setShowUserList(false);
    setIsSearchingChat(false);
    setChatSearchQuery("");
    if (isMobileView) setShowChatOnMobile(true);
  };

  const togglePinChat = (e: Event | React.MouseEvent, otherUserId: string) => {
    e.stopPropagation();
    setPinnedChatIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(otherUserId)) newSet.delete(otherUserId);
      else newSet.add(otherUserId);
      return newSet;
    });
  };

  const toggleChatSearch = () => {
    setIsSearchingChat(prev => {
      if (!prev) setTimeout(() => chatSearchInputRef.current?.focus(), 100);
      else setChatSearchQuery("");
      return !prev;
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeOtherUserId || !activeUser) return;
    chatService.sendMessage(activeOtherUserId, newMessage.trim(), "TEXT", undefined, replyingTo?.id);
    setNewMessage("");
    setReplyingTo(null);
    setShowEmojiPicker(false);
    isUserAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleTyping = () => {
    if (!activeOtherUserId) return;
    chatService.sendTyping(activeOtherUserId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeOtherUserId) chatService.sendTyping(activeOtherUserId, false);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeOtherUserId && activeUser) {
      setIsUploading(true);
      try {
        let type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "PDF" = "TEXT";
        if (file.type.startsWith("image/")) type = "IMAGE";
        else if (file.type.startsWith("video/")) type = "VIDEO";
        else if (file.type.startsWith("audio/")) type = "AUDIO";
        else if (file.type === "application/pdf") type = "PDF";
        else type = "TEXT";

        const response = await fileApi.upload([file]);
        const serverFileUrl = response.data[0];

        if (!serverFileUrl) throw new Error("No URL returned from server");

        const content = type === "TEXT" ? `📎 ${file.name}` : serverFileUrl;
        chatService.sendMessage(activeOtherUserId, content, type, undefined, replyingTo?.id);
        
        isUserAtBottomRef.current = true;
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload file. Please check your connection.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const cancelDownload = (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    setDownloadProgress(prev => {
      const newState = { ...prev };
      delete newState[msgId];
      return newState;
    });
  };

  // Helper to highlight text
  const HighlightText = ({ text, highlight, isActive }: { text: string, highlight: string, isActive: boolean }) => {
    if (!highlight.trim()) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <span key={i} className={`${isActive ? "bg-orange-400 text-white" : "bg-yellow-200 text-slate-800"} font-medium px-0.5 rounded transition-colors duration-300`}>{part}</span> : 
            part
        )}
      </>
    );
  };

  const renderMessageContent = (msg: ChatMessage, isMine: boolean) => {
    // Check if this message matches search and if it is the CURRENTLY focused one
    const isMatched = searchResults.includes(msg.id);
    const isFocused = isMatched && searchResults[currentMatchIndex] === msg.id;

    const isDownloaded = downloadedFiles[msg.id] || isMine;
    const progress = downloadProgress[msg.id];
    const isDownloading = progress !== undefined;

    if (msg.type === "image") {
      return (
        <div className="relative group/image" onClick={(e) => { e.stopPropagation(); setSelectedImage(msg.content); }}>
          <img 
            src={msg.content} 
            alt="Attachment" 
            className={`rounded-lg max-h-[300px] w-auto object-cover transition-opacity cursor-pointer ${isDownloading ? "opacity-50 blur-sm" : "hover:opacity-95"}`} 
            onError={(e) => { e.currentTarget.style.display='none'; }}
          />
          {isDownloading && <div className="absolute inset-0 flex items-center justify-center"><CircularProgress progress={progress} onClick={(e) => cancelDownload(e, msg.id)} /></div>}
        </div>
      );
    }
    
    if (msg.type === "video") {
      return (
        <div className="max-w-[300px] rounded-lg overflow-hidden bg-black relative" onClick={(e) => e.stopPropagation()}>
          <video controls className="w-full max-h-[300px]"><source src={msg.content} /></video>
        </div>
      );
    }

    if (msg.type === "audio") {
      return (
        <div className={`flex items-center gap-3 p-1 min-w-[240px] ${isMine ? "text-white" : "text-slate-800"}`} onClick={(e) => e.stopPropagation()}>
           <div className={`p-2 rounded-full ${isMine ? "bg-white/20" : "bg-indigo-100"}`}><Headphones className="w-5 h-5" /></div>
          <audio controls className="h-8 w-48 opacity-90 accent-indigo-600" src={msg.content} />
        </div>
      );
    }

    if (msg.type === "pdf" || msg.type === "file") {
      const fileName = msg.content.split('/').pop() || "Document";
      return (
        <div 
          onClick={(e) => {
             e.stopPropagation();
             window.open(msg.content, "_blank");
          }}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border select-none ${isMine ? "bg-white/10 hover:bg-white/20 border-white/20" : "bg-slate-50 hover:bg-slate-100 border-slate-200"}`}
        >
          <div className="relative shrink-0">
             {isDownloading ? (
               <CircularProgress progress={progress} onClick={(e) => cancelDownload(e, msg.id)} />
             ) : (
                <div className={`p-2.5 rounded-full ${isDownloaded ? "bg-red-100" : (isMine ? "bg-white/20" : "bg-slate-200")}`}>
                  {isDownloaded ? <FileText className="w-6 h-6 text-red-600" /> : <Download className={`w-6 h-6 ${isMine ? "text-white" : "text-slate-600"}`} />}
                </div>
             )}
          </div>
          <div className="flex-1 overflow-hidden min-w-[140px]">
            <p className="text-sm font-bold truncate">{fileName.length > 20 ? fileName.substring(0, 15) + "..." : fileName}</p>
            <div className={`flex items-center gap-1.5 text-xs truncate ${isMine ? "text-indigo-100" : "text-slate-500"}`}>
              <span>Attachment</span>
            </div>
          </div>
        </div>
      );
    }

    // Text message with highlighting support
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {chatSearchQuery ? <HighlightText text={msg.content} highlight={chatSearchQuery} isActive={isFocused} /> : msg.content}
      </p>
    );
  };

  return (
    <DashboardLayout title="Police Chat" navItems={navItems}>
      <div className="h-[calc(100vh-130px)] flex rounded-2xl overflow-hidden border-2 border-slate-200 shadow-2xl bg-white relative">
        <AnimatePresence>
          {selectedImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
              <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><X className="w-6 h-6" /></button>
              <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={selectedImage} className="max-h-[90%] max-w-[90%] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div className={`${isMobileView && showChatOnMobile ? "hidden" : "flex"} flex-col w-full md:w-[380px] md:min-w-[380px] border-r-2 border-slate-200 bg-white`}>
          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">{user?.name ? getInitials(user.name) : "ME"}</div>
                <div><h2 className="text-white font-bold text-sm">{user?.name || "Officer"}</h2><p className="text-white/50 text-xs">Online</p></div>
              </div>
              <button onClick={() => setShowUserList(!showUserList)} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><UserPlus className="w-5 h-5 text-white/70" /></button>
            </div>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:bg-slate-600" /></div>
          </div>

          <AnimatePresence>
            {showUserList && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-b-2 border-slate-200 overflow-hidden">
                <div className="p-3 bg-indigo-50">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Start New Chat</p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {policeUsers && policeUsers.length > 0 ? (
                      policeUsers.map((u) => (
                        <button key={u.id} onClick={() => { selectConversation(u.id); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white transition-all">
                          <div className="relative"><div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(u.id)} flex items-center justify-center text-white font-bold text-xs`}>{getInitials(u.name)}</div><div className="absolute -bottom-0.5 -right-0.5"><OnlineStatus isOnline={u.isOnline} /></div></div>
                          <div className="text-left flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p><p className="text-xs text-slate-500 truncate">{u.station}</p></div>
                        </button>
                      )))
                    : (
                      <p className="text-slate-500 text-sm">No users found</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const participant = conv.participants[0];
                const isActive = participant.id === activeOtherUserId;
                const isPinned = pinnedChatIds.has(participant.id);
                return (
                  <button key={conv.id} onClick={() => selectConversation(participant.id)} className={`w-full flex items-center gap-3 p-4 border-b border-slate-100 transition-all hover:bg-slate-50 ${isActive ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""}`}>
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(participant.id)} flex items-center justify-center text-white font-bold text-sm`}>{getInitials(participant.name)}</div>
                      <div className="absolute -bottom-0.5 -right-0.5"><OnlineStatus isOnline={participant.isOnline} size="md" /></div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-slate-800"}`}>{participant.name}</h3>
                        <div className="flex items-center gap-1">
                          {isPinned && <Pin className="w-3 h-3 text-slate-400 rotate-45" />}
                          <span className="text-[10px] text-slate-400 shrink-0">{conv.lastMessage ? formatMessageTime(conv.lastMessage.timestamp) : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">{conv.lastMessage?.senderId === currentUserId && <MessageStatus status={conv.lastMessage.status} />}{conv.lastMessage?.content || "Start chatting..."}</p>
                        {conv.unreadCount > 0 && <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-8 h-8 text-slate-400" /></div>
                 <p className="text-sm font-semibold text-slate-600 mb-1">No conversations</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${isMobileView && !showChatOnMobile ? "hidden" : "flex"} flex-1 flex-col bg-slate-50`}>
          {!activeOtherUserId || !activeUser ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div><div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6"><MessageCircle className="w-12 h-12 text-indigo-400" /></div><h3 className="text-2xl font-black text-slate-700 mb-2">Police Chat</h3><p className="text-slate-500 max-w-sm">Secure channel for official communication.</p></div>
            </div>
          ) : (
            <>
              {/* HEADER WITH PIN & SEARCH */}
              <div className="flex items-center justify-between px-5 py-3 bg-white border-b-2 border-slate-200 shadow-sm transition-all h-[70px]">
                {isSearchingChat ? (
                  // SEARCH MODE HEADER
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 w-full">
                    <button onClick={toggleChatSearch} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        ref={chatSearchInputRef}
                        value={chatSearchQuery} 
                        onChange={(e) => setChatSearchQuery(e.target.value)} 
                        placeholder="Search in conversation..." 
                        className="pl-9 bg-slate-50 border-slate-200"
                        onKeyDown={(e) => {
                           if(e.key === "Enter") {
                               e.preventDefault();
                               handlePrevMatch(); // Usually enter goes to "next" (upwards in chat context)
                           }
                        }}
                      />
                    </div>
                    
                    {/* SEARCH CONTROLS */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button 
                          onClick={handlePrevMatch} 
                          disabled={searchResults.length === 0}
                          className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50"
                          title="Previous Match"
                        >
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-xs font-mono w-12 text-center text-slate-500">
                           {searchResults.length > 0 ? `${currentMatchIndex + 1}/${searchResults.length}` : "0/0"}
                        </span>
                        <button 
                          onClick={handleNextMatch}
                          disabled={searchResults.length === 0}
                          className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50"
                          title="Next Match"
                        >
                             <ChevronDown className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                  </motion.div>
                ) : (
                  // NORMAL HEADER
                  <>
                    <div className="flex items-center gap-3">
                      {isMobileView && <button onClick={() => setShowChatOnMobile(false)} className="p-2"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>}
                      <div className="relative"><div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(activeUser.id)} flex items-center justify-center text-white font-bold text-sm`}>{getInitials(activeUser.name)}</div><div className="absolute -bottom-0.5 -right-0.5"><OnlineStatus isOnline={activeUser.isOnline} size="md" /></div></div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {activeUser.name}
                          {pinnedChatIds.has(activeUser.id) && <Pin className="w-3 h-3 text-indigo-500 rotate-45" />}
                        </h3>
                        <p className="text-xs text-slate-500">{isTyping ? <span className="text-green-600">typing...</span> : activeUser.isOnline ? <span className="text-green-600">Online</span> : <span className="text-slate-400">Offline</span>}</p>
                      </div>
                    </div>
                    
                    {/* DROPDOWN MENU */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-5 h-5 text-slate-500" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                            if (activeOtherUserId) togglePinChat(e as any, activeOtherUserId);
                        }}>
                          {activeOtherUserId && pinnedChatIds.has(activeOtherUserId) ? 
                            <><PinOff className="w-4 h-4 mr-2" /> Unpin Chat</> : 
                            <><Pin className="w-4 h-4 mr-2" /> Pin Chat</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={toggleChatSearch}>
                          <Search className="w-4 h-4 mr-2" /> Search Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>

              {/* Messages */}
              <div 
                ref={scrollViewportRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-2" 
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
              >
                {messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  const isMedia = msg.type !== 'text';
                  
                  let replyText = "Original message";
                  if (msg.replyTo) {
                    if (msg.replyToContent) replyText = msg.replyToContent;
                    else {
                      const original = messages.find(m => m.id === msg.replyTo);
                      if (original) replyText = original.type === 'text' ? original.content : "Media";
                    }
                  }

                  // Check if this message is the currently highlighted search result
                  const isMatched = searchResults.includes(msg.id);
                  const isFocused = isMatched && searchResults[currentMatchIndex] === msg.id;

                  return (
                    <motion.div 
                      key={msg.id} 
                      // Attach ref here for scrolling
                      ref={(el) => { if (el) messageRefs.current.set(msg.id, el); }}
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ 
                          opacity: 1, 
                          y: 0,
                          // Gentle scale pulse if it's the focused search result
                          scale: isFocused ? 1.02 : 1
                      }} 
                      className={`flex items-end gap-2 mb-1 ${isMine ? "justify-end" : "justify-start"} ${isFocused ? "z-10" : ""}`}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className={`relative max-w-[85%] cursor-pointer hover:shadow-md transition-all ${isMine ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" : "rounded-r-2xl rounded-tl-2xl rounded-bl-md"} ${isMedia ? "p-1 bg-white border border-slate-200" : (isMine ? "px-4 py-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" : "px-4 py-2 bg-white text-slate-800 border border-slate-100")} ${isFocused ? "ring-4 ring-orange-400/30 shadow-lg" : ""}`}>
                            {msg.replyTo && <div className="mb-1 p-1 px-2 border-l-2 bg-black/5 text-xs rounded opacity-70 truncate max-w-[200px]">{replyText}</div>}
                            {renderMessageContent(msg, isMine)}
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMine && !isMedia ? "text-indigo-200" : "text-slate-400"}`}>
                              <span className="text-[10px]">{formatChatTime(msg.timestamp)}</span>
                              {isMine && <MessageStatus status={msg.status} />}
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMine ? "end" : "start"} className="w-40">
                          <DropdownMenuItem onClick={() => {
                              setReplyingTo(msg);
                              setTimeout(() => inputRef.current?.focus(), 100);
                          }}><Reply className="w-4 h-4 mr-2" /> Reply</DropdownMenuItem>
                          {(msg.type === 'pdf' || msg.type === 'file' || msg.type === 'image') && <DropdownMenuItem onClick={() => window.open(msg.content, "_blank")}><Download className="w-4 h-4 mr-2" /> Download</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => { chatService.deleteMessage(msg.id); setMessages(prev => prev.filter(m => m.id !== msg.id)); }} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview Bar */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-indigo-500 rounded-full" />
                        <div>
                          <p className="text-xs font-bold text-indigo-600">Replying to {replyingTo.senderId === currentUserId ? "yourself" : activeUser?.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[300px]">
                            {replyingTo.type === 'image' ? "📷 Photo" : replyingTo.type === 'video' ? "🎥 Video" : replyingTo.type === 'pdf' ? "📄 Document" : replyingTo.type === 'audio' ? "🎵 Audio" : replyingTo.content}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="p-1.5 rounded-full hover:bg-indigo-100 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t-2 border-slate-200 relative">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="absolute bottom-full left-4 mb-2 bg-white p-2 rounded-xl shadow-xl border w-64 grid grid-cols-6 gap-1 z-50">
                      {PRESET_EMOJIS.map(e => <button key={e} onClick={() => setNewMessage(p => p + e)} className="p-2 hover:bg-slate-100 rounded text-xl">{e}</button>)}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-500"><Smile className="w-5 h-5" /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-500" disabled={isUploading}>
                    {isUploading ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </button>
                  <Input ref={inputRef} value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder="Type a message..." className="flex-1 bg-slate-50 border-slate-200 rounded-xl" />
                  <button onClick={sendMessage} disabled={!newMessage.trim()} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}