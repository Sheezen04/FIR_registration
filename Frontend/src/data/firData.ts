export type FIRStatus = "PENDING" | "APPROVED" | "REJECTED" | "UNDER_INVESTIGATION" | "IN_PROGRESS" | "CLOSED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

export interface FIR {
  id: string;
  firNumber: string;
  complainantName: string;
  complainantEmail: string;
  incidentType: string;
  description: string;
  dateTime: string;
  priority: Priority;
  location: string;
  status: FIRStatus;
  createdAt: string;
  updatedAt: string;
  assignedStation?: string;
  assignedOfficer?: string;
  remarks?: string;
  actionNotes?: string[];
  evidenceFiles?: string[];
}

export const INCIDENT_TYPES = [
  "Theft", "Robbery", "Assault", "Fraud", "Cybercrime",
  "Missing Person", "Domestic Violence", "Vandalism",
  "Traffic Accident", "Drug Related", "Other"
];

export const MOCK_FIRS: FIR[] = [
  {
    id: "1", firNumber: "FIR-2026-0001", complainantName: "Rahul Sharma",
    complainantEmail: "citizen@demo.com", incidentType: "Theft",
    description: "My laptop was stolen from the coffee shop on MG Road around 3 PM.",
    dateTime: "2026-02-10T15:00", priority: "MEDIUM", location: "MG Road, Bangalore",
    status: "APPROVED", createdAt: "2026-02-10T16:30", updatedAt: "2026-02-11T09:00",
    assignedStation: "Central Police Station", assignedOfficer: "Inspector Patel",
    actionNotes: ["FIR verified and approved", "CCTV footage being reviewed"]
  },
  {
    id: "2", firNumber: "FIR-2026-0002", complainantName: "Rahul Sharma",
    complainantEmail: "citizen@demo.com", incidentType: "Fraud",
    description: "Online scam — ₹50,000 debited via fake UPI link.",
    dateTime: "2026-02-09T10:00", priority: "HIGH", location: "Online Transaction",
    status: "UNDER_INVESTIGATION", createdAt: "2026-02-09T11:00", updatedAt: "2026-02-10T14:00",
    assignedStation: "Cyber Crime Cell", assignedOfficer: "Inspector Patel",
    actionNotes: ["Cyber team assigned", "Bank notified for transaction reversal"]
  },
  {
    id: "3", firNumber: "FIR-2026-0003", complainantName: "Rahul Sharma",
    complainantEmail: "citizen@demo.com", incidentType: "Vandalism",
    description: "Car windshield smashed in parking lot overnight.",
    dateTime: "2026-02-08T07:00", priority: "LOW", location: "Sector 15, Noida",
    status: "REJECTED", createdAt: "2026-02-08T08:00", updatedAt: "2026-02-09T10:00",
    remarks: "Insufficient evidence. Please provide CCTV footage or witness details."
  },
  {
    id: "4", firNumber: "FIR-2026-0004", complainantName: "Priya Verma",
    complainantEmail: "priya@demo.com", incidentType: "Missing Person",
    description: "My 10-year-old son has been missing since yesterday evening.",
    dateTime: "2026-02-10T18:00", priority: "EMERGENCY", location: "Connaught Place, Delhi",
    status: "PENDING", createdAt: "2026-02-10T20:00", updatedAt: "2026-02-10T20:00",
  },
  {
    id: "5", firNumber: "FIR-2026-0005", complainantName: "Amit Kumar",
    complainantEmail: "amit@demo.com", incidentType: "Assault",
    description: "Was assaulted by unknown persons near the bus stop.",
    dateTime: "2026-02-11T01:00", priority: "HIGH", location: "Andheri West, Mumbai",
    status: "IN_PROGRESS", createdAt: "2026-02-11T02:00", updatedAt: "2026-02-11T08:00",
    assignedStation: "Andheri Police Station", assignedOfficer: "Inspector Patel",
    actionNotes: ["Victim statement recorded", "Suspects identified from CCTV"]
  },
];

export const STATUS_CONFIG: Record<FIRStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-warning text-warning-foreground" },
  APPROVED: { label: "Approved", color: "bg-success text-success-foreground" },
  REJECTED: { label: "Rejected", color: "bg-destructive text-destructive-foreground" },
  UNDER_INVESTIGATION: { label: "Under Investigation", color: "bg-info text-info-foreground" },
  IN_PROGRESS: { label: "In Progress", color: "bg-info text-info-foreground" },
  CLOSED: { label: "Closed", color: "bg-muted text-muted-foreground" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-muted text-muted-foreground" },
  MEDIUM: { label: "Medium", color: "bg-warning/20 text-warning" },
  HIGH: { label: "High", color: "bg-emergency/20 text-emergency" },
  EMERGENCY: { label: "Emergency", color: "bg-emergency text-emergency-foreground" },
};
