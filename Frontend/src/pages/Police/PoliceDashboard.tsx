import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { firApi, FIRResponse, UpdateFIRStatusRequest } from "@/services/api";
import { FIRStatus } from "@/data/firData";
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
import { useToast } from "@/hooks/use-toast";

// ✅ FIXED: Consistent navItems with All FIRs + Rules & Laws
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
    label: "Chat",
    href: "/police/chat",
    icon: <MessageCircle className="h-4 w-4" />
  },
  {
    label: "Rules & Laws",
    href: "/police/rules",
    icon: <Scale className="h-4 w-4" />,
  },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
  const [newStatus, setNewStatus] = useState<FIRStatus | "">("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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
      setSelectedFir(null);
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

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const groupedFIRs: GroupedFIRs[] = useMemo(() => {
    let filtered = firs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fir) =>
          fir.firNumber.toLowerCase().includes(query) ||
          fir.complainantName.toLowerCase().includes(query) ||
          fir.incidentType.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((fir) => fir.status === statusFilter);
    }

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt || b.incidentDate).getTime() -
        new Date(a.createdAt || a.incidentDate).getTime()
    );

    const groups = new Map<string, FIRResponse[]>();
    sorted.forEach((fir) => {
      const dateKey = getDateKey(fir.createdAt || fir.incidentDate);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(fir);
    });

    return Array.from(groups.entries()).map(([dateKey, dateFirs]) => ({
      dateKey,
      dateLabel: formatDate(dateFirs[0].createdAt || dateFirs[0].incidentDate),
      relativeLabel: getRelativeDateLabel(
        dateFirs[0].createdAt || dateFirs[0].incidentDate
      ),
      firs: dateFirs,
    }));
  }, [firs, searchQuery, statusFilter]);

  const stats = {
    total: firs.length,
    pending: firs.filter((f) => f.status === "PENDING").length,
    active: firs.filter((f) =>
      ["APPROVED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(f.status)
    ).length,
    closed: firs.filter((f) => ["CLOSED", "REJECTED"].includes(f.status)).length,
  };

  const isUserPage = location.pathname === "/police/users";
  const isAllFirsPage = location.pathname === "/police/firs";
  // ✅ Dashboard only shows on /police/dashboard
  const isDashboard = !isUserPage && !isAllFirsPage;

  return (
    <DashboardLayout title="Police Station Portal" navItems={navItems}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {/* VIEW: MANAGE USERS */}
        {isUserPage && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>User management functionality goes here.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW: DASHBOARD (Stats + Recent FIRs) */}
        {isDashboard && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total FIRs",
                  value: stats.total,
                  icon: FileText,
                  color: "text-primary",
                },
                {
                  label: "Pending Review",
                  value: stats.pending,
                  icon: Clock,
                  color: "text-warning",
                },
                {
                  label: "Active Cases",
                  value: stats.active,
                  icon: CheckCircle,
                  color: "text-success",
                },
                {
                  label: "Closed/Rejected",
                  value: stats.closed,
                  icon: XCircle,
                  color: "text-muted-foreground",
                },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`rounded-lg bg-muted p-3 ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold text-card-foreground">
                        {s.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent FIRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">FIR #</th>
                        <th className="pb-3 font-medium">Complainant</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Date & Time</th>
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {firs.slice(0, 5).map((fir) => (
                        <tr
                          key={fir.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 font-medium text-foreground">
                            {fir.firNumber}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {fir.complainantName}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {fir.incidentType}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            <div className="flex flex-col">
                              <span>
                                {new Date(
                                  fir.createdAt || fir.incidentDate
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground/70">
                                {formatTime(fir.createdAt || fir.incidentDate)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <PriorityBadge priority={fir.priority} />
                          </td>
                          <td className="py-3">
                            <StatusBadge status={fir.status} />
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFir(fir)}
                            >
                              <MessageSquare className="mr-1 h-3 w-3" /> Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* VIEW: ALL FIRS - Date-wise Grouped */}
        {isAllFirsPage && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by FIR #, complainant, or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
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
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <p>
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {groupedFIRs.reduce((acc, g) => acc + g.firs.length, 0)}
                    </span>{" "}
                    FIRs across{" "}
                    <span className="font-semibold text-foreground">
                      {groupedFIRs.length}
                    </span>{" "}
                    date(s)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCollapsedDates(
                        collapsedDates.size === groupedFIRs.length
                          ? new Set()
                          : new Set(groupedFIRs.map((g) => g.dateKey))
                      )
                    }
                  >
                    {collapsedDates.size === groupedFIRs.length
                      ? "Expand All"
                      : "Collapse All"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading && (
              <div className="text-center py-10">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading FIRs...</p>
              </div>
            )}

            {!isLoading && groupedFIRs.length === 0 && (
              <Card>
                <CardContent className="text-center py-10">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg font-medium">
                    No FIRs found
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {searchQuery || statusFilter !== "ALL"
                      ? "Try adjusting your search or filter."
                      : "No FIRs have been registered yet."}
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading &&
              groupedFIRs.map((group, groupIndex) => (
                <motion.div
                  key={group.dateKey}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <button
                      onClick={() => toggleDateCollapse(group.dateKey)}
                      className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors border-b"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-foreground">
                            {group.relativeLabel}
                          </h3>
                          {(group.relativeLabel === "Today" ||
                            group.relativeLabel === "Yesterday") && (
                              <p className="text-xs text-muted-foreground">
                                {group.dateLabel}
                              </p>
                            )}
                        </div>
                        <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {group.firs.length}{" "}
                          {group.firs.length === 1 ? "FIR" : "FIRs"}
                        </span>
                      </div>
                      {collapsedDates.has(group.dateKey) ? (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {!collapsedDates.has(group.dateKey) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-muted-foreground bg-muted/30">
                                  <th className="px-4 py-3 font-medium">FIR #</th>
                                  <th className="px-4 py-3 font-medium">Complainant</th>
                                  <th className="px-4 py-3 font-medium">Type</th>
                                  <th className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Time
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 font-medium">Priority</th>
                                  <th className="px-4 py-3 font-medium">Status</th>
                                  <th className="px-4 py-3 font-medium">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {group.firs.map((fir, firIndex) => (
                                  <motion.tr
                                    key={fir.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: firIndex * 0.03,
                                    }}
                                    className="hover:bg-muted/50 transition-colors"
                                  >
                                    <td className="px-4 py-3 font-medium text-foreground">
                                      {fir.firNumber}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {fir.complainantName}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {fir.incidentType}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                                        <span>
                                          {formatTime(
                                            fir.createdAt || fir.incidentDate
                                          )}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <PriorityBadge priority={fir.priority} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <StatusBadge status={fir.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFir(fir)}
                                      >
                                        <MessageSquare className="mr-1 h-3 w-3" />{" "}
                                        Review
                                      </Button>
                                    </td>
                                  </motion.tr>
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
        )}

        {/* Status Update Dialog */}
        <Dialog
          open={!!selectedFir}
          onOpenChange={() => {
            setSelectedFir(null);
            setNewStatus("");
            setRemarks("");
          }}
        >
          <DialogContent className="max-w-lg">
            {selectedFir && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedFir.firNumber}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Type:</strong> {selectedFir.incidentType}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <StatusBadge status={selectedFir.status} />
                    </div>
                    <div>
                      <strong>Complainant:</strong>{" "}
                      {selectedFir.complainantName}
                    </div>
                    <div>
                      <strong>Filed On:</strong>{" "}
                      {formatDateTime(
                        selectedFir.createdAt || selectedFir.incidentDate
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Update Status</Label>
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
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}