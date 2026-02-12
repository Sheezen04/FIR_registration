import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { INCIDENT_TYPES } from "@/data/firData";
import { useAuth } from "@/contexts/AuthContext";
import { firApi, FIRResponse, FIRRequest } from "@/services/api";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type FIRStatus = "PENDING" | "APPROVED" | "REJECTED" | "UNDER_INVESTIGATION" | "IN_PROGRESS" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

const navItems = [
  { label: "Dashboard", href: "/citizen", icon: <FileText className="h-4 w-4" /> },
  { label: "File New FIR", href: "/citizen/new", icon: <Plus className="h-4 w-4" /> },
  { label: "My FIRs", href: "/citizen/history", icon: <Clock className="h-4 w-4" /> },
];

const mapStatus = (status: string): string => {
  return status.toLowerCase().replace(/_/g, "_");
};

const mapPriority = (priority: string): string => {
  return priority.toLowerCase();
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FIRStatus | "all">("all");
  const [selectedFir, setSelectedFir] = useState<FIRResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFIRs();
  }, []);

  const loadFIRs = async () => {
    try {
      setIsLoading(true);
      const response = await firApi.getMy();
      setFirs(response.data);
    } catch (error) {
      console.error('Failed to load FIRs:', error);
      toast({ title: "Error", description: "Failed to load FIRs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: firs.length,
    pending: firs.filter((f) => f.status === "PENDING").length,
    approved: firs.filter((f) => ["APPROVED", "UNDER_INVESTIGATION", "IN_PROGRESS"].includes(f.status)).length,
    rejected: firs.filter((f) => f.status === "REJECTED").length,
  };

  const filteredFirs = filter === "all" ? firs : firs.filter((f) => f.status === filter);

  const handleSubmitFIR = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const fd = new FormData(e.currentTarget);
      const request: FIRRequest = {
        incidentType: fd.get("incidentType") as string,
        description: fd.get("description") as string,
        dateTime: fd.get("dateTime") as string,
        priority: fd.get("priority") as Priority,
        location: fd.get("location") as string,
      };
      
      const response = await firApi.create(request);
      setFirs((prev) => [response.data, ...prev]);
      setShowForm(false);
      toast({ title: "FIR Submitted", description: `FIR ${response.data.firNumber} has been filed successfully.` });
    } catch (error) {
      console.error('Failed to submit FIR:', error);
      toast({ title: "Error", description: "Failed to submit FIR", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Citizen Dashboard" navItems={navItems}>
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total FIRs", value: stats.total, icon: FileText, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
          { label: "Active", value: stats.approved, icon: CheckCircle, color: "text-success" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
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

      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "PENDING", "APPROVED", "REJECTED", "UNDER_INVESTIGATION", "IN_PROGRESS", "CLOSED"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f as FIRStatus | "all")}
              className={filter === f ? "gradient-navy text-white" : ""}
            >
              {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-gold text-accent-foreground font-semibold">
          <Plus className="mr-2 h-4 w-4" /> File New FIR
        </Button>
      </div>

      {/* FIR Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">File New FIR</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitFIR} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="incidentType">Incident Type</Label>
                <Select name="incidentType" required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" required>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="dateTime">Date & Time of Incident</Label>
              <Input id="dateTime" name="dateTime" type="datetime-local" required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Enter incident location" required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Describe the incident in detail..." rows={4} required disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="evidence">Upload Evidence (Images/Documents)</Label>
              <Input id="evidence" name="evidence" type="file" multiple accept="image/*,.pdf,.doc,.docx" disabled={isSubmitting} />
              <p className="mt-1 text-xs text-muted-foreground">Max 5 files. Supported: Images, PDF, DOC</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" className="gradient-gold text-accent-foreground font-semibold" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit FIR"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FIR Detail Dialog */}
      <Dialog open={!!selectedFir} onOpenChange={() => setSelectedFir(null)}>
        <DialogContent className="max-w-lg">
          {selectedFir && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFir.firNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <StatusBadge status={selectedFir.status} />
                  <PriorityBadge priority={selectedFir.priority} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Type:</span> {selectedFir.incidentType}</div>
                  <div><span className="text-muted-foreground">Date:</span> {new Date(selectedFir.dateTime).toLocaleDateString()}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Location:</span> {selectedFir.location}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1">{selectedFir.description}</p>
                </div>
                {selectedFir.assignedOfficer && (
                  <div><span className="text-muted-foreground">Assigned Officer:</span> {selectedFir.assignedOfficer}</div>
                )}
                {selectedFir.remarks && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Police Remarks</p>
                    <p className="mt-1 text-muted-foreground">{selectedFir.remarks}</p>
                  </div>
                )}
                {selectedFir.actionNotes && selectedFir.actionNotes.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1">Action Notes:</p>
                    <ul className="space-y-1">
                      {selectedFir.actionNotes.map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="mt-0.5 h-3 w-3 text-success shrink-0" /> {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* FIR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your FIRs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Loading FIRs...</p>
            </div>
          ) : filteredFirs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted" />
              <p>No FIRs found. File your first FIR to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">FIR Number</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFirs.map((fir) => (
                    <tr key={fir.id} className="hover:bg-muted/50">
                      <td className="py-3 font-medium text-foreground">{fir.firNumber}</td>
                      <td className="py-3 text-muted-foreground">{fir.incidentType}</td>
                      <td className="py-3 text-muted-foreground">{new Date(fir.dateTime).toLocaleDateString()}</td>
                      <td className="py-3"><PriorityBadge priority={fir.priority} /></td>
                      <td className="py-3"><StatusBadge status={fir.status} /></td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFir(fir)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
