import { Link } from "react-router-dom";
import { Shield, FileText, Search, Users, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import ashokPiller from "@/assets/ashok.jpg";

const features = [
  { icon: FileText, title: "Online FIR Filing", desc: "Submit First Information Reports from anywhere, anytime with our secure digital platform." },
  { icon: Search, title: "Real-time Tracking", desc: "Track your FIR status in real-time with transparent updates at every stage." },
  { icon: Shield, title: "Secure & Confidential", desc: "End-to-end encryption ensures your sensitive information stays protected." },
  { icon: Users, title: "Role-based Access", desc: "Dedicated dashboards for Citizens, Police Officers, and Administrators." },
];

const steps = [
  { num: "01", title: "Register", desc: "Create your secure account with verified identity." },
  { num: "02", title: "File FIR", desc: "Fill in incident details, upload evidence, and submit." },
  { num: "03", title: "Track Progress", desc: "Monitor your FIR status with real-time updates." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
  <img
    src={ashokPiller}
    alt="Ashok Pillar Logo"
    className="h-12 w-auto object-contain"
  />
  <span className="text-lg font-bold text-primary">FIR System</span>
</Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-gold text-accent-foreground font-semibold hover:opacity-90">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
              <Shield className="h-4 w-4" /> Digital Law Enforcement Platform
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Online FIR Registration &{" "}
              <span className="text-gradient-gold">Management System</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              File, track, and manage First Information Reports digitally. 
              Empowering citizens with transparent and accountable law enforcement services.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="gradient-gold text-accent-foreground font-semibold text-base px-8 hover:opacity-90">
                  File FIR Online <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
  size="lg"
  className="
    bg-blue-600 
    text-white 
    border border-blue-600
    hover:bg-amber-500 
    hover:border-amber-500
    hover:text-black
    transition-all duration-300
    text-base px-8
  "
>
  Track Your FIR
</Button>


              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground">A modern approach to law enforcement reporting</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-accent/30">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-navy">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 gradient-navy">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-white">Simple 3-Step Process</h2>
            <p className="text-white/60">Get started in minutes</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-gold text-2xl font-bold text-accent-foreground">
                  {s.num}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{s.title}</h3>
                <p className="text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Credentials
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-xl border bg-card p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-10 w-10 text-success" />
            <h3 className="mb-2 text-xl font-bold text-card-foreground">Demo Credentials</h3>
            <p className="mb-6 text-muted-foreground text-sm">Use these to explore different dashboards</p>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              {[
                { role: "Citizen", email: "citizen@demo.com" },
                { role: "Police", email: "police@demo.com" },
                { role: "Admin", email: "admin@demo.com" },
              ].map((d) => (
                <div key={d.role} className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground">{d.role}</p>
                  <p className="text-muted-foreground">{d.email}</p>
                  <p className="text-muted-foreground">Password: demo123</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      

      

      {/* Footer */}
      <footer className="gradient-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={ashokPiller} alt="Ashok Logo" className="h-8 w-auto object-contain"/>
            <span className="font-semibold text-grey">Online FIR System</span>
          </div>
          <p className="text-sm text-grey/50">© 2026 FIR Registration & Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
