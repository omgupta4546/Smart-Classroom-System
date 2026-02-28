import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  GraduationCap, Users, Building2, Shield, ArrowRight, Fingerprint, BarChart3, Bell,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const roles = [
  {
    role: "Student",
    path: "/student",
    icon: GraduationCap,
    desc: "View your attendance, track analytics & manage courses",
    gradient: "gradient-student",
  },
  {
    role: "Professor",
    path: "/professor",
    icon: Users,
    desc: "Take attendance, manage classes & monitor performance",
    gradient: "gradient-professor",
  },
  {
    role: "Admin",
    path: "/admin",
    icon: Building2,
    desc: "Manage departments, users & institutional analytics",
    gradient: "gradient-admin",
  },
  {
    role: "Super Admin",
    path: "/super-admin",
    icon: Shield,
    desc: "Platform-wide controls, institutions & system health",
    gradient: "gradient-info",
  },
];

const highlights = [
  { icon: Fingerprint, label: "AI Face Recognition" },
  { icon: BarChart3, label: "Real-time Analytics" },
  { icon: Bell, label: "Smart Notifications" },
  { icon: Shield, label: "Secure & Multi-tenant" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[350px] w-[350px] rounded-full bg-accent/[0.05] blur-3xl" />
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-50 glass border-b border-border/40"
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-sm">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">SmartClass</span>
          </div>
          <Link to="/login">
            <Button size="sm" variant="ghost" className="font-semibold text-sm">
              Sign In
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-lg space-y-8"
        >
          {/* Welcome */}
          <motion.div variants={item} className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Smart Classroom
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              AI-powered attendance & classroom management. Select your role to get started.
            </p>
          </motion.div>

          {/* Role cards */}
          <motion.div variants={item} className="space-y-3">
            {roles.map((r) => (
              <Link key={r.role} to={r.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-elevated hover:border-primary/20"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.gradient} shadow-sm`}>
                    <r.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-semibold">{r.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.div>
              </Link>
            ))}
          </motion.div>

          {/* Quick highlights */}
          <motion.div variants={item} className="grid grid-cols-2 gap-2">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5"
              >
                <h.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground">{h.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Sign in */}
          <motion.div variants={item} className="text-center">
            <Link to="/login">
              <Button className="gradient-primary border-0 text-primary-foreground rounded-xl h-11 w-full font-semibold shadow-lg shadow-primary/20">
                Sign In to Your Account
              </Button>
            </Link>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Powered by AI Face Recognition · Secure & Multi-tenant
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4">
        <p className="text-center text-[10px] text-muted-foreground">© 2026 SmartClass. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
