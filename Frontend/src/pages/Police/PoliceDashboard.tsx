import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { firApi, FIRResponse, UpdateFIRStatusRequest, FIRFilterParams, PagedResponse } from "@/services/api";
import { useInfiniteScroll, useDebouncedValue } from "@/hooks/use-infinite-scroll";
import {
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Scale,
  Paperclip,
  FileImage,
  FileIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  Eye,
  File,
  RefreshCcw,
  LayoutGrid,
  List,
  MoreVertical,
  AlertTriangle,
  Pin,
  PinOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:8080";

const navItems = [
  { label: "Dashboard", href: "/police/dashboard", icon: <Shield className="h-4 w-4" /> },
  { label: "Calendar of F.I.Rs", href: "/police/calendar", icon: <Calendar className="h-4 w-4" /> },
  { label: "Rules & Laws", href: "/police/rules", icon: <Scale className="h-4 w-4" /> },
];

// ── File Helper Functions ──
const getFileExtension = (filePath: string): string => {
  const name = filePath.split("/").pop() || filePath;
  return name.split(".").pop()?.toLowerCase() || "";
};
const getFileName = (filePath: string): string => filePath.split("/").pop() || filePath;
const getFileType = (filePath: string): "image" | "pdf" | "doc" | "video" | "other" => {
  const ext = getFileExtension(filePath);
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext)) return "doc";
  if (["mp4", "avi", "mov", "wmv", "webm"].includes(ext)) return "video";
  return "other";
};
const getFileIcon = (filePath: string) => {
  const type = getFileType(filePath);
  switch (type) {
    case "image": return <FileImage className="h-5 w-5 text-green-500" />;
    case "pdf": return <FileText className="h-5 w-5 text-red-500" />;
    case "doc": return <FileIcon className="h-5 w-5 text-blue-500" />;
    case "video": return <FileIcon className="h-5 w-5 text-purple-500" />;
    default: return <File className="h-5 w-5 text-slate-500" />;
  }
};
const getFileBadgeColor = (filePath: string): string => {
  const type = getFileType(filePath);
  switch (type) {
    case "image": return "bg-green-100 text-green-700 border-green-200";
    case "pdf": return "bg-red-100 text-red-700 border-red-200";
    case "doc": return "bg-blue-100 text-blue-700 border-blue-200";
    case "video": return "bg-purple-100 text-purple-700 border-purple-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};
const getFileUrl = (filePath: string): string => {
  if (filePath.startsWith("http")) return filePath;
  if (filePath.startsWith("uploads/")) return `/${filePath}`;
  return `/uploads/${filePath}`;
};

// ── Image Preview Modal ──
const ImagePreviewModal = ({ isOpen, onClose, imageUrl, fileName }: { isOpen: boolean; onClose: () => void; imageUrl: string; fileName: string }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-slate-700 truncate max-w-[300px]">{fileName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((p) => Math.max(p - 0.25, 0.5))}><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((p) => Math.min(p + 0.25, 3))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRotation((p) => (p + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setZoom(1); setRotation(0); }}><Maximize2 className="h-4 w-4" /></Button>
            <a href={imageUrl} download={fileName} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100"><Download className="h-4 w-4" /></a>
          </div>
        </div>
        <div className="flex items-center justify-center bg-slate-900 min-h-[500px] max-h-[80vh] overflow-auto p-4">
          <img src={imageUrl} alt={fileName} className="transition-all duration-300 max-w-full" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: "center center" }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Evidence Files Component ──
const EvidenceFiles = ({ files }: { files: string[] }) => {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  if (!files || files.length === 0) return null;
  const imageFiles = files.filter((f) => getFileType(f) === "image");
  const otherFiles = files.filter((f) => getFileType(f) !== "image");
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Paperclip className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidence Files ({files.length})</span>
        </div>
        {imageFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imageFiles.map((filePath, idx) => {
              const fileUrl = getFileUrl(filePath);
              const fileName = getFileName(filePath);
              return (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="group relative rounded-xl overflow-hidden border-2 border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => setPreviewImage({ url: fileUrl, name: fileName })}>
                  <div className="aspect-square bg-slate-100">
                    <img src={fileUrl} alt={fileName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-[10px] text-white truncate font-medium">{fileName}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {otherFiles.length > 0 && (
          <div className="space-y-2">
            {otherFiles.map((filePath, idx) => {
              const fileUrl = getFileUrl(filePath);
              const fileName = getFileName(filePath);
              const ext = getFileExtension(filePath);
              const fileType = getFileType(filePath);
              return (
                <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50 transition-all group">
                  <div className={`p-2.5 rounded-lg ${fileType === "pdf" ? "bg-red-50" : fileType === "doc" ? "bg-blue-50" : fileType === "video" ? "bg-purple-50" : "bg-slate-50"}`}>{getFileIcon(filePath)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-1 ${getFileBadgeColor(filePath)}`}>{ext.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={fileUrl} download={fileName} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 text-slate-500" /></a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      {previewImage && <ImagePreviewModal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} imageUrl={previewImage.url} fileName={previewImage.name} />}
    </>
  );
};

// ── Date Helpers ──
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
};
const getRelativeDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  if (dateOnly.getTime() === todayOnly.getTime()) return "Today";
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return "Yesterday";
  return formatDate(dateString);
};
const getDateKey = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const getFirDate = (fir: FIRResponse): string => fir.createdAt || fir.dateTime;

// ── Types ──
interface GroupedFIRs {
  dateKey: string;
  dateLabel: string;
  relativeLabel: string;
  firs: FIRResponse[];
  isPinnedSection?: boolean;
}
type ViewMode = "list" | "grid";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fir: FIRResponse | null;
}

// ══════════════════════════════════════════════
// ── Custom Context Menu Component ──
// ══════════════════════════════════════════════
const ContextMenu = ({
  state,
  onClose,
  isPinned,
  onTogglePin,
  onReview,
}: {
  state: ContextMenuState;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onReview: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (state.visible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.visible, onClose]);

  useEffect(() => {
    if (state.visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      if (rect.right > viewportW) {
        menu.style.left = `${state.x - rect.width}px`;
      }
      if (rect.bottom > viewportH) {
        menu.style.top = `${state.y - rect.height}px`;
      }
    }
  }, [state]);

  if (!state.visible || !state.fir) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -4 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[9999] min-w-[180px] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
        style={{ top: state.y, left: state.x }}
      >
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {state.fir.firNumber}
          </p>
        </div>
        <div className="py-1">
          <button
            onClick={() => {
              onTogglePin();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {isPinned ? (
              <>
                <PinOff className="h-4 w-4 text-slate-400" />
                <span>Unpin Card</span>
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 text-indigo-500" />
                <span>Pin to Top</span>
              </>
            )}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={() => {
              onReview();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Eye className="h-4 w-4 text-slate-400" />
            <span>Review FIR</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════
// ── FIR Card Component (Grid/Kanban Style) ──
// ══════════════════════════════════════════════
const FIRCard = ({
  fir,
  isPinned,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: {
  fir: FIRResponse;
  isPinned: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent, fir: FIRResponse) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, fir: FIRResponse) => void;
  onDragEnd?: () => void;
}) => {
  const date = new Date(getFirDate(fir));

  const getCardPriorityColor = (priority: string) => {
    switch (priority) {
      case "EMERGENCY": return "bg-red-100 text-red-700 border-red-200 animate-pulse";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
      case "LOW": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, fir)}
      onDragEnd={onDragEnd}
      onContextMenu={(e) => onContextMenu(e, fir)}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={onClick}
        className={`bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition-all relative group pointer-events-auto ${
          isPinned
            ? "border-indigo-300 ring-1 ring-indigo-100 bg-indigo-50/30"
            : "border-slate-200 hover:border-indigo-300"
        }`}
      >
        {isPinned && (
          <div className="absolute -top-1.5 -left-1.5 z-10">
            <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
              <Pin className="h-2.5 w-2.5 text-white rotate-45" />
            </div>
          </div>
        )}

        {/* Priority Text Badge */}
        <div className="absolute top-2.5 right-2.5">
           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCardPriorityColor(fir.priority)}`}>
             {fir.priority}
           </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Added Padding Right to Title so it doesn't overlap the Priority Badge */}
          <div className="flex justify-between items-start pr-16">
            <h4 className="font-bold text-slate-800 text-sm truncate">
              {fir.firNumber}
            </h4>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {fir.description || fir.incidentType}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {fir.complainantName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-700 truncate max-w-[100px]">
                {fir.complainantName}
              </span>
              <span className="text-[9px] text-slate-400">
                {fir.incidentType}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="h-3 w-3" />
              {date.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5">
              {isPinned && (
                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
                  Pinned
                </span>
              )}
              {fir.evidenceFiles && fir.evidenceFiles.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  <Paperclip className="h-3 w-3" /> {fir.evidenceFiles.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════
// ── Main Police Dashboard ──
// ══════════════════════════════════════════════
export default function PoliceDashboard() {
  const { toast } = useToast();
  const location = useLocation();
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [selectedFir, setSelectedFir] = useState<FIRResponse | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── PAGINATION STATE ──
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 5;

  // ── VIEW STATE ──
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [draggingFir, setDraggingFir] = useState<FIRResponse | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // ── PIN STATE ──
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("pinnedFirIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // ── CONTEXT MENU STATE ──
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    fir: null,
  });

  // ── FILTER STATES ──
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [complainantFilter, setComplainantFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  // ── DEBOUNCED FILTER VALUES (for backend calls) ──
  const debouncedSearch = useDebouncedValue(searchQuery, 400);
  const debouncedComplainant = useDebouncedValue(complainantFilter, 400);

  // ── Persist pinned IDs ──
  useEffect(() => {
    localStorage.setItem("pinnedFirIds", JSON.stringify(Array.from(pinnedIds)));
  }, [pinnedIds]);

  // ── Load FIRs with pagination (reset when filters change) ──
  const loadFIRs = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (page === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params: FIRFilterParams = {
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        complainant: debouncedComplainant || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        incidentType: typeFilter !== "ALL" ? typeFilter : undefined,
        dateFilter: dateFilter || undefined,
      };

      const response = await firApi.getPaginated(params);
      const { content, hasNext, totalElements: total } = response.data;

      if (append) {
        setFirs(prev => [...prev, ...content]);
      } else {
        setFirs(content);
      }

      setHasMore(hasNext);
      setTotalElements(total);
      setCurrentPage(page);
    } catch (error) {
      console.error("❌ Failed to load FIRs:", error);
      toast({ title: "Error", description: "Failed to load FIRs", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearch, debouncedComplainant, statusFilter, priorityFilter, typeFilter, dateFilter, toast]);

  // ── Initial load and reload on filter changes ──
  useEffect(() => {
    loadFIRs(0, false);
  }, [loadFIRs]);

  // ── Load more callback for infinite scroll ──
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadFIRs(currentPage + 1, true);
    }
  }, [currentPage, hasMore, isLoadingMore, loadFIRs]);

  // ── Infinite scroll sentinel ref ──
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isLoading || isLoadingMore);

  const handleUpdateStatus = async () => {
    if (!selectedFir || !newStatus) return;
    setIsUpdating(true);
    try {
      const request: UpdateFIRStatusRequest = {
        status: newStatus as FIRResponse["status"],
        remarks: newStatus === "REJECTED" ? remarks : undefined,
        actionNote: newStatus !== "REJECTED" && remarks ? remarks : undefined,
      };
      const response = await firApi.updateStatus(selectedFir.id, request);
      setFirs((prev) => prev.map((f) => (f.id === selectedFir.id ? response.data : f)));
      toast({ title: "FIR Updated", description: `${selectedFir.firNumber} status changed to ${newStatus}` });
      setSelectedFir(null);
      setNewStatus("");
      setRemarks("");
    } catch (error) {
      console.error("❌ Failed to update status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  // ── PIN HANDLERS ──
  const togglePin = useCallback(
    (firId: number) => {
      setPinnedIds((prev) => {
        const newSet = new Set(prev);
        const fir = firs.find((f) => f.id === firId);
        if (newSet.has(firId)) {
          newSet.delete(firId);
          toast({
            title: "Unpinned",
            description: `${fir?.firNumber || "FIR"} removed from pinned`,
          });
        } else {
          newSet.add(firId);
          toast({
            title: "Pinned",
            description: `${fir?.firNumber || "FIR"} pinned to top`,
          });
        }
        return newSet;
      });
    },
    [firs, toast]
  );

  // ── CONTEXT MENU HANDLERS ──
  const handleCardContextMenu = useCallback(
    (e: React.MouseEvent, fir: FIRResponse) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        fir,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, fir: null });
  }, []);

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) newSet.delete(dateKey);
      else newSet.add(dateKey);
      return newSet;
    });
  };

  // ── DRAG AND DROP HANDLERS ──
  const handleDragStart = (e: React.DragEvent, fir: FIRResponse) => {
    setDraggingFir(fir);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", fir.id.toString());
  };
  const handleDragEnd = () => {
    setDraggingFir(null);
    setDragOverColumn(null);
  };
  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };
  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingFir) return;
    const currentStatus = draggingFir.status;
    if (currentStatus === targetStatus || (targetStatus === "CLOSED" && (currentStatus === "CLOSED" || currentStatus === "REJECTED"))) {
      setDraggingFir(null);
      return;
    }
    const mappedStatus = targetStatus === "CLOSED" ? "CLOSED" : targetStatus;
    try {
      setIsUpdating(true);
      const request: UpdateFIRStatusRequest = { status: mappedStatus as FIRResponse["status"] };
      const response = await firApi.updateStatus(draggingFir.id, request);
      setFirs((prev) => prev.map((f) => (f.id === draggingFir.id ? response.data : f)));
      toast({
        title: "FIR Updated",
        description: `${draggingFir.firNumber} moved to ${kanbanColumns[targetStatus as keyof typeof kanbanColumns]?.title || mappedStatus}`,
      });
    } catch (error) {
      console.error("❌ Failed to update status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsUpdating(false);
      setDraggingFir(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setComplainantFilter("");
    setDateFilter("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTypeFilter("ALL");
    // Pagination is automatically reset when filters change via useEffect
  };

  const uniqueTypes = useMemo(() => {
    const types = new Set(firs.map((f) => f.incidentType));
    return Array.from(types).sort();
  }, [firs]);

  // Backend handles filtering, so filteredFIRs is just the firs from API
  // We still sort pinned items to top for display
  const filteredFIRs = useMemo(() => {
    return [...firs].sort((a, b) => {
      // Pinned items first
      const aPinned = pinnedIds.has(a.id) ? 1 : 0;
      const bPinned = pinnedIds.has(b.id) ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      // Then by date descending
      return new Date(getFirDate(b)).getTime() - new Date(getFirDate(a)).getTime();
    });
  }, [firs, pinnedIds]);

  // ✅ UPDATED: Separate "Pinned" FIRs into their own group at the top
  const groupedFIRs: GroupedFIRs[] = useMemo(() => {
    const groups = new Map<string, FIRResponse[]>();
    const pinnedList: FIRResponse[] = [];
    const unpinnedList: FIRResponse[] = [];

    // 1. Separate Pinned vs Unpinned
    filteredFIRs.forEach((fir) => {
      if (pinnedIds.has(fir.id)) {
        pinnedList.push(fir);
      } else {
        unpinnedList.push(fir);
      }
    });

    // 2. Group Unpinned by Date
    unpinnedList.forEach((fir) => {
      const dateKey = getDateKey(getFirDate(fir));
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(fir);
    });

    // 3. Create Date Groups
    const dateGroups = Array.from(groups.entries()).map(([dateKey, dateFirs]) => ({
      dateKey,
      dateLabel: formatDate(getFirDate(dateFirs[0])),
      relativeLabel: getRelativeDateLabel(getFirDate(dateFirs[0])),
      firs: dateFirs,
      isPinnedSection: false,
    }));

    // 4. Prepend Pinned Group if exists
    if (pinnedList.length > 0) {
      return [
        {
          dateKey: "pinned-section",
          dateLabel: "Important",
          relativeLabel: "Pinned",
          firs: pinnedList,
          isPinnedSection: true,
        },
        ...dateGroups,
      ];
    }

    return dateGroups;
  }, [filteredFIRs, pinnedIds]);

  // ── Kanban columns with pinned items sorted to top ──
  const kanbanColumns = useMemo(() => {
    const columns = {
      PENDING: { title: "Pending Review", color: "bg-amber-100 text-amber-700", items: [] as FIRResponse[] },
      UNDER_INVESTIGATION: { title: "Under Investigation", color: "bg-blue-100 text-blue-700", items: [] as FIRResponse[] },
      IN_PROGRESS: { title: "In Progress", color: "bg-purple-100 text-purple-700", items: [] as FIRResponse[] },
      APPROVED: { title: "Approved", color: "bg-green-100 text-green-700", items: [] as FIRResponse[] },
      CLOSED: { title: "Closed / Rejected", color: "bg-slate-100 text-slate-700", items: [] as FIRResponse[] },
    };

    filteredFIRs.forEach((fir) => {
      if (fir.status === "PENDING") columns.PENDING.items.push(fir);
      else if (fir.status === "UNDER_INVESTIGATION") columns.UNDER_INVESTIGATION.items.push(fir);
      else if (fir.status === "IN_PROGRESS") columns.IN_PROGRESS.items.push(fir);
      else if (fir.status === "APPROVED") columns.APPROVED.items.push(fir);
      else columns.CLOSED.items.push(fir);
    });

    // Sort: pinned first in each column
    Object.values(columns).forEach((col) => {
      col.items.sort((a, b) => {
        const aPinned = pinnedIds.has(a.id) ? 1 : 0;
        const bPinned = pinnedIds.has(b.id) ? 1 : 0;
        return bPinned - aPinned;
      });
    });

    return columns;
  }, [filteredFIRs, pinnedIds]);

  const stats = {
    total: totalElements,
    pending: firs.filter((f) => f.status === "PENDING").length,
    active: firs.filter((f) => ["APPROVED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(f.status)).length,
    closed: firs.filter((f) => ["CLOSED", "REJECTED"].includes(f.status)).length,
  };

  const hasActiveFilters = debouncedSearch || complainantFilter || statusFilter !== "ALL" || priorityFilter !== "ALL" || typeFilter !== "ALL" || dateFilter;

  return (
    <DashboardLayout title="Police Station Portal" navItems={navItems}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-6">
          {/* ── STATS CARDS ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total FIRs", value: stats.total, icon: FileText, color: "text-primary" },
              { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning" },
              { label: "Active Cases", value: stats.active, icon: CheckCircle, color: "text-success" },
              { label: "Closed/Rejected", value: stats.closed, icon: XCircle, color: "text-muted-foreground" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg bg-muted p-3 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── FILTER TOOLBAR ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {totalElements}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {hasActiveFilters ? "Filtered FIRs" : "FIRs"}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {/* {totalElements} */}
                    {/* {hasMore && (
                      <span className="ml-2 text-slate-400">
                        · scroll for more
                      </span>
                    )} */}
                    {pinnedIds.size > 0 && (
                      <span className="ml-2 text-indigo-600">
                        · {pinnedIds.size} pinned
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 items-center gap-3 justify-end">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search FIR number, description..." className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center h-11">
                  <Button variant="ghost" size="sm" className={`h-9 w-9 p-0 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setViewMode("grid")}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className={`h-9 w-9 p-0 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`} onClick={() => setViewMode("list")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  size="icon"
                  className={`h-11 w-11 shrink-0 rounded-lg border-slate-200 ${showFilters ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white hover:bg-slate-50"}`}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Toggle Filters"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="pt-4 mt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Complainant</Label>
                      <div className="relative">
                        <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input placeholder="Name..." value={complainantFilter} onChange={(e) => setComplainantFilter(e.target.value)} className="pl-8 h-9 text-sm bg-white" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                          <SelectItem value="UNDER_INVESTIGATION">Under Inv.</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Type</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          {uniqueTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Priority</Label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue placeholder="Priority" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Priorities</SelectItem>
                          <SelectItem value="EMERGENCY">Emergency</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">Date</Label>
                      <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 text-sm bg-white" />
                    </div>
                    {hasActiveFilters && (
                      <div className="sm:col-span-2 lg:col-span-5 flex justify-end mt-1">
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8">
                          <RefreshCcw className="h-3 w-3 mr-1.5" /> Reset Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── CONTENT AREA ── */}
          {isLoading ? (
            <div className="text-center py-20">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading FIRs...</p>
            </div>
          ) : filteredFIRs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-800 text-lg font-medium">No FIRs found matching criteria</p>
                <Button variant="outline" onClick={resetFilters} className="mt-4">Clear All Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="min-h-[500px]">
              {viewMode === "list" ? (
                <div className="space-y-6">
                  {groupedFIRs.map((group, groupIndex) => (
                    <motion.div key={group.dateKey} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: groupIndex * 0.05 }}>
                      <Card className={`overflow-hidden border-slate-200 ${group.isPinnedSection ? "border-indigo-200 shadow-sm ring-1 ring-indigo-50" : ""}`}>
                        <button onClick={() => toggleDateCollapse(group.dateKey)} className={`w-full flex items-center justify-between p-4 transition-colors border-b ${group.isPinnedSection ? "bg-indigo-50/70 hover:bg-indigo-100/50" : "bg-slate-50/80 hover:bg-slate-100"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`rounded-full p-2 ${group.isPinnedSection ? "bg-indigo-100" : "bg-slate-100"}`}>
                              {group.isPinnedSection ? <Pin className="h-4 w-4 text-indigo-600 rotate-45" /> : <Calendar className="h-4 w-4 text-slate-600" />}
                            </div>
                            <div className="text-left">
                              <h3 className={`font-semibold ${group.isPinnedSection ? "text-indigo-900" : "text-slate-800"}`}>{group.relativeLabel}</h3>
                              {(group.relativeLabel === "Today" || group.relativeLabel === "Yesterday") && <p className="text-xs text-slate-500">{group.dateLabel}</p>}
                            </div>
                            <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-bold ${group.isPinnedSection ? "bg-indigo-100 text-indigo-700" : "bg-indigo-100 text-indigo-700"}`}>{group.firs.length}</span>
                          </div>
                          {collapsedDates.has(group.dateKey) ? <ChevronRight className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </button>
                        {!collapsedDates.has(group.dateKey) && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b text-left text-slate-500 bg-slate-50/50">
                                      <th className="px-4 py-3 font-medium">FIR #</th>
                                      <th className="px-4 py-3 font-medium">Complainant</th>
                                      <th className="px-4 py-3 font-medium">Type</th>
                                      <th className="px-4 py-3 font-medium">Time</th>
                                      <th className="px-4 py-3 font-medium">Priority</th>
                                      <th className="px-4 py-3 font-medium">Status</th>
                                      <th className="px-4 py-3 font-medium">Files</th>
                                      <th className="px-4 py-3 font-medium">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {group.firs.map((fir) => (
                                      <tr
                                        key={fir.id}
                                        onContextMenu={(e) => handleCardContextMenu(e, fir)}
                                        className={`transition-colors border-b last:border-0 cursor-context-menu ${
                                          pinnedIds.has(fir.id) ? "bg-indigo-50 hover:bg-indigo-100/50" : "bg-white hover:bg-slate-50"
                                        }`}
                                      >
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                          <div className="flex items-center gap-1.5">
                                            {pinnedIds.has(fir.id) && <Pin className="h-3 w-3 text-indigo-500 rotate-45" />}
                                            {fir.firNumber}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{fir.complainantName}</td>
                                        <td className="px-4 py-3 text-slate-600">{fir.incidentType}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatTime(getFirDate(fir))}</td>
                                        <td className="px-4 py-3"><PriorityBadge priority={fir.priority} /></td>
                                        <td className="px-4 py-3"><StatusBadge status={fir.status} /></td>
                                        <td className="px-4 py-3">
                                          {fir.evidenceFiles && fir.evidenceFiles.length > 0 ? (
                                            <Badge variant="outline" className="text-xs gap-1 cursor-pointer hover:bg-slate-100" onClick={() => setSelectedFir(fir)}>
                                              <Paperclip className="h-3 w-3" /> {fir.evidenceFiles.length}
                                            </Badge>
                                          ) : <span className="text-xs text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Button variant="ghost" size="sm" onClick={() => setSelectedFir(fir)}>
                                            <MessageSquare className="mr-1 h-3 w-3" /> Review
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // ── GRID / KANBAN VIEW ──
                <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
                  {Object.entries(kanbanColumns).map(([statusKey, col]) => (
                    <div
                      key={statusKey}
                      className={`min-w-[280px] w-[280px] flex flex-col rounded-xl border max-h-full transition-all duration-200 ${
                        dragOverColumn === statusKey
                          ? "bg-indigo-50 border-indigo-300 border-2 shadow-lg scale-[1.02]"
                          : "bg-slate-50/50 border-slate-200/60"
                      }`}
                      onDragOver={(e) => handleDragOver(e, statusKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, statusKey)}
                    >
                      <div className="p-3 rounded-t-xl border-b border-slate-200 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${col.color.split(" ")[0]}`} />
                          <span className="font-semibold text-sm text-slate-700">{col.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {col.items.some((f) => pinnedIds.has(f.id)) && (
                            <Pin className="h-3 w-3 text-indigo-400 rotate-45" />
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                            {col.items.length}
                          </span>
                        </div>
                      </div>

                      <div className={`p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar transition-all ${dragOverColumn === statusKey ? "bg-indigo-50/50" : ""}`}>
                        {col.items.length === 0 ? (
                          <div className={`h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg m-1 transition-all ${
                            dragOverColumn === statusKey ? "border-indigo-300 bg-indigo-100/50 text-indigo-500" : "border-slate-200 text-slate-400"
                          }`}>
                            {dragOverColumn === statusKey ? (
                              <>
                                <Download className="h-5 w-5 mb-1" />
                                <span className="text-xs font-medium">Drop here</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-5 w-5 mb-1 opacity-50" />
                                <span className="text-xs">No items</span>
                              </>
                            )}
                          </div>
                        ) : (
                          col.items.map((fir) => (
                            <FIRCard
                              key={fir.id}
                              fir={fir}
                              isPinned={pinnedIds.has(fir.id)}
                              onClick={() => setSelectedFir(fir)}
                              onContextMenu={handleCardContextMenu}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── INFINITE SCROLL SENTINEL & LOAD MORE INDICATOR ── */}
          {!isLoading && firs.length > 0 && (
            <div className="py-4">
              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  <span className="text-sm text-slate-500">Loading more FIRs...</span>
                </div>
              ) : hasMore ? (
                <div 
                  ref={sentinelRef} 
                  className="h-10 flex items-center justify-center"
                >
                  <span className="text-xs text-slate-400">Scroll for more</span>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="text-xs text-slate-400">
                    All {totalElements} FIRs loaded
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ══════════ CONTEXT MENU ══════════ */}
      <ContextMenu
        state={contextMenu}
        onClose={closeContextMenu}
        isPinned={contextMenu.fir ? pinnedIds.has(contextMenu.fir.id) : false}
        onTogglePin={() => {
          if (contextMenu.fir) togglePin(contextMenu.fir.id);
        }}
        onReview={() => {
          if (contextMenu.fir) setSelectedFir(contextMenu.fir);
        }}
      />

      {/* ══════════ FIR REVIEW & UPDATE DIALOG ══════════ */}
      <Dialog
        open={!!selectedFir}
        onOpenChange={() => {
          setSelectedFir(null);
          setNewStatus("");
          setRemarks("");
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4">
          {selectedFir && (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  {selectedFir.firNumber}
                  <StatusBadge status={selectedFir.status} />
                  <PriorityBadge priority={selectedFir.priority} />
                  {pinnedIds.has(selectedFir.id) && (
                    <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200 bg-indigo-50 gap-1">
                      <Pin className="h-2.5 w-2.5 rotate-45" /> Pinned
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Complainant</p>
                    <p className="font-bold text-slate-800 text-xs truncate">{selectedFir.complainantName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{selectedFir.complainantEmail}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Incident Type</p>
                    <p className="font-bold text-slate-800 text-xs">{selectedFir.incidentType}</p>
                  </div>
                  {selectedFir.location && (
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Location</p>
                      <p className="text-xs text-slate-700 truncate">{selectedFir.location}</p>
                    </div>
                  )}
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Filed On</p>
                    <p className="font-medium text-slate-700 text-[11px]">{formatDateTime(selectedFir.createdAt)}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Incident Date</p>
                    <p className="font-medium text-slate-700 text-[11px]">{formatDateTime(selectedFir.dateTime)}</p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Description</p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[80px] overflow-y-auto">
                    {selectedFir.description}
                  </p>
                </div>

                {selectedFir.remarks && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-amber-600 uppercase">Remarks</p>
                      <p className="text-xs text-amber-800">{selectedFir.remarks}</p>
                    </div>
                  </div>
                )}

                {selectedFir.evidenceFiles && selectedFir.evidenceFiles.length > 0 && (
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <EvidenceFiles files={selectedFir.evidenceFiles} />
                  </div>
                )}

                {/* Update Status */}
                <div className="border-t pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Update Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">Approve</SelectItem>
                          <SelectItem value="REJECTED">Reject</SelectItem>
                          <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">
                        {newStatus === "REJECTED" ? "Rejection Reason" : "Remarks (Optional)"}
                      </Label>
                      <Textarea
                        placeholder={newStatus === "REJECTED" ? "Reason for rejection..." : "Add notes or remarks..."}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={1}
                        className="min-h-[36px] max-h-[80px] text-sm resize-y"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => { setSelectedFir(null); setNewStatus(""); setRemarks(""); }}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-9 px-5" onClick={handleUpdateStatus} disabled={isUpdating || !newStatus}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}