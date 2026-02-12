import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { firApi, FIRResponse, UpdateFIRStatusRequest } from "@/services/api";
import { FIRStatus } from "@/data/firData";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Grid,
  List,
  Clock,
  FileText,
  Shield,
  Users,
  Scale,
  Target,
  Eye,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Filter,
  Search,
  MessageCircle,
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

// Nav items
const navItems = [
  {
    label: "Dashboard",
    href: "/police/dashboard",
    icon: <Shield className="h-4 w-4" />,
  },
    {
    label: "Calendar of F.I.Rs",
    href: "/police/calendar",
    icon: <CalendarIcon className="h-4 w-4" />,
  },
   { label: "Chat",
    href: "/police/chat", 
    icon: <MessageCircle className="h-4 w-4" /> 
  },
    {
    label: "Rules & Laws",
    href: "/police/rules",
    icon: <Scale className="h-4 w-4" />,
  },
];

// Types
type CalendarView = "month" | "week" | "day" | "agenda";

// Utility functions
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-400",
        dot: "bg-amber-500",
        gradient: "from-amber-50 to-orange-50",
      };
    case "APPROVED":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-400",
        dot: "bg-green-500",
        gradient: "from-green-50 to-emerald-50",
      };
    case "REJECTED":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-400",
        dot: "bg-red-500",
        gradient: "from-red-50 to-rose-50",
      };
    case "UNDER_INVESTIGATION":
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-400",
        dot: "bg-blue-500",
        gradient: "from-blue-50 to-indigo-50",
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-400",
        dot: "bg-purple-500",
        gradient: "from-purple-50 to-violet-50",
      };
    case "CLOSED":
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
        border: "border-slate-400",
        dot: "bg-slate-500",
        gradient: "from-slate-50 to-gray-50",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
        border: "border-slate-400",
        dot: "bg-slate-500",
        gradient: "from-slate-50 to-gray-50",
      };
  }
};

// Priority color mapping
const getPriorityIndicator = (priority: string) => {
  switch (priority) {
    case "HIGH":
      return "bg-gradient-to-b from-red-500 to-rose-600";
    case "MEDIUM":
      return "bg-gradient-to-b from-amber-500 to-orange-500";
    case "LOW":
      return "bg-gradient-to-b from-green-500 to-emerald-500";
    default:
      return "bg-gradient-to-b from-slate-400 to-slate-500";
  }
};

// View icons
const viewIcons = {
  month: Grid,
  week: CalendarIcon,
  day: Clock,
  agenda: List,
};

export default function FIRCalendar() {
  const { toast } = useToast();
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateKey(new Date())
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // FIR detail modal
  const [selectedFir, setSelectedFir] = useState<FIRResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Update status modal
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<FIRStatus | "">("");
  const [remarks, setRemarks] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadFIRs();
  }, []);

  const loadFIRs = async () => {
    try {
      setIsLoading(true);
      const response = await firApi.getAll();
      setFirs(response.data);
    } catch (error) {
      console.error("Failed to load FIRs:", error);
      toast({
        title: "Error",
        description: "Failed to load FIRs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter FIRs
  const filteredFirs = useMemo(() => {
    let filtered = firs;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.firNumber.toLowerCase().includes(query) ||
          f.complainantName.toLowerCase().includes(query) ||
          f.incidentType.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [firs, statusFilter, searchQuery]);

  // Get FIRs for a specific date
  const getFirsForDate = (dateStr: string) =>
    filteredFirs
      .filter((fir) => {
        const firDate = new Date(fir.createdAt || fir.incidentDate);
        return formatDateKey(firDate) === dateStr;
      })
      .sort((a, b) => {
        // Sort by priority: HIGH first
        const priorityOrder: Record<string, number> = {
          HIGH: 0,
          MEDIUM: 1,
          LOW: 2,
        };
        return (
          (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
        );
      });

  // Handle FIR click
  const handleFirClick = (fir: FIRResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFir(fir);
    setIsDetailOpen(true);
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedFir || !newStatus) return;
    setIsUpdating(true);
    try {
      const request: UpdateFIRStatusRequest = {
        status: newStatus as FIRStatus,
        remarks: newStatus === "REJECTED" ? remarks : undefined,
        actionNote: newStatus !== "REJECTED" && remarks ? remarks : undefined,
      };
      const response = await firApi.updateStatus(selectedFir.id, request);
      setFirs((prev) =>
        prev.map((f) => (f.id === selectedFir.id ? response.data : f))
      );
      toast({
        title: "FIR Updated",
        description: `${selectedFir.firNumber} status changed`,
      });
      setIsUpdateOpen(false);
      setIsDetailOpen(false);
      setNewStatus("");
      setRemarks("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Navigation
  const prevPeriod = () => {
    const prev = new Date(currentMonth);
    if (currentView === "month" || currentView === "agenda") {
      prev.setMonth(prev.getMonth() - 1);
    } else if (currentView === "week") {
      prev.setDate(prev.getDate() - 7);
    } else {
      prev.setDate(prev.getDate() - 1);
    }
    setCurrentMonth(new Date(prev));
  };

  const nextPeriod = () => {
    const next = new Date(currentMonth);
    if (currentView === "month" || currentView === "agenda") {
      next.setMonth(next.getMonth() + 1);
    } else if (currentView === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentMonth(new Date(next));
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(formatDateKey(today));
    setCurrentMonth(today);
  };

  // Stats
  const stats = {
    total: filteredFirs.length,
    pending: filteredFirs.filter((f) => f.status === "PENDING").length,
    active: filteredFirs.filter((f) =>
      ["APPROVED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(f.status)
    ).length,
    closed: filteredFirs.filter((f) =>
      ["CLOSED", "REJECTED"].includes(f.status)
    ).length,
  };

  // ────────────────────────── MONTH VIEW ──────────────────────────
  const MonthView = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    const days: React.ReactNode[] = [];

    // Empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[130px] p-2 bg-gradient-to-br from-slate-50/50 to-transparent border border-slate-100/50"
        />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dateStr = formatDateKey(dateObj);
      const dayFirs = getFirsForDate(dateStr);
      const isToday = dateStr === formatDateKey(new Date());
      const isSelected = dateStr === selectedDate;

      days.push(
        <div
          key={day}
          className={`min-h-[130px] p-3 border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
            isSelected
              ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300 shadow-lg shadow-indigo-100 scale-[1.02] z-10"
              : isToday
                ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-md"
                : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md hover:scale-[1.01]"
          }`}
          onClick={() => setSelectedDate(dateStr)}
        >
          {/* Corner accent */}
          {(isToday || isSelected) && (
            <div
              className={`absolute top-0 right-0 w-16 h-16 ${
                isSelected ? "bg-indigo-400/10" : "bg-amber-400/10"
              } rounded-bl-full`}
            />
          )}

          <div className="flex justify-between items-start mb-2 relative z-10">
            <span
              className={`text-lg font-bold transition-colors ${
                isToday
                  ? "text-amber-600"
                  : isSelected
                    ? "text-indigo-600"
                    : "text-slate-700 group-hover:text-indigo-600"
              }`}
            >
              {day}
            </span>
            {dayFirs.length > 0 && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-sm ${
                  isSelected
                    ? "bg-indigo-500 text-white"
                    : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700"
                }`}
              >
                <FileText className="w-3 h-3" />
                {dayFirs.length}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {dayFirs.slice(0, 3).map((fir, idx) => {
              const statusColor = getStatusColor(fir.status);
              return (
                <div
                  key={fir.id}
                  onClick={(e) => handleFirClick(fir, e)}
                  className={`text-xs p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md relative overflow-hidden border-l-[3px] ${statusColor.border} ${statusColor.bg} ${statusColor.text}`}
                  style={{
                    animationDelay: `${idx * 100}ms`,
                    animation: "slideInRight 0.3s ease-out forwards",
                    opacity: 0,
                  }}
                  title={`${fir.firNumber} - ${fir.complainantName}`}
                >
                  {fir.priority === "HIGH" && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <div className="font-semibold truncate pr-2">
                    {fir.firNumber}
                  </div>
                  <div className="truncate text-[10px] opacity-75 mt-0.5">
                    {fir.incidentType}
                  </div>
                </div>
              );
            })}
            {dayFirs.length > 3 && (
              <div className="text-xs text-slate-500 font-medium pl-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />+{dayFirs.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="grid grid-cols-7 gap-0 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((d) => (
            <div
              key={d}
              className="text-center py-4 bg-gradient-to-br from-slate-800 to-slate-700 text-white font-bold text-sm tracking-wider border-r border-slate-600 last:border-r-0"
            >
              <div className="hidden sm:block">{d}</div>
              <div className="sm:hidden">{d.slice(0, 3)}</div>
            </div>
          ))}
          {days}
        </div>

        <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  };

  // ────────────────────────── WEEK VIEW ──────────────────────────
  const WeekView = () => {
    const startDate = new Date(selectedDate);
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateKey(dateObj);
      const dayFirs = getFirsForDate(dateStr);
      const isToday = dateStr === formatDateKey(new Date());
      const isSelected = dateStr === selectedDate;

      return (
        <div
          key={i}
          className={`flex-1 border-r last:border-r-0 transition-all ${
            isSelected ? "bg-gradient-to-b from-indigo-50 to-white" : ""
          }`}
        >
          <div
            className={`p-4 border-b-2 transition-colors cursor-pointer ${
              isToday
                ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50"
                : isSelected
                  ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
            onClick={() => setSelectedDate(dateStr)}
          >
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][i]}
            </div>
            <div
              className={`text-2xl font-black ${
                isToday
                  ? "text-amber-600"
                  : isSelected
                    ? "text-indigo-600"
                    : "text-slate-800"
              }`}
            >
              {dateObj.getDate()}
            </div>
            {dayFirs.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600">
                  {dayFirs.length} FIR{dayFirs.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
            {dayFirs.map((fir, idx) => {
              const statusColor = getStatusColor(fir.status);
              return (
                <div
                  key={fir.id}
                  onClick={(e) => handleFirClick(fir, e)}
                  className="group p-3 border-2 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer bg-white relative overflow-hidden"
                  style={{
                    animationDelay: `${idx * 80}ms`,
                    animation: "fadeInUp 0.4s ease-out forwards",
                    opacity: 0,
                  }}
                >
                  {fir.priority === "HIGH" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-rose-600" />
                  )}

                  <div className="ml-2">
                    <div className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {fir.firNumber}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-1">
                      {fir.complainantName}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor.bg} ${statusColor.text}`}
                      >
                        {fir.status.replace("_", " ")}
                      </span>
                      {fir.priority === "HIGH" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                          HIGH
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(fir.createdAt || fir.incidentDate)}
                    </div>
                  </div>
                </div>
              );
            })}
            {dayFirs.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No FIRs
              </div>
            )}
          </div>
        </div>
      );
    });

    return (
      <div className="flex rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 w-full">
        {weekDays}
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>
    );
  };

  // ────────────────────────── DAY VIEW ──────────────────────────
  const DayView = () => {
    const dayFirs = getFirsForDate(selectedDate);
    const dateObj = new Date(selectedDate);
    const isToday = selectedDate === formatDateKey(new Date());

    return (
      <div className="space-y-6">
        {/* Date header */}
        <div
          className={`p-6 rounded-2xl shadow-xl relative overflow-hidden ${
            isToday
              ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
              : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="text-white/90 text-sm font-bold uppercase tracking-widest mb-2">
              {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <div className="text-white text-3xl font-black">
              {dateObj.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-4 mt-3">
              {isToday && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    Today
                  </span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <FileText className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-bold">
                  {dayFirs.length} FIR{dayFirs.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FIRs list */}
        <div className="space-y-4">
          {dayFirs.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4">
                <CalendarIcon className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                No FIRs filed on this day
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Select another date to view FIRs
              </p>
            </div>
          ) : (
            dayFirs.map((fir, idx) => {
              const statusColor = getStatusColor(fir.status);
              return (
                <motion.div
                  key={fir.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  onClick={(e) => handleFirClick(fir, e)}
                  className="group p-5 border-2 rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-white relative overflow-hidden"
                >
                  {/* Priority bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${getPriorityIndicator(fir.priority)}`}
                  />

                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${getPriorityIndicator(fir.priority)}`}
                    >
                      <FileText className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {fir.firNumber}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {fir.complainantName}
                          </p>
                        </div>
                        <StatusBadge status={fir.status} />
                      </div>

                      <p className="text-sm text-slate-600 mb-3">
                        {fir.incidentType}
                      </p>

                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <PriorityBadge priority={fir.priority} />
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {formatTime(fir.createdAt || fir.incidentDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ────────────────────────── AGENDA VIEW ──────────────────────────
  const AgendaView = () => {
    const sortedFirs = [...filteredFirs]
      .filter(
        (f) =>
          (f.createdAt || f.incidentDate) &&
          !isNaN(new Date(f.createdAt || f.incidentDate).getTime())
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.incidentDate).getTime() -
          new Date(a.createdAt || a.incidentDate).getTime()
      );

    // Group by date
    const grouped: Record<string, FIRResponse[]> = {};
    sortedFirs.forEach((fir) => {
      const date = new Date(fir.createdAt || fir.incidentDate);
      const key = date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(fir);
    });

    return (
      <div className="space-y-6">
        {Object.entries(grouped).length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4">
              <List className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium text-xl">No FIRs found</p>
            <p className="text-slate-400 text-sm mt-2">
              Adjust filters to see FIRs
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateFirs], groupIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: groupIdx * 0.08 }}
              className="border-2 rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Date header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h4 className="font-black text-white text-lg tracking-wide">
                      {date}
                    </h4>
                    <div className="text-white/70 text-sm font-medium mt-1">
                      {dateFirs.length} FIR{dateFirs.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {dateFirs.some((f) => f.priority === "HIGH") && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-200 text-xs rounded-full font-bold">
                        ⚠ High Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* FIRs */}
              <div className="divide-y-2 divide-slate-100">
                {dateFirs.map((fir) => {
                  const statusColor = getStatusColor(fir.status);
                  return (
                    <div
                      key={fir.id}
                      onClick={(e) => handleFirClick(fir, e)}
                      className="group p-5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all cursor-pointer relative"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

                      <div className="flex items-start gap-4 ml-2">
                        <div
                          className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 shadow-md ${statusColor.dot}`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h5 className="font-bold text-base text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {fir.firNumber}
                              </h5>
                              <p className="text-sm text-slate-500">
                                {fir.complainantName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                                {formatTime(fir.createdAt || fir.incidentDate)}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 mb-2">
                            {fir.incidentType}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={fir.status} />
                            <PriorityBadge priority={fir.priority} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  };

  // Render view
  const renderView = () => {
    switch (currentView) {
      case "month":
        return <MonthView />;
      case "week":
        return <WeekView />;
      case "day":
        return <DayView />;
      case "agenda":
        return <AgendaView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <DashboardLayout title="FIR Calendar" navItems={navItems}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-2xl">
          {/* ── Header ── */}
          <div className="border-b-2 border-slate-200 bg-white">
            {/* Navigation + View Switcher */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-6 py-5 gap-4">
              {/* Left: Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prevPeriod}
                  className="p-3 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-transparent hover:border-indigo-200 group"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                </button>

                <button
                  onClick={goToToday}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200"
                >
                  Today
                </button>

                <button
                  onClick={nextPeriod}
                  className="p-3 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-transparent hover:border-indigo-200 group"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                </button>

                <div className="ml-4 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg">
                  <div className="text-xl font-black text-white tracking-tight">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Right: View Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl shadow-inner">
                {(["month", "week", "day", "agenda"] as CalendarView[]).map(
                  (view) => {
                    const Icon = viewIcons[view];
                    return (
                      <button
                        key={view}
                        onClick={() => setCurrentView(view)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                          currentView === view
                            ? "bg-white text-indigo-600 shadow-md scale-105"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="capitalize hidden sm:inline">
                          {view}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search FIR #, name, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[170px] bg-white">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="UNDER_INVESTIGATION">
                        Under Investigation
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats */}
                <div className="ml-auto flex items-center gap-4">
                  <div className="flex items-center gap-6">
                    {[
                      {
                        label: "Total",
                        value: stats.total,
                        icon: FileText,
                        color: "text-slate-600",
                        bg: "bg-slate-100",
                      },
                      {
                        label: "Pending",
                        value: stats.pending,
                        icon: Clock,
                        color: "text-amber-600",
                        bg: "bg-amber-100",
                      },
                      {
                        label: "Active",
                        value: stats.active,
                        icon: CheckCircle,
                        color: "text-green-600",
                        bg: "bg-green-100",
                      },
                      {
                        label: "Closed",
                        value: stats.closed,
                        icon: XCircle,
                        color: "text-slate-500",
                        bg: "bg-slate-100",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-2"
                      >
                        <div className={`p-1.5 ${stat.bg} rounded-lg`}>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div>
                          <div className="text-lg font-black text-slate-800">
                            {stat.value}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className={`${currentView === "week" ? "p-4" : "p-6"}`}>
            {isLoading ? (
              <div className="text-center py-20">
                <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
                <p className="text-slate-500 font-medium">Loading FIRs...</p>
              </div>
            ) : (
              renderView()
            )}
          </div>
        </div>

        {/* ── FIR Detail Modal ── */}
        <Dialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsDetailOpen(false);
              setSelectedFir(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedFir && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${getPriorityIndicator(selectedFir.priority)}`}
                    >
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    {selectedFir.firNumber}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* FIR Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Complainant
                      </p>
                      <p className="font-bold text-slate-800">
                        {selectedFir.complainantName}
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
                      <p className="font-bold text-slate-800 text-sm">
                        {formatFullDate(
                          selectedFir.createdAt || selectedFir.incidentDate
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        Incident Date
                      </p>
                      <p className="font-bold text-slate-800 text-sm">
                        {formatFullDate(selectedFir.incidentDate)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedFir.description && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Description
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {selectedFir.description}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailOpen(false);
                        setIsUpdateOpen(true);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Status Update Modal ── */}
        <Dialog
          open={isUpdateOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsUpdateOpen(false);
              setNewStatus("");
              setRemarks("");
            }
          }}
        >
          <DialogContent className="max-w-lg">
            {selectedFir && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Update Status — {selectedFir.firNumber}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Current Status:</strong>
                      <div className="mt-1">
                        <StatusBadge status={selectedFir.status} />
                      </div>
                    </div>
                    <div>
                      <strong>Priority:</strong>
                      <div className="mt-1">
                        <PriorityBadge priority={selectedFir.priority} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>New Status</Label>
                    <Select
                      value={newStatus}
                      onValueChange={(v) => setNewStatus(v as FIRStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVED">Approve</SelectItem>
                        <SelectItem value="REJECTED">Reject</SelectItem>
                        <SelectItem value="UNDER_INVESTIGATION">
                          Under Investigation
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>
                      {newStatus === "REJECTED"
                        ? "Rejection Reason"
                        : "Remarks (Optional)"}
                    </Label>
                    <Textarea
                      placeholder={
                        newStatus === "REJECTED"
                          ? "Provide reason for rejection..."
                          : "Add notes or remarks..."
                      }
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsUpdateOpen(false);
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
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}