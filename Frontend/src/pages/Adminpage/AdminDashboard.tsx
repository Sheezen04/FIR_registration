import { useState, useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { firApi, userApi, FIRResponse, UserResponse, DashboardStats } from "@/services/api";
import { Shield, Users, FileText, BarChart3, Activity, Search, X, Loader2 } from "lucide-react";
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
];

const COLORS = ["hsl(220,60%,20%)", "hsl(43,96%,56%)", "hsl(142,71%,35%)", "hsl(0,72%,51%)", "hsl(210,92%,55%)"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "hsl(220,60%,20%)",
  Approved: "hsl(43,96%,56%)",
  Investigating: "hsl(142,71%,35%)",
  "In Progress": "hsl(210,92%,55%)",
  Rejected: "hsl(0,72%,51%)",
};

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, name, value }: any) => {
  if (value === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12} className="fill-foreground">
      {`${name} (${value})`}
    </text>
  );
};

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.value}: {entry.payload.value}</span>
        </div>
      ))}
    </div>
  );
};

const ALL_ROLES = "all_roles";
const ALL_STATIONS = "all_stations";
const USERS_PER_PAGE = 5; // Load 5 users at a time

export default function AdminDashboard() {
  const { toast } = useToast();
  const [firs, setFirs] = useState<FIRResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState(ALL_ROLES);
  const [filterStation, setFilterStation] = useState(ALL_STATIONS);

  // Pagination / Scroll State
  const [visibleCount, setVisibleCount] = useState(USERS_PER_PAGE);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map((u) => u.role));
    return Array.from(roles).sort();
  }, [users]);

  const uniqueStations = useMemo(() => {
    const stations = new Set(users.map((u) => u.station).filter(Boolean));
    return Array.from(stations).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query) || u.role?.toLowerCase().includes(query) || u.station?.toLowerCase().includes(query);
      const matchesRole = filterRole === ALL_ROLES || u.role === filterRole;
      const matchesStation = filterStation === ALL_STATIONS || u.station === filterStation;
      return matchesSearch && matchesRole && matchesStation;
    });
  }, [users, searchQuery, filterRole, filterStation]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(USERS_PER_PAGE);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, filterRole, filterStation]);

  // Handle Infinite Scroll
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
      // If user is near bottom (within 20px)
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        if (visibleCount < filteredUsers.length) {
          setVisibleCount((prev) => Math.min(prev + USERS_PER_PAGE, filteredUsers.length));
        }
      }
    }
  };

  // Get current slice of users to display
  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasActiveFilters = searchQuery || filterRole !== ALL_ROLES || filterStation !== ALL_STATIONS;

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterRole(ALL_ROLES);
    setFilterStation(ALL_STATIONS);
  };

  const statusData = stats ? [{ name: "Pending", value: stats.pendingFirs }, { name: "Approved", value: stats.approvedFirs }, { name: "Investigating", value: stats.underInvestigationFirs }, { name: "In Progress", value: stats.inProgressFirs }, { name: "Rejected", value: stats.rejectedFirs }].filter((item) => item.value > 0) : [];
  const typeData = stats?.firsByIncidentType ? Object.entries(stats.firsByIncidentType).map(([name, count]) => ({ name, count })) : [];
  const priorityData = stats ? [{ name: "Low", value: stats.firsByPriority?.LOW || 0 }, { name: "Medium", value: stats.firsByPriority?.MEDIUM || 0 }, { name: "High", value: stats.firsByPriority?.HIGH || 0 }, { name: "Emergency", value: stats.firsByPriority?.EMERGENCY || 0 }] : [];

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
      console.error("Failed to create user:", error);
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    } finally {
      setIsAddingUser(false);
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      {/* Stats Cards */}
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
              <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold text-card-foreground">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">FIR Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" outerRadius={80} innerRadius={35} dataKey="value" paddingAngle={3} labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }} label={renderCustomizedLabel}>
                    {statusData.map((entry, i) => (<Cell key={`cell-${i}`} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--card-foreground))" }} formatter={(value: number, name: string) => [`${value} FIRs`, name]} />
                  <Legend content={renderCustomLegend} verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (<div className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">No data available</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">FIRs by Incident Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--card-foreground))" }} />
                <Bar dataKey="count" fill="hsl(220,60%,20%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Priority Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--card-foreground))" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityData.map((_, i) => (<Cell key={i} fill={["hsl(215,15%,70%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(0,84%,60%)"][i]} />))}
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
          {/* <Button size="sm" onClick={() => setShowAddUser(true)} className="gradient-gold text-accent-foreground font-semibold">Add User</Button> */}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, email, role or station…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-9" />
              {searchQuery && (<button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>)}
            </div>
            <div className="w-full sm:w-44">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL_ROLES}>All Roles</SelectItem>{uniqueRoles.map((role) => (<SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-52">
              <Select value={filterStation} onValueChange={setFilterStation}>
                <SelectTrigger><SelectValue placeholder="All Stations" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL_STATIONS}>All Stations</SelectItem>{uniqueStations.map((station) => (<SelectItem key={station} value={station}>{station}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (<Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="mr-1 h-4 w-4" />Clear</Button>)}
          </div>

          {hasActiveFilters && (<p className="mb-3 text-xs text-muted-foreground">Showing <span className="font-semibold text-foreground">{visibleUsers.length}</span> of <span className="font-semibold text-foreground">{filteredUsers.length}</span> results (filtered from {users.length})</p>)}

          {/* SCROLLABLE TABLE CONTAINER */}
          <div 
            className="rounded-md border max-h-[400px] overflow-y-auto relative" 
            ref={tableContainerRef}
            onScroll={handleScroll}
          >
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b text-left text-muted-foreground shadow-sm">
                  <th className="py-3 px-4 font-medium bg-muted/50">Name</th>
                  <th className="py-3 px-4 font-medium bg-muted/50">Email</th>
                  <th className="py-3 px-4 font-medium bg-muted/50">Role</th>
                  <th className="py-3 px-4 font-medium bg-muted/50">Station</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleUsers.length > 0 ? (
                  visibleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{u.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">{u.role}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.station}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">No users found</p>
                        {hasActiveFilters && (<Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-1">Clear all filters</Button>)}
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Loading indicator at bottom of list */}
                {visibleCount < filteredUsers.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading more users...
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {visibleUsers.length > 0 && (
            <div className="mt-2 text-xs text-center text-muted-foreground">
               Showing {visibleUsers.length} of {filteredUsers.length} users
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div><Label>Full Name</Label><Input name="name" placeholder="Enter name" required disabled={isAddingUser} /></div>
            <div><Label>Email</Label><Input name="email" type="email" placeholder="Enter email" required disabled={isAddingUser} /></div>
            <div>
              <Label>Role</Label>
              <Select name="role" required>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent><SelectItem value="POLICE">Police Officer</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Station</Label><Input name="station" placeholder="Enter police station" required disabled={isAddingUser} /></div>
            <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={() => setShowAddUser(false)} disabled={isAddingUser}>Cancel</Button><Button type="submit" className="gradient-gold text-accent-foreground font-semibold" disabled={isAddingUser}>{isAddingUser ? "Creating..." : "Create User"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}