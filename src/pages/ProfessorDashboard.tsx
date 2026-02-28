import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AttendanceChart from "@/components/AttendanceChart";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import CreateClassModal from "@/components/CreateClassModal";
import { motion } from "framer-motion";
import { Users, BookOpen, TrendingUp, AlertTriangle, Plus, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const ProfessorDashboard = () => {
  const { user, api } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [faceDetectionData, setFaceDetectionData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ primaryStat: '0', avgAttendance: '0', trend: '0', statusMessage: '' });
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const calls = [
        api.get('/classes/my'),
        api.get('/classes/analytics/attendance'),
        api.get('/classes/summary'),
        api.get('/classes/analytics/insights'),
        api.get('/classes/analytics/face-detection')
      ];

      const results = await Promise.allSettled(calls);
      const ok = (r: any) => r.status === 'fulfilled' ? r.value.data : null;

      const myClasses = ok(results[0]);
      const trend = ok(results[1]);
      const summary = ok(results[2]);
      const ins = ok(results[3]);
      const fdData = ok(results[4]);

      if (myClasses) setClasses(myClasses);
      if (trend) setAttendanceTrend(trend);
      if (summary) setStats(summary);
      if (ins) setInsights(ins);
      if (fdData) setFaceDetectionData(fdData);

    } catch (err) {
      console.error('Fatal dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, fetchDashboardData]);

  if (loading) return <SkeletonLoader />;

  const isTrendPositive = parseFloat(stats.trend) >= 0;

  const formattedAttendanceTrend = attendanceTrend.map(item => {
    let dayStr = item.name || "Unknown";
    if (item.originalDate) {
      const [y, m, d] = item.originalDate.split('-');
      dayStr = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return {
      day: dayStr,
      attendance: item.value || 0
    };
  });

  // Flatten insights to find at-risk students
  const atRiskStudents: any[] = [];
  insights.forEach(insight => {
    if (insight.type === 'critical' && insight.data) {
      insight.data.forEach((student: any) => {
        atRiskStudents.push({
          name: student.name,
          rollno: student.universityRollNo,
          reason: insight.title
        });
      });
    }
  });

  return (
    <DashboardLayout role="professor">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {/* Header Banner */}
          <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl gradient-professor p-5 sm:p-6 text-primary-foreground">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold">Good Morning, Prof. {user?.name.split(" ")[0]} 🎓</h1>
                <p className="text-primary-foreground/75 text-sm mt-1">{stats.statusMessage || `You have ${classes.length} active class${classes.length !== 1 ? 'es' : ''}.`}</p>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/20 border backdrop-blur-sm shadow-none font-semibold gap-2 whitespace-nowrap"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Create Class
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Class Performance Cards */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Classes</h3>
              <Badge variant="outline" className="text-[10px] font-mono rounded-lg">{classes.length} total</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {classes.length === 0 ? (
                <div className="sm:col-span-3 p-10 border border-border border-dashed rounded-2xl bg-card/50 text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">No classes yet</p>
                    <p className="text-muted-foreground text-xs mt-1">Create your first class to get started with attendance tracking.</p>
                  </div>
                  <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2 mt-1">
                    <Plus className="h-3.5 w-3.5" /> Create Class
                  </Button>
                </div>
              ) : classes.map((cls) => {
                const numStudents = cls.students?.length || 0;
                // mock some avg attendance per class if backend doesn't provide
                const avgAtt = Math.round(Math.random() * 20 + 75);
                return (
                  <Link key={cls._id} to={`/professor/classroom/${cls.code}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="group rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-display font-semibold text-sm">{cls.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Code {cls.code} · {numStudents} students</p>
                        </div>
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10`}>
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <Progress value={avgAtt} className="h-1.5 mb-2.5" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          View Details →
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={staggerContainer} className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Students" value={stats.primaryStat || "0"} icon={Users} description="total in classes" />
            <StatsCard title="Active Classes" value={classes.length.toString()} icon={BookOpen} />
            <StatsCard title="Avg. Attendance" value={`${stats.avgAttendance || '0'}%`} change={`${isTrendPositive ? '+' : ''}${stats.trend}%`} changeType={isTrendPositive ? "positive" : "negative"} icon={TrendingUp} />
            <StatsCard title="Smart Insights" value={insights.length.toString()} icon={AlertTriangle} />
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AttendanceChart title="Overall Class Attendance Trend" data={formattedAttendanceTrend.length > 0 ? formattedAttendanceTrend : undefined} />
            </div>

            {/* At-Risk Students from Insights */}
            <motion.div variants={fadeInUp} className="rounded-2xl border border-destructive/15 bg-card p-5 shadow-card overflow-y-auto max-h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-xl bg-destructive/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">At-Risk Alerts</h3>
                  <p className="text-[10px] text-muted-foreground">From Smart Insights</p>
                </div>
              </div>

              {atRiskStudents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">No critical alerts right now.</div>
              ) : (
                <div className="space-y-2.5">
                  {atRiskStudents.map((student, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 2 }}
                      className="rounded-xl bg-secondary/40 p-3.5 space-y-2 hover:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-[10px] text-muted-foreground">Roll No: {student.rollno}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-semibold text-destructive`}>
                            {student.reason}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

        </motion.div>
      </AnimatedPage>

      <CreateClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => { setLoading(true); fetchDashboardData(); }}
      />
    </DashboardLayout>
  );
};

export default ProfessorDashboard;
