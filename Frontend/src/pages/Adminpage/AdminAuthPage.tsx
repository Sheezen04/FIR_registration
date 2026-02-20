import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminAuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  
  // Validation state
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, registerAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 🔐 Strong Password Validation
  const validatePassword = (password: string) => {
    const minLength = /.{6,}/;
    const hasUpperCase = /[A-Z]/;
    const hasNumber = /[0-9]/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    return (
      minLength.test(password) &&
      hasUpperCase.test(password) &&
      hasNumber.test(password) &&
      hasSpecialChar.test(password)
    );
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (!validatePassword(value)) {
      setPasswordError(
        "Minimum 6 characters, 1 uppercase, number & 1 special character required."
      );
    } else {
      setPasswordError("");
    }

    if (confirmPassword && value !== confirmPassword) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);

    if (password !== value) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await login(loginEmail, loginPassword, "admin");
      if (success) {
        toast({ title: "Login successful", description: "Welcome back, Admin!" });
        navigate("/admin/dashboard");
      } else {
        toast({ title: "Login failed", description: "Invalid credentials or not an admin account", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Login failed", description: "An error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      toast({
        title: "Invalid Password",
        description:
          "Password must be at least 6 characters and include 1 uppercase, number & 1 special character.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    // Admin authorization code validation
    if (adminCode !== "ADMIN2024") {
      toast({ title: "Error", description: "Invalid admin authorization code", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await registerAdmin(name, email, password);
      if (success) {
        toast({ title: "Registration successful", description: "Welcome to FIR System Admin!" });
        navigate("/admin/dashboard");
      } else {
        toast({ title: "Registration failed", description: "Email may already exist", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Registration failed", description: "An error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 gradient-hero items-center justify-center lg:flex">
        <div className="max-w-md text-center px-8">
          <Shield className="mx-auto mb-6 h-16 w-16 text-accent" />
          <h2 className="mb-4 text-3xl font-bold text-white">Admin Portal</h2>
          <p className="text-white/60">Authorized access for system administrators. Manage users, FIRs, and system settings.</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-primary">FIR System</span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="text-muted-foreground">Access for system administrators</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "login" | "register");
            setPasswordError("");
            setConfirmError("");
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input 
                    id="loginEmail" 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    placeholder="Enter your email" 
                    required 
                    disabled={isSubmitting} 
                  />
                </div>
                <div>
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input 
                    id="loginPassword" 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    placeholder="Enter your password" 
                    required 
                    disabled={isSubmitting} 
                  />
                </div>
                <Button type="submit" className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90" disabled={isSubmitting}>
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your full name" 
                    required 
                    disabled={isSubmitting} 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email" 
                    required 
                    disabled={isSubmitting} 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => handlePasswordChange(e.target.value)} 
                    placeholder="Create a password" 
                    required 
                    disabled={isSubmitting} 
                  />
                  {passwordError && (
                    <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordError}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)} 
                    placeholder="Confirm your password" 
                    required 
                    disabled={isSubmitting} 
                  />
                  {confirmError && (
                    <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {confirmError}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="adminCode" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Admin Authorization Code
                  </Label>
                  <Input 
                    id="adminCode" 
                    type="password" 
                    value={adminCode} 
                    onChange={(e) => setAdminCode(e.target.value)} 
                    placeholder="Enter authorization code" 
                    required 
                    disabled={isSubmitting} 
                  />
                </div>
                <Button type="submit" className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90" disabled={isSubmitting || !!passwordError || !!confirmError}>
                  {isSubmitting ? "Creating Account..." : "Create Admin Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/" className="font-medium text-primary hover:underline">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}