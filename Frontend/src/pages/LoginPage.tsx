import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [generatedCaptcha, setCaptcha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 🔄 Generate Random Captcha
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  // Generate on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaInput !== generatedCaptcha) {
      toast({
        title: "Invalid Captcha",
        description: "Please enter the correct captcha code.",
        variant: "destructive",
      });
      // Refresh captcha on failure for security
      generateCaptcha();
      setCaptchaInput("");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(email, password, "citizen");

      if (success) {
        toast({ title: "Login successful", description: "Welcome back!" });
        navigate("/citizen");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        // Refresh captcha on failed login attempt
        generateCaptcha();
        setCaptchaInput("");
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

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 gradient-hero items-center justify-center lg:flex">
        <div className="max-w-md text-center px-8">
          <Shield className="mx-auto mb-6 h-16 w-16 text-accent" />
          <h2 className="mb-4 text-3xl font-bold text-white">
            FIR Registration System
          </h2>
          <p className="text-white/60">
            Secure access to the digital law enforcement platform for citizens.
          </p>
        </div>
      </div>

      {/* Right panel */}
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
              Citizen Login
            </h1>
            <p className="text-muted-foreground">
              Sign in to your citizen account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting}
                />
                {/* <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button> */}
              </div>
            </div>

            {/* Captcha Section */}
            <div>
              <Label htmlFor="captcha">Captcha</Label>
              <div className="flex gap-2 items-center mb-2">
                <div 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-md text-center font-mono text-lg font-bold tracking-widest border border-slate-200 select-none"
                  style={{
                    letterSpacing: '0.25em',
                    backgroundImage: 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6), linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 5px 5px'
                  }}
                >
                  {generatedCaptcha}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateCaptcha}
                  title="Refresh Captcha"
                  className="shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="captcha"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter the code above"
                required
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full gradient-gold text-accent-foreground font-semibold hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}