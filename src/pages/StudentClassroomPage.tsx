import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, Calendar, CheckCircle2, Clock, AlertTriangle,
  Megaphone, BookOpen, Download, ArrowLeft, Upload, Eye,
} from "lucide-react";

const getStatusConfig = (dueDate?: string) => {
  if (!dueDate) return { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" };
  const due = new Date(dueDate).getTime();
  const now = new Date().getTime();
  if (now > due) {
    return { label: "Overdue", color: "bg-destructive/10 text-destructive border-destructive/20" };
  }
  return { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" };
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-info/10 text-info border-info/20",
};

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const SkeletonLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const StudentClassroomPage = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const [activeTab, setActiveTab] = useState("notes");
  const { user, api } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const [classRes, partRes, histRes] = await Promise.all([
          api.get('/classes/my'),
          api.get('/classes/analytics/participation'),
          api.get('/classes/me/attendance-history')
        ]);

        const currentClass = classRes.data.find((c: any) => c.code === courseCode);
        setCourse(currentClass);

        if (currentClass) {
          const myStats = partRes.data.find((p: any) => p.name === (currentClass.subjectName || currentClass.name));
          setAttendanceStats(myStats);

          const myHistory = histRes.data.filter((h: any) => h.classCode === courseCode);
          setAttendanceHistory(myHistory);
        }
      } catch (err) {
        console.error("Failed to load class details", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchClassDetails();
    }
  }, [api, courseCode, user]);

  if (loading) return <DashboardLayout role="student"><SkeletonLoader /></DashboardLayout>;
  if (!course) return (
    <DashboardLayout role="student">
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Classroom not found</p>
        <Link to="/student/courses" className="mt-4 text-primary hover:underline">Return to My Courses</Link>
      </div>
    </DashboardLayout>
  );

  const notes = course.notes || [];
  const assignments = course.assignments || [];
  const announcements = course.announcements || [];

  const overdueAssignments = assignments.filter((a: any) => {
    return a.dueDate && new Date(a.dueDate).getTime() < new Date().getTime();
  });

  return (
    <DashboardLayout role="student">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center gap-3">
            <Link to="/student/courses" className="rounded-xl bg-secondary p-2 hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">
                {course.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                Prof. {course.professorName || "Instructor"} · {courseCode}
              </p>
            </div>
          </motion.div>

          {/* Overdue Warning */}
          {overdueAssignments.length > 0 && (
            <motion.div variants={fadeInUp} className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="rounded-xl bg-destructive/15 p-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-sm">You have {overdueAssignments.length} overdue assignment{overdueAssignments.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-muted-foreground">Submit as soon as possible to avoid penalties.</p>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div variants={fadeInUp}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 rounded-xl h-11 bg-secondary/60">
                <TabsTrigger value="notes" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 hidden sm:block" /> <span className="sm:hidden">Notes</span><span className="hidden sm:inline">Notes ({notes.length})</span>
                </TabsTrigger>
                <TabsTrigger value="assignments" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <BookOpen className="h-4 w-4 hidden sm:block" /> <span className="sm:hidden">Tasks</span><span className="hidden sm:inline">Tasks ({assignments.length})</span>
                </TabsTrigger>
                <TabsTrigger value="announcements" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <Megaphone className="h-4 w-4 hidden sm:block" /> <span className="sm:hidden">Alerts</span><span className="hidden sm:inline">Alerts ({announcements.length})</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <Calendar className="h-4 w-4 hidden sm:block" /> Attendance
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-3 mt-0">
                  <motion.div key="notes" variants={tabContentVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
                    {notes.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">No notes found for this class.</div>
                    ) : notes.map((note: any, i: number) => (
                      <motion.div
                        key={i}
                        whileHover={{ x: 2 }}
                        className="rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-all"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 w-full">
                            <div className="rounded-xl bg-primary/10 p-2.5 mt-0.5">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{note.title}</h4>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] rounded-lg font-mono">LINK</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end sm:shrink-0 w-full sm:w-auto">
                            <a href={note.link} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-lg text-xs gap-1 h-8">
                                <Eye className="h-3 w-3" /> View
                              </Button>
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-3 mt-0">
                  <motion.div key="assignments" variants={tabContentVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
                    {assignments.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">No assignments posted.</div>
                    ) : assignments.map((a: any, i: number) => {
                      const status = getStatusConfig(a.dueDate);
                      const isOverdue = status.label === "Overdue";
                      return (
                        <motion.div
                          key={i}
                          whileHover={{ x: 2 }}
                          className={`rounded-2xl border bg-card p-4 shadow-card hover:shadow-elevated transition-all ${isOverdue ? "border-destructive/30" : "border-border"}`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-start gap-3 w-full">
                              <div className={`rounded-xl p-2.5 mt-0.5 ${status.color.split(" ")[0]}`}>
                                {isOverdue ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-warning" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{a.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <Badge variant="outline" className={`text-[10px] rounded-lg ${status.color}`}>
                                    {status.label}
                                  </Badge>
                                  {a.dueDate && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> Due: {new Date(a.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 w-full sm:w-auto">
                              <Button size="sm" className="w-full sm:w-auto rounded-lg text-xs gap-1 h-8" variant={isOverdue ? "destructive" : "default"}>
                                <Upload className="h-3 w-3" /> Submit
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-3 mt-0">
                  <motion.div key="announcements" variants={tabContentVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
                    {announcements.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">No announcements yet.</div>
                    ) : announcements.map((ann: any, i: number) => (
                      <motion.div
                        key={i}
                        whileHover={{ x: 2 }}
                        className="rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`rounded-xl p-2.5 mt-0.5 bg-info/10`}>
                            <Megaphone className={`h-5 w-5 text-info`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm">Update from Prof. {course.professorName}</h4>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(ann.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ann.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="space-y-3 mt-0">
                  <motion.div key="attendance" variants={tabContentVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                    {/* Stats Summary */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold mb-1">My Attendance Rate</p>
                        <p className="text-xs text-muted-foreground">
                          {attendanceStats ? `${attendanceStats.attended} classes attended out of ${attendanceStats.totalClasses}` : "No recorded sessions yet"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-xl font-bold font-display ${attendanceStats && (attendanceStats.attended / attendanceStats.totalClasses) >= 0.75 ? "text-success" : "text-destructive"}`}>
                            {attendanceStats && attendanceStats.totalClasses > 0 ? Math.round((attendanceStats.attended / attendanceStats.totalClasses) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chronological History */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mt-6">
                      <div className="bg-secondary/20 px-6 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Session History</h3>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">{attendanceHistory.length} records</Badge>
                      </div>

                      {attendanceHistory.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No historical attendance records found for this class.</div>
                      ) : (
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-secondary/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10">
                              <tr className="border-b border-border">
                                <th className="px-6 py-3.5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                                <th className="px-6 py-3.5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceHistory.map((record, i) => {
                                const isPresent = record.status === 'Present';
                                return (
                                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                                    <td className="px-6 py-3">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="font-medium">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
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
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </motion.div>
      </AnimatedPage>
    </DashboardLayout>
  );
};

export default StudentClassroomPage;
