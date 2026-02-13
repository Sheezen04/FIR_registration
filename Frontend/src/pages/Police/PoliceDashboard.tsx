import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { firApi, FIRResponse, UpdateFIRStatusRequest } from "@/services/api";
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

// ✅ Use your actual backend URL
const API_BASE = "http://localhost:8080";

const navItems = [
  {
    label: "Dashboard",
    href: "/police/dashboard",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    label: "Calendar of F.I.Rs",
    href: "/police/calendar",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    label: "Rules & Laws",
    href: "/police/rules",
    icon: <Scale className="h-4 w-4" />,
  },
];

// ── File Helper Functions ──

const getFileExtension = (filePath: string): string => {
  const name = filePath.split("/").pop() || filePath;
  return name.split(".").pop()?.toLowerCase() || "";
};

const getFileName = (filePath: string): string => {
  return filePath.split("/").pop() || filePath;
};

const getFileType = (
  filePath: string
): "image" | "pdf" | "doc" | "video" | "other" => {
  const ext = getFileExtension(filePath);
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext))
    return "image";
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
const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  fileName,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <FileImage className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-slate-700 truncate max-w-[300px]">
              {fileName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((p) => Math.max(p - 0.25, 0.5))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((p) => Math.min(p + 0.25, 3))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRotation((p) => (p + 90) % 360)}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setZoom(1); setRotation(0); }}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <a href={imageUrl} download={fileName} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100">
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="flex items-center justify-center bg-slate-900 min-h-[500px] max-h-[80vh] overflow-auto p-4">
          <img
            src={imageUrl}
            alt={fileName}
            className="transition-all duration-300 max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Evidence Files Component ──
const EvidenceFiles = ({ files }: { files: string[] }) => {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string; } | null>(null);

  if (!files || files.length === 0) return null;

  const imageFiles = files.filter((f) => getFileType(f) === "image");
  const otherFiles = files.filter((f) => getFileType(f) !== "image");

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Paperclip className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Evidence Files ({files.length})
          </span>
        </div>
        {/* Image Grid */}
        {imageFiles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imageFiles.map((filePath, idx) => {
              const fileUrl = getFileUrl(filePath);
              const fileName = getFileName(filePath);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-xl overflow-hidden border-2 border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => setPreviewImage({ url: fileUrl, name: fileName })}
                >
                  <div className="aspect-square bg-slate-100">
                    <img src={fileUrl} alt={fileName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <div className="p-2 bg-white/90 rounded-full shadow-lg">
                        <Eye className="h-4 w-4 text-slate-700" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-[10px] text-white truncate font-medium">{fileName}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {/* Non-image files */}
        {otherFiles.length > 0 && (
          <div className="space-y-2">
            {otherFiles.map((filePath, idx) => {
              const fileUrl = getFileUrl(filePath);
              const fileName = getFileName(filePath);
              const ext = getFileExtension(filePath);
              const fileType = getFileType(filePath);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50 transition-all group"
                >
                  <div className={`p-2.5 rounded-lg ${fileType === "pdf" ? "bg-red-50" : fileType === "doc" ? "bg-blue-50" : fileType === "video" ? "bg-purple-50" : "bg-slate-50"}`}>
                    {getFileIcon(filePath)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-1 ${getFileBadgeColor(filePath)}`}>
                      {ext.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={fileUrl} download={fileName} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                      <Download className="h-4 w-4 text-slate-500" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      {previewImage && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          fileName={previewImage.name}
        />
      )}
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

const getFirDate = (fir: FIRResponse): string => {
  return fir.createdAt || fir.dateTime;
};

interface GroupedFIRs {
  dateKey: string;
  dateLabel: string;
  relativeLabel: string;
  firs: FIRResponse[];
}

export default function PoliceDashboard() {
  const { toast } = useToast();
  const location = useLocation();
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [selectedFir, setSelectedFir] = useState<FIRResponse | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── FILTER STATES ──
  const [searchQuery, setSearchQuery] = useState("");
  const [complainantFilter, setComplainantFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFIRs();
  }, []);

  const loadFIRs = async () => {
    try {
      setIsLoading(true);
      const response = await firApi.getAll();
      setFirs(response.data);
    } catch (error) {
      console.error("❌ Failed to load FIRs:", error);
      toast({ title: "Error", description: "Failed to load FIRs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

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
      setSelectedFir(null); setNewStatus(""); setRemarks("");
    } catch (error) {
      console.error("❌ Failed to update status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) newSet.delete(dateKey); else newSet.add(dateKey);
      return newSet;
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setComplainantFilter("");
    setDateFilter("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTypeFilter("ALL");
  };

  // Extract unique incident types for the dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set(firs.map((f) => f.incidentType));
    return Array.from(types).sort();
  }, [firs]);

  // ✅ Group FIRs using comprehensive filtering
  const groupedFIRs: GroupedFIRs[] = useMemo(() => {
    let filtered = firs;

    // 1. General Search (FIR Number, Description, Location)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fir) =>
          fir.firNumber.toLowerCase().includes(query) ||
          fir.description?.toLowerCase().includes(query) ||
          fir.location?.toLowerCase().includes(query)
      );
    }

    // 2. Complainant Name Filter
    if (complainantFilter.trim()) {
      const query = complainantFilter.toLowerCase();
      filtered = filtered.filter((fir) =>
        fir.complainantName.toLowerCase().includes(query)
      );
    }

    // 3. Date Filter
    if (dateFilter) {
      filtered = filtered.filter(
        (fir) => getDateKey(getFirDate(fir)) === dateFilter
      );
    }

    // 4. Status Filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((fir) => fir.status === statusFilter);
    }

    // 5. Priority Filter
    if (priorityFilter !== "ALL") {
      filtered = filtered.filter((fir) => fir.priority === priorityFilter);
    }

    // 6. Type Filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((fir) => fir.incidentType === typeFilter);
    }

    // Sort Descending by Date
    const sorted = [...filtered].sort(
      (a, b) => new Date(getFirDate(b)).getTime() - new Date(getFirDate(a)).getTime()
    );

    const groups = new Map<string, FIRResponse[]>();
    sorted.forEach((fir) => {
      const dateKey = getDateKey(getFirDate(fir));
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(fir);
    });

    return Array.from(groups.entries()).map(([dateKey, dateFirs]) => ({
      dateKey,
      dateLabel: formatDate(getFirDate(dateFirs[0])),
      relativeLabel: getRelativeDateLabel(getFirDate(dateFirs[0])),
      firs: dateFirs,
    }));
  }, [
    firs, searchQuery, complainantFilter, dateFilter, statusFilter, priorityFilter, typeFilter,
  ]);

  const stats = {
    total: firs.length,
    pending: firs.filter((f) => f.status === "PENDING").length,
    active: firs.filter((f) => ["APPROVED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(f.status)).length,
    closed: firs.filter((f) => ["CLOSED", "REJECTED"].includes(f.status)).length,
  };

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

            {/* ── ADVANCED FILTER SECTION (Inside Dashboard) ── */}
            <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b mb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5 text-indigo-600" /> Filter FIRs
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={resetFilters}
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Filters
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Row 1: Search & Complainant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase">General Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by FIR Number, Description, or Location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase">Complainant Name</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Filter by complainant name..."
                        value={complainantFilter}
                        onChange={(e) => setComplainantFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase">Incident Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        {uniqueTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase">Priority</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Priorities</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase">Date of Incident</Label>
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="block w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t">
                  <p>Found <span className="font-bold text-slate-800">{groupedFIRs.reduce((acc, g) => acc + g.firs.length, 0)}</span> matching records</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCollapsedDates(collapsedDates.size === groupedFIRs.length ? new Set() : new Set(groupedFIRs.map((g) => g.dateKey)))}
                  >
                    {collapsedDates.size === groupedFIRs.length ? "Expand All" : "Collapse All"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── FIR RESULTS LIST ── */}
            {isLoading && (
              <div className="text-center py-10">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading FIRs...</p>
              </div>
            )}

            {!isLoading && groupedFIRs.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-800 text-lg font-medium">No FIRs found matching criteria</p>
                  <p className="text-slate-500 text-sm mt-1 mb-4">Try adjusting your filters or search terms.</p>
                  <Button variant="outline" onClick={resetFilters}>Clear All Filters</Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && groupedFIRs.map((group, groupIndex) => (
              <motion.div
                key={group.dateKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
              >
                <Card className="overflow-hidden border-slate-200">
                  <button
                    onClick={() => toggleDateCollapse(group.dateKey)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100 transition-colors border-b"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-indigo-100 p-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-slate-800">{group.relativeLabel}</h3>
                        {(group.relativeLabel === "Today" || group.relativeLabel === "Yesterday") && (
                          <p className="text-xs text-slate-500">{group.dateLabel}</p>
                        )}
                      </div>
                      <span className="ml-2 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        {group.firs.length}
                      </span>
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
                              {group.firs.map((fir, firIndex) => (
                                <tr key={fir.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-slate-800">{fir.firNumber}</td>
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
      </motion.div>

        {/* ══════════ FIR REVIEW & UPDATE DIALOG ══════════ */}
        <Dialog
          open={!!selectedFir}
          onOpenChange={() => {
            setSelectedFir(null);
            setNewStatus("");
            setRemarks("");
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedFir && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    {selectedFir.firNumber}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                  {/* FIR Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Complainant
                      </p>
                      <p className="font-bold text-slate-800">
                        {selectedFir.complainantName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedFir.complainantEmail}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Incident Type
                      </p>
                      <p className="font-bold text-slate-800">
                        {selectedFir.incidentType}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Status
                      </p>
                      <StatusBadge status={selectedFir.status} />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Priority
                      </p>
                      <PriorityBadge priority={selectedFir.priority} />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Filed On
                      </p>
                      <p className="font-medium text-slate-700 text-xs">
                        {formatDateTime(selectedFir.createdAt)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Incident Date
                      </p>
                      <p className="font-medium text-slate-700 text-xs">
                        {formatDateTime(selectedFir.dateTime)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedFir.location && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Location
                      </p>
                      <p className="text-sm text-slate-700">
                        {selectedFir.location}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Description
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedFir.description}
                    </p>
                  </div>

                  {/* Assigned Info */}
                  {(selectedFir.assignedStation ||
                    selectedFir.assignedOfficer) && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedFir.assignedStation && (
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs font-semibold text-blue-500 uppercase mb-1">
                            Assigned Station
                          </p>
                          <p className="font-medium text-blue-800">
                            {selectedFir.assignedStation}
                          </p>
                        </div>
                      )}
                      {selectedFir.assignedOfficer && (
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs font-semibold text-blue-500 uppercase mb-1">
                            Assigned Officer
                          </p>
                          <p className="font-medium text-blue-800">
                            {selectedFir.assignedOfficer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remarks */}
                  {selectedFir.remarks && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-xs font-semibold text-amber-600 uppercase mb-2">
                        Remarks
                      </p>
                      <p className="text-sm text-amber-800">
                        {selectedFir.remarks}
                      </p>
                    </div>
                  )}

                  {/* Action Notes */}
                  {selectedFir.actionNotes &&
                    selectedFir.actionNotes.length > 0 && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                          Action Notes ({selectedFir.actionNotes.length})
                        </p>
                        <div className="space-y-2">
                          {selectedFir.actionNotes.map((note, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-slate-700">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* ✅ EVIDENCE FILES */}
                  {selectedFir.evidenceFiles &&
                    selectedFir.evidenceFiles.length > 0 && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <EvidenceFiles
                          files={selectedFir.evidenceFiles}
                        />
                      </div>
                    )}

                  {/* Update Status */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3">
                      Update Status
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label>New Status</Label>
                        <Select
                          value={newStatus}
                          onValueChange={setNewStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPROVED">
                              Approve
                            </SelectItem>
                            <SelectItem value="REJECTED">
                              Reject
                            </SelectItem>
                            <SelectItem value="UNDER_INVESTIGATION">
                              Under Investigation
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS">
                              In Progress
                            </SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>
                          {newStatus === "REJECTED"
                            ? "Rejection Reason"
                            : "Remarks / Action Note (Optional)"}
                        </Label>
                        <Textarea
                          placeholder={
                            newStatus === "REJECTED"
                              ? "Please provide the reason for rejection..."
                              : "Add any notes or remarks..."
                          }
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedFir(null);
                            setNewStatus("");
                            setRemarks("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateStatus}
                          disabled={isUpdating || !newStatus}
                        >
                          {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
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