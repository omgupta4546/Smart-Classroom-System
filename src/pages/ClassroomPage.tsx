import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, Plus, Upload, Calendar, CheckCircle2, Clock, AlertTriangle,
  Megaphone, BookOpen, Users, Download, Eye, MoreVertical, ArrowLeft, Camera, History
} from "lucide-react";

const getStatusConfig = (dueDate?: string) => {
  if (!dueDate) return { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" };
  const due = new Date(dueDate).getTime();
  const now = new Date().getTime();
  if (now > due) {
    return { label: "Past Due", color: "bg-destructive/10 text-destructive border-destructive/20" };
  }
  return { label: "Active", color: "bg-success/10 text-success border-success/20" };
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

const ClassroomPage = () => {
  const { classCode } = useParams<{ classCode: string }>();
  const [activeTab, setActiveTab] = useState("notes");
  const { user, api } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);

  // Form states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteLink, setNoteLink] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [announcementText, setAnnouncementText] = useState("");

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const classesRes = await api.get('/classes/my');
      const currentClass = classesRes.data.find((c: any) => c.code === classCode);
      setCourse(currentClass);

      if (currentClass) {
        const [studentsRes, historyRes] = await Promise.all([
          api.get(`/classes/${classCode}/students`),
          api.get(`/classes/${classCode}/attendance`)
        ]);
        setStudents(studentsRes.data);
        setAttendanceHistory(historyRes.data);
      }
    } catch (err) {
      console.error("Failed to load class details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadClassDetails();
    }
  }, [api, classCode, user]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${classCode}/notes`, { title: noteTitle, link: noteLink });
      setNoteDialogOpen(false);
      setNoteTitle("");
      setNoteLink("");
      loadClassDetails();
    } catch (err) {
      console.error('Error posting note:', err);
    }
  };

  const handlePostAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${classCode}/assignments`, { title: assignmentTitle, dueDate: assignmentDate });
      setAssignmentDialogOpen(false);
      setAssignmentTitle("");
      setAssignmentDate("");
      loadClassDetails();
    } catch (err) {
      console.error('Error posting assignment:', err);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${classCode}/announcements`, { text: announcementText });
      setAnnouncementDialogOpen(false);
      setAnnouncementText("");
      loadClassDetails();
    } catch (err) {
      console.error('Error posting announcement:', err);
    }
  };

  const downloadAttendanceCSV = () => {
    if (!attendanceHistory.length) return;

    // Build headers: Student | Roll No | <Date1> | <Date2> ...
    const sessionDates = attendanceHistory.map((r: any) => new Date(r.date).toLocaleDateString());
    const header = ["Student Name", "Roll No", ...sessionDates];

    // Build rows per student
    // The backend populates records.student via .populate(), so r.student can be either:
    //   - A plain ObjectId string (unpopulated)
    //   - A full object { _id, name, email } (populated)
    // We must handle both cases to get the correct ID.
    const getStudentId = (r: any): string => {
      if (!r?.student) return "";
      // If populated object: { _id: ..., name: ... }
      if (typeof r.student === "object" && r.student._id) return r.student._id.toString();
      // If plain ObjectId or string
      return r.student.toString();
    };

    const rows = students.map((s: any) => {
      const studentId = s._id.toString();
      const presence = attendanceHistory.map((session: any) => {
        const myRecord = (session.records || []).find(
          (r: any) => getStudentId(r) === studentId
        );
        return myRecord?.status === "present" ? "Present" : "Absent";
      });
      return [s.name || "Unknown", s.universityRollNo || "N/A", ...presence];
    });

    const csvContent = [header, ...rows].map(row => row.map((cell: string) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_${course?.name?.replace(/\s+/g, "_") ?? classCode}_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <DashboardLayout role="professor"><SkeletonLoader /></DashboardLayout>;
  if (!course) return (
    <DashboardLayout role="professor">
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Classroom not found</p>
        <Link to="/professor" className="mt-4 text-primary hover:underline">Return to Dashboard</Link>
      </div>
    </DashboardLayout>
  );

  const notes = course.notes || [];
  const assignments = course.assignments || [];
  const announcements = course.announcements || [];

  return (
    <DashboardLayout role="professor">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/professor" className="rounded-xl bg-secondary p-2 hover:bg-secondary/80 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-lg bg-warning/10 text-warning border-warning/20">
                    #{course.code}
                  </Badge>
                  <span className="text-muted-foreground text-xs"><Users className="h-3 w-3 inline mr-1" />{students.length} Students</span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold">{course.name}</h1>
              </div>
            </div>
            <Link to={`/professor/attendance/take/${classCode}`}>
              <Button className="rounded-xl font-semibold w-full sm:w-auto">
                <Camera className="mr-2 h-4 w-4" /> Take Attendance
              </Button>
            </Link>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeInUp}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 rounded-xl h-11 bg-secondary/60 hide-scrollbar overflow-x-auto justify-start sm:grid-cols-5">
                <TabsTrigger value="notes" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4" /> Notes
                </TabsTrigger>
                <TabsTrigger value="assignments" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <BookOpen className="h-4 w-4" /> Assign.
                </TabsTrigger>
                <TabsTrigger value="announcements" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <Megaphone className="h-4 w-4" /> Alerts
                </TabsTrigger>
                <TabsTrigger value="people" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <Users className="h-4 w-4" /> People
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm">
                  <History className="h-4 w-4" /> History
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4 mt-0">
                  <motion.div key="notes" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">{notes.length} notes shared</p>
                      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5 rounded-xl">
                            <Plus className="h-4 w-4" /> Share Note
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <form onSubmit={handlePostNote}>
                            <DialogHeader>
                              <DialogTitle className="font-display">Share a Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input required value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="e.g. Chapter 6 Notes" className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <Label>Resource Link (Drive, PDF, etc)</Label>
                                <Input required value={noteLink} onChange={e => setNoteLink(e.target.value)} placeholder="https://..." className="rounded-xl" />
                              </div>
                              <Button type="submit" className="w-full rounded-xl">
                                <Upload className="h-4 w-4 mr-2" /> Share Note
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {notes.length === 0 ? <div className="p-8 text-center bg-card rounded-2xl border border-border text-muted-foreground">No notes posted yet.</div> : null}
                      {notes.map((note: any, i: number) => (
                        <motion.div
                          key={i}
                          whileHover={{ x: 2 }}
                          className="rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl bg-primary/10 p-2.5 mt-0.5">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">{note.title}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[10px] rounded-lg font-mono">LINK</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <a href={note.link} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1">
                                  <Eye className="h-3 w-3" /> View
                                </Button>
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4 mt-0">
                  <motion.div key="assignments" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">{assignments.length} assignments</p>
                      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5 rounded-xl">
                            <Plus className="h-4 w-4" /> Create Assignment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <form onSubmit={handlePostAssignment}>
                            <DialogHeader>
                              <DialogTitle className="font-display">Create Assignment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input required value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} placeholder="e.g. Problem Set 6" className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input required type="date" value={assignmentDate} onChange={e => setAssignmentDate(e.target.value)} className="rounded-xl" />
                              </div>
                              <Button type="submit" className="w-full rounded-xl">
                                Create Assignment
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {assignments.length === 0 ? <div className="p-8 text-center bg-card rounded-2xl border border-border text-muted-foreground">No assignments posted.</div> : null}
                      {assignments.map((a: any, i: number) => {
                        const status = getStatusConfig(a.dueDate);
                        return (
                          <motion.div
                            key={i}
                            whileHover={{ x: 2 }}
                            className={`rounded-2xl border bg-card p-4 shadow-card hover:shadow-elevated transition-all ${status.label === "Past Due" ? "border-destructive/30" : "border-border"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className={`rounded-xl p-2.5 mt-0.5 ${status.color.split(" ")[0]}`}>
                                  {status.label === "Active" ? <Clock className="h-5 w-5 text-success" /> :
                                    <AlertTriangle className="h-5 w-5 text-destructive" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">{a.title}</h4>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className={`text-[10px] rounded-lg ${status.color}`}>
                                      {status.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {a.dueDate && (
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                                    <Calendar className="h-3 w-3" /> {new Date(a.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-4 mt-0">
                  <motion.div key="announcements" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">{announcements.length} announcements</p>
                      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5 rounded-xl">
                            <Plus className="h-4 w-4" /> Post Announcement
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <form onSubmit={handlePostAnnouncement}>
                            <DialogHeader>
                              <DialogTitle className="font-display">Post Announcement</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea required value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Write your announcement..." rows={4} className="rounded-xl" />
                              </div>
                              <Button type="submit" className="w-full rounded-xl">
                                <Megaphone className="h-4 w-4 mr-2" /> Post Announcement
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {announcements.length === 0 ? <div className="p-8 text-center bg-card rounded-2xl border border-border text-muted-foreground">No announcements posted.</div> : null}
                      {announcements.map((ann: any, i: number) => (
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
                                <h4 className="font-semibold text-sm">Professor {course.professorName || user?.name}</h4>
                                <Badge variant="outline" className={`text-[10px] rounded-lg shrink-0`}>
                                  INFO
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{ann.text}</p>
                              <p className="text-[10px] text-muted-foreground mt-2">{new Date(ann.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* People Tab */}
                <TabsContent value="people" className="space-y-4 mt-0">
                  <motion.div key="people" variants={tabContentVariants} initial="initial" animate="animate" exit="exit" className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-display text-lg font-semibold text-primary/80 mb-4 border-b pb-2">Professor</h3>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex flex-col items-center justify-center font-bold text-primary">
                        {(course.professorName || user?.name || "P")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{course.professorName || user?.name}</span>
                    </div>

                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                      <h3 className="font-display text-lg font-semibold text-primary/80">Students</h3>
                      <span className="text-sm font-bold">{students.length} Total</span>
                    </div>

                    <div className="space-y-0">
                      {students.map(s => (
                        <div key={s._id} className="flex items-center justify-between py-3 border-b last:border-0 border-border">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                              {s.profilePic ? <img src={s.profilePic} alt={s.name} /> : <Users className="h-4 w-4" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{s.name}</span>
                              <span className="text-xs text-muted-foreground">Roll: {s.universityRollNo || "N/A"}</span>
                            </div>
                          </div>
                          <div>
                            <Badge variant="outline" className={`text-[10px] rounded-lg ${s.isFaceRegistered ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                              {s.isFaceRegistered ? "Face Registered" : "Not Registered"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4 mt-0">
                  <motion.div key="history" variants={tabContentVariants} initial="initial" animate="animate" exit="exit" className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-display text-lg font-semibold">Attendance Logs</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl"
                        onClick={downloadAttendanceCSV}
                        disabled={attendanceHistory.length === 0}
                      >
                        <Download className="h-4 w-4" /> Download Sheet
                      </Button>
                    </div>

                    {attendanceHistory.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No attendance sessions recorded yet.</p>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                            <tr>
                              <th className="px-4 py-3 rounded-tl-lg">Date</th>
                              <th className="px-4 py-3">Session ID</th>
                              <th className="px-4 py-3">Present</th>
                              <th className="px-4 py-3 rounded-tr-lg">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceHistory.map(record => (
                              <tr key={record._id} className="border-b border-border last:border-0 hover:bg-muted/10">
                                <td className="px-4 py-3 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-muted-foreground">{record._id.substring(record._id.length - 6).toUpperCase()}</td>
                                <td className="px-4 py-3">
                                  <Badge className="bg-success text-success-foreground hover:bg-success">
                                    {record.records.filter((r: any) => r.status === 'present').length} Present
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Button variant="ghost" size="sm" className="h-7 text-[10px]">Details</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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

export default ClassroomPage;
