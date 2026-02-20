import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, BadgeCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoliceAuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [station, setStation] = useState("");
  const [policeCode, setPoliceCode] = useState("");

  // Validation State
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, registerPolice, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ✅ Redirect if already logged in as police
  useEffect(() => {
    if (isAuthenticated && user?.role === "police") {
      navigate("/police/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      const success = await login(loginEmail, loginPassword, "police");
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back, Officer!",
        });
        navigate("/police/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials or not a police account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (policeCode !== "POLICE2024") {
      toast({
        title: "Error",
        description: "Invalid police authorization code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await registerPolice(name, email, password, station);

      if (success) {
        toast({
          title: "Registration successful",
          description: "Welcome to FIR System, Officer!",
        });
        // ✅ Passing newUser: true to trigger the Police Dashboard Onboarding Guide
        navigate("/police/dashboard", { state: { newUser: true } });
      } else {
        toast({
          title: "Registration failed",
          description: "Email may already exist",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 gradient-hero items-center justify-center lg:flex">
        <div className="max-w-md text-center px-8">
          <BadgeCheck className="mx-auto mb-6 h-16 w-16 text-accent" />
          <h2 className="mb-4 text-3xl font-bold text-white">
            Police Portal
          </h2>
          <p className="text-white/60">
            Authorized access for law enforcement officers. Manage FIRs,
            investigate cases, and update case statuses.
          </p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-primary">
                FIR System
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Police Portal
            </h1>
            <p className="text-muted-foreground">
              Access for law enforcement officers
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "login" | "register");
              setPasswordError("");
              setConfirmError("");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* ── LOGIN TAB ── */}
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
                <Button
                  type="submit"
                  className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* ── REGISTER TAB ── */}
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
                  <Label htmlFor="station">Police Station</Label>
                  <Input
                    id="station"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    placeholder="Enter your police station"
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
                  <Label
                    htmlFor="policeCode"
                    className="flex items-center gap-2"
                  >
                    <BadgeCheck className="h-4 w-4" /> Police Authorization Code
                  </Label>
                  <Input
                    id="policeCode"
                    type="password"
                    value={policeCode}
                    onChange={(e) => setPoliceCode(e.target.value)}
                    placeholder="Enter authorization code"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90"
                  disabled={isSubmitting || !!passwordError || !!confirmError}
                >
                  {isSubmitting
                    ? "Creating Account..."
                    : "Create Police Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/"
              className="font-medium text-primary hover:underline"
            >
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}