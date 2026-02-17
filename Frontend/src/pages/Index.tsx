import { Link } from "react-router-dom";
import { Shield, FileText, Search, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import ashokPiller from "@/assets/ashok.jpg";

const features = [
  {
    icon: FileText,
    title: "Online FIR Filing",
    desc: "Submit First Information Reports from anywhere, anytime with our secure digital platform.",
  },
  {
    icon: Search,
    title: "Real-time Tracking",
    desc: "Track your FIR status in real-time with transparent updates at every stage.",
  },
  {
    icon: Shield,
    title: "Secure & Confidential",
    desc: "End-to-end encryption ensures your sensitive information stays protected.",
  },
  {
    icon: Users,
    title: "Role-based Access",
    desc: "Dedicated dashboards for Citizens, Police Officers, and Administrators.",
  },
];

const steps = [
  { num: "01", title: "Register", desc: "Create your secure account with verified identity." },
  { num: "02", title: "File FIR", desc: "Fill in incident details, upload evidence, and submit." },
  { num: "03", title: "Track Progress", desc: "Monitor your FIR status with real-time updates." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">

    {/* Logo */}
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src={ashokPiller}
        alt="Ashok Pillar Logo"
        className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />
      <span className="text-lg font-bold text-gray-800 tracking-tight">
        FIR System
      </span>
    </Link>

    {/* Navigation Buttons */}
    <div className="flex items-center gap-4">

      {/* Login Button */}
       {/* Login Button */}
      <Link to="/login">
        <button
          className="relative text-gray-700 font-medium transition-all duration-300
          after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0
          after:bg-blue-600 after:transition-all after:duration-300
          hover:text-blue-600 hover:after:w-full"
        >
          Login
        </button>
      </Link>

      {/* Register Button */}
      <Link to="/register">
        <button
          className="relative text-gray-700 font-medium transition-all duration-300
          after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0
          after:bg-blue-600 after:transition-all after:duration-300
          hover:text-blue-600 hover:after:w-full"
        >
          Register
        </button>
      </Link>

    </div>
  </div>
</header>


      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">

        {/* Parallax Background */}
        <motion.div
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />

        <div className="absolute inset-0 bg-black/70" />

        {/* Floating Icons */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-24 left-20 opacity-20 text-white hidden lg:block"
        >
          <Shield size={60} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-32 right-20 opacity-20 text-white hidden lg:block"
        >
          <FileText size={60} />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
              <Shield className="h-4 w-4" /> Digital Law Enforcement Platform
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Online FIR Registration &{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent ">
                Management System
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              File, track, and manage First Information Reports digitally.
              Empowering citizens with transparent and accountable law enforcement services.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row justify-center">
              <Link to="/register">
                <Button size="lg"
                  className="gradient-gold font-semibold px-8 text-base hover:scale-105 active:scale-95 transition-transform">
                  File FIR Online <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link to="/login">
                <Button size="lg"
                  className="bg-blue-600 text-white border border-blue-600
                  hover:bg-amber-500 hover:border-amber-500 hover:text-black
                  transition-all duration-300 px-8 text-base">
                  Track Your FIR
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">A modern approach to law enforcement reporting</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="group relative rounded-xl border bg-card p-6 transition-all duration-300 
                hover:-translate-y-3 hover:shadow-2xl hover:border-accent/40"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-navy">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="relative py-24 gradient-navy overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-white">Simple 3-Step Process</h2>
            <p className="text-white/60">Get started in minutes</p>
          </div>

          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent hidden md:block" />

          <div className="relative mx-auto grid max-w-4xl gap-12 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-gold text-2xl font-bold">
                  {s.num}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{s.title}</h3>
                <p className="text-white/60">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={ashokPiller} alt="Ashok Logo" className="h-8 w-auto" />
            <span className="font-semibold">Online FIR System</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 FIR Registration & Management System. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
