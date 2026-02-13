import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { INCIDENT_TYPES } from "@/data/firData";
import { useAuth } from "@/contexts/AuthContext";
import { firApi, fileApi, FIRResponse, FIRRequest } from "@/services/api";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertTriangle, Paperclip, Download, Eye, FileImage, File as FileIcon } from "lucide-react";
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

// File helper functions
const getFileExtension = (filePath: string): string => {
  const name = filePath.split("/").pop() || filePath;
  return name.split(".").pop()?.toLowerCase() || "";
};

const getFileName = (filePath: string): string => {
  return filePath.split("/").pop() || filePath;
};

const getFileType = (filePath: string): "image" | "pdf" | "doc" | "other" => {
  const ext = getFileExtension(filePath);
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext)) return "doc";
  return "other";
};

const getFileUrl = (filePath: string): string => {
  if (filePath.startsWith("http")) return filePath;
  if (filePath.startsWith("uploads/")) return `/${filePath}`;
  return `/uploads/${filePath}`;
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
      
      // Handle file uploads first
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      let evidenceFilePaths: string[] = [];
      
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const files = Array.from(fileInput.files);
        const uploadResponse = await fileApi.upload(files);
        evidenceFilePaths = uploadResponse.data;
      }
      
      const request: FIRRequest = {
        incidentType: fd.get("incidentType") as string,
        description: fd.get("description") as string,
        dateTime: fd.get("dateTime") as string,
        priority: fd.get("priority") as Priority,
        location: fd.get("location") as string,
        evidenceFiles: evidenceFilePaths,
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
                {/* Evidence Files */}
                {selectedFir.evidenceFiles && selectedFir.evidenceFiles.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Evidence Files ({selectedFir.evidenceFiles.length})</span>
                    </div>
                    <div className="space-y-2">
                      {selectedFir.evidenceFiles.map((filePath, idx) => {
                        const fileName = getFileName(filePath);
                        const fileType = getFileType(filePath);
                        const fileUrl = getFileUrl(filePath);
                        
                        return (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            {fileType === "image" ? (
                              <FileImage className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
                            )}
                            <span className="flex-1 text-sm truncate">{fileName}</span>
                            <div className="flex gap-1">
                              {fileType === "image" && (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-background">
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                </a>
                              )}
                              <a href={fileUrl} download={fileName} className="p-1.5 rounded hover:bg-background">
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
