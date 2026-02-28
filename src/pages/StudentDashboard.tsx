import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AttendanceChart from "@/components/AttendanceChart";
import SubjectBreakdownChart from "@/components/SubjectBreakdownChart";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import JoinClassModal from "@/components/JoinClassModal";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, BookOpen, AlertTriangle, Target, ArrowRight, CheckCircle2, Award, Zap, FileText, FolderOpen, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const StudentDashboard = () => {
  const { user, api } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [participationStats, setParticipationStats] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ primaryStat: '0', avgAttendance: '0', trend: '0', statusMessage: '' });
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const calls = [
        api.get('/classes/my'),
        api.get('/classes/analytics/attendance'),
        api.get('/classes/analytics/participation'),
        api.get('/classes/summary')
      ];

      const results = await Promise.allSettled(calls);
      const ok = (r: any) => r.status === 'fulfilled' ? r.value.data : null;

      const myClasses = ok(results[0]);
      const trend = ok(results[1]);
      const partStats = ok(results[2]);
      const summary = ok(results[3]);

      if (myClasses) setClasses(myClasses);
      if (trend) setAttendanceTrend(trend);
      if (partStats) setParticipationStats(partStats);
      if (summary) setStats(summary);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <SkeletonLoader />;

  // Map backend attendance trend format to chart format: { day: string, attendance: number }
  const formattedAttendanceTrend = attendanceTrend.map(item => {
    const [m, d] = (item.name || "").split('/');
    const dayStr = m && d
      ? new Date(new Date().getFullYear(), parseInt(m) - 1, parseInt(d) || 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : item.name;
    return {
      day: dayStr,
      attendance: item.value || 0
    };
  });

  // Map backend participation format to chart format
  const colors = ["hsl(220, 72%, 50%)", "hsl(165, 70%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(200, 80%, 50%)"];
  const formattedParticipationStats = participationStats.map((item, idx) => ({
    name: item.name,
    rate: item.totalClasses > 0 ? Math.round((item.attended / item.totalClasses) * 100) : 0,
    color: colors[idx % colors.length]
  }));

  const isTrendPositive = parseFloat(stats.trend) >= 0;

  return (
    <DashboardLayout role="student">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {/* Welcome Banner */}
          <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl gradient-student p-5 sm:p-6 text-primary-foreground">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold">Welcome back, {user?.name.split(" ")[0]}! 👋</h1>
                <p className="text-primary-foreground/75 text-sm mt-1">{stats.statusMessage || "Here's your attendance snapshot."}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {user?.faceDataRegistered ? (
                  <div className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10 flex-1 sm:flex-none justify-center">
                    <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 text-success" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold font-display leading-none">Face ID</p>
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/60">Registered</p>
                    </div>
                  </div>
                ) : (
                  <Link to="/student/settings" className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10 hover:bg-white/20 transition-colors flex-1 sm:flex-none justify-center">
                    <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-warning" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold font-display leading-none">Setup Face ID</p>
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/60">Action Required</p>
                    </div>
                  </Link>
                )}

                <div className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10 flex-1 sm:flex-none justify-center">
                  <Target className="h-4 sm:h-5 w-4 sm:w-5" />
                  <div>
                    <p className="text-base sm:text-lg font-bold font-display leading-none">{stats.primaryStat}%</p>
                    <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/60">Overall</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {[
              { label: "Join Class", icon: LogIn, href: null, color: "bg-success/10 text-success", action: () => setJoinModalOpen(true) },
              { label: "Classroom", icon: FileText, href: classes.length > 0 ? `/student/classroom/${classes[0].code}` : "/student/courses", color: "bg-accent/10 text-accent" },
              { label: "View Schedule", icon: Calendar, href: "/student/attendance", color: "bg-primary/10 text-primary" },
              { label: "My Courses", icon: BookOpen, href: "/student/courses", color: "bg-info/10 text-info" },
              { label: "Analytics", icon: TrendingUp, href: "/student/analytics", color: "bg-warning/10 text-warning" },
            ].map((action) => (
              action.href ? (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5 whitespace-nowrap group"
                >
                  <div className={`rounded-lg p-1.5 ${action.color} transition-transform group-hover:scale-110`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ) : (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5 whitespace-nowrap group"
                >
                  <div className={`rounded-lg p-1.5 ${action.color} transition-transform group-hover:scale-110`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              )
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div variants={staggerContainer} className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Overall Attendance" value={`${stats.primaryStat}%`} change={`${isTrendPositive ? '+' : ''}${stats.trend}%`} changeType={isTrendPositive ? "positive" : "negative"} icon={TrendingUp} description="vs last week" />
            <StatsCard title="Classes Attended" value={stats.attendedClasses || "0"} change={`of ${stats.totalClasses || 0}`} icon={Calendar} />
            <StatsCard title="Enrolled Courses" value={classes.length.toString()} icon={BookOpen} />
            <StatsCard title="University Avg" value={`${stats.avgAttendance || '0'}%`} icon={Target} />
          </motion.div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <AttendanceChart data={formattedAttendanceTrend.length > 0 ? formattedAttendanceTrend : undefined} />
            <SubjectBreakdownChart data={formattedParticipationStats.length > 0 ? formattedParticipationStats : undefined} />
          </div>

          {/* My Classes + Recent Activity */}
          <motion.div variants={staggerContainer} className="grid gap-4 lg:grid-cols-3">
            {/* My Classes */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">My Classes</h3>
                <Badge variant="outline" className="text-[10px] font-mono rounded-lg">{classes.length} total</Badge>
              </div>

              {classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                  <FolderOpen className="h-10 w-10 mb-1 opacity-50" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">No classes yet</p>
                    <p className="text-xs mt-0.5">Join a class using the code from your professor.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setJoinModalOpen(true)} className="gap-2">
                    <LogIn className="h-3.5 w-3.5" /> Join a Class
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {classes.map((cls) => (
                    <Link to={`/student/classroom/${cls.code}`} key={cls._id} className="block group">
                      <div className="relative overflow-hidden rounded-xl bg-secondary/40 p-4 transition-colors hover:bg-secondary/70 border border-transparent group-hover:border-primary/20">
                        <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100" />
                        <h4 className="font-medium text-sm leading-tight mb-1 pr-6">{cls.name}</h4>
                        <p className="text-[11px] text-muted-foreground mb-3">Prof. {cls.professorName}</p>

                        <div className="flex items-center justify-between mt-auto">
                          <code className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground font-mono">
                            {cls.code}
                          </code>
                          <span className="text-[10px] font-semibold text-primary group-hover:underline">
                            Enter Room →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Achievements */}
            <motion.div variants={fadeInUp} className="lg:col-span-1 rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-semibold mb-4">Achievements</h3>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 rounded-xl p-3.5 border transition-all ${parseFloat(stats.primaryStat) >= 90 ? "bg-warning/5 border-warning/20" : "bg-muted/30 border-border opacity-60"}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${parseFloat(stats.primaryStat) >= 90 ? "bg-warning/15" : "bg-muted"}`}>
                    <Award className={`h-5 w-5 ${parseFloat(stats.primaryStat) >= 90 ? "text-warning" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${parseFloat(stats.primaryStat) >= 90 ? "" : "text-muted-foreground"}`}>Over Achiever</p>
                    <p className="text-[10px] text-muted-foreground">{parseFloat(stats.primaryStat) >= 90 ? "You have >90% attendance" : "Reach 90% attendance"}</p>
                  </div>
                  {parseFloat(stats.primaryStat) >= 90 && <CheckCircle2 className="h-4 w-4 text-warning" />}
                </div>

                <div className={`flex items-center gap-3 rounded-xl p-3.5 border transition-all ${user?.faceDataRegistered ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border opacity-60"}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${user?.faceDataRegistered ? "bg-primary/15" : "bg-muted"}`}>
                    <Zap className={`h-5 w-5 ${user?.faceDataRegistered ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${user?.faceDataRegistered ? "" : "text-muted-foreground"}`}>Tech Savvy</p>
                    <p className="text-[10px] text-muted-foreground">{user?.faceDataRegistered ? "Face ID Configured" : "Configure Face ID"}</p>
                  </div>
                  {user?.faceDataRegistered && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
              </div>

              {parseFloat(stats.primaryStat) < 75 && (
                <div className="flex items-start gap-3 mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-destructive">Warning</p>
                    <p className="text-[10px] text-destructive/80 mt-0.5">Your overall attendance is below 75%. Please attend more classes to avoid penalties.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

        </motion.div>
      </AnimatedPage>

      <JoinClassModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onSuccess={() => { setLoading(true); fetchDashboardData(); }}
      />
    </DashboardLayout>
  );
};

export default StudentDashboard;
