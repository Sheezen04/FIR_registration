import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    try {
      const success = await register(name, email, password);

      if (success) {
        toast({
          title: "Registration successful",
          description: "Welcome to FIR System!",
        });
        navigate("/citizen");
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

  const isFormInvalid =
    !name ||
    !email ||
    !password ||
    !confirmPassword ||
    passwordError ||
    confirmError;

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden w-1/2 gradient-hero items-center justify-center lg:flex">
        <div className="max-w-md text-center px-8">
          <Shield className="mx-auto mb-6 h-16 w-16 text-accent" />
          <h2 className="mb-4 text-3xl font-bold text-white">
            Join the Platform
          </h2>
          <p className="text-white/60">
            Register as a citizen to file and track FIRs online.
            Quick, secure, and transparent.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-primary">
                FIR System
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              Register as a citizen
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
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

            {/* Email */}
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

            {/* Password */}
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    handlePasswordChange(e.target.value)
                  }
                  placeholder="Create a password"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  handleConfirmPasswordChange(e.target.value)
                }
                placeholder="Confirm your password"
                required
                disabled={isSubmitting}
              />
              {confirmError && (
                <p className="text-sm text-red-500 mt-1">
                  {confirmError}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90"
              disabled={isSubmitting || !!isFormInvalid}
            >
              {isSubmitting
                ? "Creating Account..."
                : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
