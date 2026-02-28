import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AttendanceChart from "@/components/AttendanceChart";
import SubjectBreakdownChart from "@/components/SubjectBreakdownChart";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center p-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AnalyticsPage = ({ role = "student" }: { role?: string }) => {
  const { api } = useAuth();
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [participationStats, setParticipationStats] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [trendRes, participationRes, radarRes] = await Promise.allSettled([
          api.get('/classes/analytics/attendance'),
          api.get('/classes/analytics/participation'),
          api.get('/classes/analytics/radar')
        ]);

        if (trendRes.status === 'fulfilled') setAttendanceTrend(trendRes.value.data);
        if (participationRes.status === 'fulfilled') setParticipationStats(participationRes.value.data);

        if (radarRes.status === 'fulfilled' && radarRes.value.data.length > 0) {
          // Normalize the radar data slightly for better display
          const rawRadar = radarRes.value.data;
          const maxTarget = Math.max(...rawRadar.map((r: any) => Math.max(r.attendance, r.consistency)));

          if (maxTarget > 0) {
            const normalized = rawRadar.map((r: any) => ({
              subject: r.subject.substring(0, 10) + (r.subject.length > 10 ? '...' : ''),
              attendanceScore: Math.min(100, Math.round((r.attendance / maxTarget) * 100)),
              consistencyScore: Math.min(100, Math.round((r.consistency / maxTarget) * 100)),
            }));
            setRadarData(normalized);
          } else {
            // If there's classes but 0 attendance logged yet, default to baseline zero rendering
            const normalized = rawRadar.map((r: any) => ({
              subject: r.subject.substring(0, 10) + (r.subject.length > 10 ? '...' : ''),
              attendanceScore: 0,
              consistencyScore: 0,
            }));
            setRadarData(normalized);
          }
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [api]);

  // Map backend attendance trend format to chart format: { day: string, attendance: number }
  const formattedAttendanceTrend = attendanceTrend.map(item => {
    let dayStr = item.name || "Unknown";
    if (item.originalDate) {
      const [y, m, d] = item.originalDate.split('-');
      dayStr = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return {
      day: dayStr,
      attendance: parseFloat(item.value || item.userRate || 0)
    };
  });

  // Map backend participation format to chart format
  const colors = ["hsl(220, 72%, 50%)", "hsl(165, 70%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(200, 80%, 50%)"];
  const formattedParticipationStats = participationStats.map((item, idx) => {
    let rate = 0;
    if (item.totalClasses > 0) {
      rate = (item.attended / item.totalClasses) * 100;
    }
    return {
      name: item.name || item.subject,
      rate: parseFloat((item.userRate || rate).toString()),
      color: colors[idx % colors.length]
    };
  });

  return (
    <DashboardLayout role={role}>
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeInUp}>
            <h1 className="font-display text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Deep dive into your attendance patterns and performance.</p>
          </motion.div>

          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <AttendanceChart data={formattedAttendanceTrend.length > 0 ? formattedAttendanceTrend : undefined} />
                <SubjectBreakdownChart data={formattedParticipationStats.length > 0 ? formattedParticipationStats : undefined} />
              </div>

              <motion.div variants={staggerContainer} className="grid gap-6 lg:grid-cols-2">
                <motion.div variants={fadeInUp} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="mb-4 font-display text-base font-semibold">Multi-dimensional Engagement</h3>
                  {radarData.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                          <Radar name="Attendance" dataKey="attendanceScore" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                          <Radar name="Consistency" dataKey="consistencyScore" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.12} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                      Not enough data to generate radar chart
                    </div>
                  )}
                </motion.div>

                <motion.div variants={fadeInUp} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="mb-4 font-display text-base font-semibold">Attendance Summary</h3>
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                    {participationStats.length > 0 ? (
                      participationStats.map((item) => {
                        const rate = item.totalClasses > 0 ? (item.attended / item.totalClasses) * 100 : 0;
                        return (
                          <div key={item.name} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">Classes: {item.attended} / {item.totalClasses}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${rate}%`,
                                    background: rate >= 75 ? "hsl(var(--success))" : "hsl(var(--destructive))",
                                  }}
                                />
                              </div>
                              <span className={`text-sm font-bold min-w-[36px] text-right ${rate >= 75 ? "text-success" : "text-destructive"}`}>
                                {Math.round(rate)}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-sm text-muted-foreground">
                        No participation data found
                      </div>
                    )}
                  </div>

                  {participationStats.length > 0 && (
                    <div className="mt-6 rounded-xl bg-primary/5 border border-primary/10 p-4">
                      <p className="text-sm font-semibold">📊 Insight</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep an eye on any subject dropping below 75% to avoid penalties. Your overall engagement is calculated continuously.
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatedPage>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
