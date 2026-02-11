import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import Router hooks
import { motion } from "framer-motion"; // Import Animation
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { firApi, FIRResponse, UpdateFIRStatusRequest } from "@/services/api";
import { FIRStatus } from "@/data/firData";
import { FileText, Shield, CheckCircle, XCircle, Clock, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Activity, BarChart3 } from "lucide-react";

// 1. Updated Nav Items with specific routes
const navItems = [
  { label: "Dashboard", href: "/police/dashboard", icon: <Shield className="h-4 w-4" /> },
  { label: "All FIRs", href: "/police/firs", icon: <FileText className="h-4 w-4" /> },
  { label: "Manage Users", href: "/police/users", icon: <Users className="h-4 w-4" /> },
];

export default function PoliceDashboard() {
  const { toast } = useToast();
  const location = useLocation(); // Get current URL path
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [selectedFir, setSelectedFir] = useState<FIRResponse | null>(null);
  const [newStatus, setNewStatus] = useState<FIRStatus | "">("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
      console.error('Failed to load FIRs:', error);
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
        status: newStatus as FIRStatus,
        remarks: newStatus === "REJECTED" ? remarks : undefined,
        actionNote: newStatus !== "REJECTED" && remarks ? remarks : undefined,
      };
      const response = await firApi.updateStatus(selectedFir.id, request);
      setFirs((prev) => prev.map((f) => f.id === selectedFir.id ? response.data : f));
      toast({ title: "FIR Updated", description: `${selectedFir.firNumber} status changed` });
      setSelectedFir(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    total: firs.length,
    pending: firs.filter((f) => f.status === "PENDING").length,
    active: firs.filter((f) => ["APPROVED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(f.status)).length,
    closed: firs.filter((f) => ["CLOSED", "REJECTED"].includes(f.status)).length,
  };

  // Determine which view to render based on URL
  const isUserPage = location.pathname === "/police/users";
  const isAllFirsPage = location.pathname === "/police/firs";

  return (
    <DashboardLayout title="Police Station Portal" navItems={navItems}>
      {/* 2. Framer Motion Wrapper for Smooth Transitions */}
      <motion.div
        key={location.pathname} // Triggers animation on route change
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        
        {/* VIEW: MANAGE USERS */}
        {isUserPage && (
          <Card>
            <CardHeader><CardTitle>Manage Users</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>User management functionality goes here.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW: DASHBOARD (Stats) */}
        {!isUserPage && !isAllFirsPage && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
             {[
              { label: "Total FIRs", value: stats.total, icon: FileText, color: "text-primary" },
              { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning" },
              { label: "Active Cases", value: stats.active, icon: CheckCircle, color: "text-success" },
              { label: "Closed/Rejected", value: stats.closed, icon: XCircle, color: "text-muted-foreground" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg bg-muted p-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* VIEW: ALL FIRS (Table) - Show on Dashboard OR /firs page */}
        {(!isUserPage) && (
          <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-lg">
                    {isAllFirsPage ? "All Registered FIRs" : "Recent FIRs"}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">FIR #</th>
                      <th className="pb-3 font-medium">Complainant</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {firs.map((fir) => (
                      <tr key={fir.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 font-medium text-foreground">{fir.firNumber}</td>
                        <td className="py-3 text-muted-foreground">{fir.complainantName}</td>
                        <td className="py-3 text-muted-foreground">{fir.incidentType}</td>
                        <td className="py-3"><PriorityBadge priority={fir.priority} /></td>
                        <td className="py-3"><StatusBadge status={fir.status} /></td>
                        <td className="py-3">
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
          </Card>
        )}

        {/* Status Update Dialog */}
        <Dialog open={!!selectedFir} onOpenChange={() => setSelectedFir(null)}>
            <DialogContent className="max-w-lg">
            {selectedFir && (
                <>
                <DialogHeader><DialogTitle>{selectedFir.firNumber}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Type:</strong> {selectedFir.incidentType}</div>
                        <div><strong>Status:</strong> <StatusBadge status={selectedFir.status} /></div>
                    </div>
                    <div>
                        <Label>Update Status</Label>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FIRStatus)}>
                            <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="APPROVED">Approve</SelectItem>
                                <SelectItem value="REJECTED">Reject</SelectItem>
                                <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* ... Remarks Textarea ... */}
                    <div className="flex justify-end gap-2">
                         <Button onClick={handleUpdateStatus} disabled={isUpdating}>
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