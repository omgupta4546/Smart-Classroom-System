import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, PieChart, Calendar, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center p-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const StudentAttendancePage = () => {
  const { api } = useAuth();
  const [participationStats, setParticipationStats] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const [partRes, histRes] = await Promise.all([
          api.get('/classes/analytics/participation'),
          api.get('/classes/me/attendance-history')
        ]);
        setParticipationStats(partRes.data);
        setHistory(histRes.data);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [api]);

  return (
    <DashboardLayout role="student">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeInUp}>
            <h1 className="font-display text-2xl font-bold">My Attendance</h1>
            <p className="text-muted-foreground text-sm mt-1">Overview of your participation across all enrolled courses.</p>
          </motion.div>

          {loading ? (
            <SkeletonLoader />
          ) : participationStats.length === 0 ? (
            <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-soft">
              <PieChart className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h2 className="text-xl font-semibold font-display">No attendance data</h2>
              <p className="text-muted-foreground mt-2 text-sm text-center max-w-md">
                You haven't attended any classes yet or aren't enrolled in any active courses.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Aggregate Stats Table */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="bg-secondary/20 px-6 py-4 border-b border-border flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Overall Course Standing</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/10">
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Subject</th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Classes Attended</th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Total Sessions</th>
                        <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-6 py-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participationStats.map((record, i) => {
                        const rate = record.totalClasses > 0 ? Math.round((record.attended / record.totalClasses) * 100) : 0;
                        const isSafe = rate >= 75;

                        return (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="px-6 py-4 font-medium">{record.name}</td>
                            <td className="px-6 py-4 text-muted-foreground text-sm">
                              <span className="font-mono bg-secondary/50 px-2 py-0.5 rounded text-foreground">{record.attended}</span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-sm">
                              <span className="font-mono bg-secondary/50 px-2 py-0.5 rounded">{record.totalClasses}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {rate === 0 && record.totalClasses === 0 ? (
                                  <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20">
                                    No Classes
                                  </Badge>
                                ) : isSafe ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                      Safe Standing
                                    </Badge>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                      At Risk
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right w-48">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className={`font-bold ${isSafe || (rate === 0 && record.totalClasses === 0) ? (rate > 0 ? "text-success" : "text-foreground") : "text-destructive"}`}>
                                  {rate}%
                                </span>
                                <Progress
                                  value={rate}
                                  className="h-1.5 w-24"
                                  indicatorClassName={isSafe ? "bg-success" : "bg-destructive"}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Detailed Chronological History */}
              <motion.div variants={fadeInUp} className="rounded-xl border border-border bg-card shadow-soft overflow-hidden mt-6">
                <div className="bg-secondary/20 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Recent Session History</h3>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">{history.length} records</Badge>
                </div>

                {history.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No historical attendance records found.</div>
                ) : (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-secondary/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10">
                        <tr className="border-b border-border">
                          <th className="px-6 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                          <th className="px-6 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Classroom</th>
                          <th className="px-6 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Course Code</th>
                          <th className="px-6 py-3.5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((record, i) => {
                          const isPresent = record.status === 'Present';
                          return (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{record.className}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-muted-foreground">
                                <code className="text-[11px] bg-secondary/50 px-1.5 py-0.5 rounded border border-border font-mono">{record.classCode}</code>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <Badge
                                  variant="outline"
                                  className={isPresent
                                    ? "bg-success/15 text-success border-success/30"
                                    : "bg-destructive/15 text-destructive border-destructive/30"}
                                >
                                  {isPresent ? "Present" : "Absent"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatedPage>
    </DashboardLayout>
  );
};

export default StudentAttendancePage;
