import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, LogOut, Menu, X, User as UserIcon, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userApi, UpdateProfileRequest } from "@/services/api";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  navItems: { label: string; href: string; icon: ReactNode }[];
}

export default function DashboardLayout({
  children,
  title,
  navItems,
}: DashboardLayoutProps) {
  const { user, logout, setUser } = useAuth(); // Assuming setUser exists in your context to update local state
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // Pre-fill form when modal opens
  useEffect(() => {
    if (isProfileOpen && user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [isProfileOpen, user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentPassword) {
      toast({ title: "Error", description: "Current password is required to verify your identity.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const payload: UpdateProfileRequest = {
        name: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword.trim(), // Trim whitespace
        newPassword: formData.newPassword?.trim() || undefined, // Trim whitespace
      };

      const response = await userApi.updateProfile(payload);
      
      // Update local user context and persist to localStorage
      if (setUser) {
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      toast({ title: "Success", description: "Profile updated successfully." });
      setIsProfileOpen(false);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to update profile. Check your password.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ====== SIDEBAR ====== */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed inset-y-0 left-0 z-50 
          bg-slate-900
          shadow-xl
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          lg:translate-x-0 lg:relative
          ${isHovered ? "lg:w-64" : "lg:w-[72px]"}
        `}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* ── Logo / Brand ── */}
          <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isHovered ? "lg:w-auto lg:opacity-100" : "lg:w-0 lg:opacity-0"
              }`}
            >
              <h2 className="whitespace-nowrap text-sm font-bold text-white">
                FIR System
              </h2>
              <p className="whitespace-nowrap text-xs text-slate-400 capitalize">
                {user?.role} Panel
              </p>
            </div>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group relative flex items-center gap-3 rounded-lg px-3 py-2.5 
                    text-sm transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-600 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  {/* Icon */}
                  <span className="shrink-0">{item.icon}</span>

                  {/* Label */}
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      isHovered
                        ? "lg:w-auto lg:opacity-100"
                        : "lg:w-0 lg:opacity-0"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip when collapsed */}
                  {!isHovered && (
                    <span
                      className="
                        absolute left-full ml-3 hidden rounded-md 
                        bg-slate-800 px-2.5 py-1.5 text-xs font-medium 
                        text-white shadow-lg border border-slate-700
                        lg:group-hover:block
                        whitespace-nowrap z-50
                      "
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── User Info & Logout ── */}
          <div className="border-t border-slate-700 p-3">
            {/* User avatar + info (Clickable Button) */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-full mb-2 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isHovered
                    ? "lg:w-auto lg:opacity-100"
                    : "lg:w-0 lg:opacity-0"
                }`}
              >
                <p className="whitespace-nowrap text-sm font-medium text-white">
                  {user?.name}
                </p>
                <p className="whitespace-nowrap text-xs text-slate-400">
                  {user?.email}
                </p>
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-red-600/20 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  isHovered
                    ? "lg:w-auto lg:opacity-100"
                    : "lg:w-0 lg:opacity-0"
                }`}
              >
                Logout
              </span>

              {/* Tooltip when collapsed */}
              {!isHovered && (
                <span
                  className="
                    absolute left-full ml-3 hidden rounded-md 
                    bg-slate-800 px-2.5 py-1.5 text-xs font-medium 
                    text-white shadow-lg border border-slate-700
                    lg:group-hover:block
                    whitespace-nowrap z-50
                  "
                >
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ====== MOBILE OVERLAY ====== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 border-b bg-card px-6 py-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>

      {/* ====== PROFILE UPDATE DIALOG ====== */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal details. Current password is required to confirm changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileUpdate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="pl-9"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-2 mt-2">
               <p className="text-xs text-muted-foreground mb-3">Leave new password blank if you don't want to change it.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password (Optional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 6 characters"
                  className="pl-9"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-red-600 font-medium">Current Password (Required)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-red-400" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Verify it's you"
                  className="pl-9 border-red-200 focus-visible:ring-red-500"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}