import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { firApi, userApi, FIRResponse, UserResponse, DashboardStats } from "@/services/api";
import { Shield, Users, FileText, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Manage Users", href: "/admin/dashboard/users", icon: <Users className="h-4 w-4" /> },
  { label: "All FIRs", href: "/admin/dashboard/firs", icon: <FileText className="h-4 w-4" /> },
  { label: "System Logs", href: "/admin/dashboard/logs", icon: <Activity className="h-4 w-4" /> },
];

const COLORS = ["hsl(220,60%,20%)", "hsl(43,96%,56%)", "hsl(142,71%,35%)", "hsl(0,72%,51%)", "hsl(210,92%,55%)"];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [firsRes, usersRes, statsRes] = await Promise.all([
        firApi.getAll(),
        userApi.getAll(),
        firApi.getStats(),
      ]);
      setFirs(firsRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Analytics data
  const statusData = stats ? [
    { name: "Pending", value: stats.pendingFirs },
    { name: "Approved", value: stats.approvedFirs },
    { name: "Investigating", value: stats.underInvestigationFirs },
    { name: "In Progress", value: stats.inProgressFirs },
    { name: "Rejected", value: stats.rejectedFirs },
  ] : [];

  const typeData = stats?.firsByIncidentType 
    ? Object.entries(stats.firsByIncidentType).map(([name, count]) => ({ name, count }))
    : [];

  const priorityData = stats ? [
    { name: "Low", value: stats.firsByPriority?.LOW || 0 },
    { name: "Medium", value: stats.firsByPriority?.MEDIUM || 0 },
    { name: "High", value: stats.firsByPriority?.HIGH || 0 },
    { name: "Emergency", value: stats.firsByPriority?.EMERGENCY || 0 },
  ] : [];

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingUser(true);
    
    try {
      const fd = new FormData(e.currentTarget);
      const response = await userApi.create({
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: "password123",
        role: fd.get("role") as string,
        station: fd.get("station") as string,
      });
      
      setUsers((prev) => [...prev, response.data]);
      setShowAddUser(false);
      toast({ title: "User Created", description: `${response.data.name} added as ${response.data.role}` });
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    } finally {
      setIsAddingUser(false);
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total FIRs", value: stats?.totalFirs || 0, icon: FileText, color: "text-primary" },
          { label: "Active Officers", value: stats?.policeOfficers || 0, icon: Shield, color: "text-info" },
          { label: "Emergency FIRs", value: stats?.emergencyFirs || 0, icon: Activity, color: "text-emergency" },
          { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-success" },
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

      {/* Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">FIR Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">FIRs by Incident Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(220,60%,20%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority Chart */}
      <div className="mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Priority Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={["hsl(215,15%,70%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(0,84%,60%)"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">User Management</CardTitle>
          <Button size="sm" onClick={() => setShowAddUser(true)} className="gradient-gold text-accent-foreground font-semibold">
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Station</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="py-3 font-medium text-foreground">{u.name}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3"><span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">{u.role}</span></td>
                    <td className="py-3 text-muted-foreground">{u.station}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input name="name" placeholder="Enter name" required disabled={isAddingUser} />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="Enter email" required disabled={isAddingUser} />
            </div>
            <div>
              <Label>Role</Label>
              <Select name="role" required>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POLICE">Police Officer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Station</Label>
              <Input name="station" placeholder="Enter police station" required disabled={isAddingUser} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setShowAddUser(false)} disabled={isAddingUser}>Cancel</Button>
              <Button type="submit" className="gradient-gold text-accent-foreground font-semibold" disabled={isAddingUser}>
                {isAddingUser ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
