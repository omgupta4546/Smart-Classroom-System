import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import JoinClassModal from "@/components/JoinClassModal";
import { motion } from "framer-motion";
import { BookOpen, Users, ArrowRight, FolderOpen, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const CoursesPage = () => {
  const { api } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [participation, setParticipation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const fetchCoursesData = useCallback(async () => {
    try {
      const [myClassesRes, participationRes] = await Promise.all([
        api.get('/classes/my'),
        api.get('/classes/analytics/participation')
      ]);
      setCourses(myClassesRes.data);
      setParticipation(participationRes.data);
    } catch (err) {
      console.error("Failed to fetch courses data:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCoursesData();
  }, [fetchCoursesData]);

  if (loading) return <SkeletonLoader />;

  return (
    <DashboardLayout role="student">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeInUp}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">My Courses</h1>
                <p className="text-muted-foreground text-sm mt-1">You are enrolled in {courses.length} course{courses.length !== 1 ? 's' : ''} this semester.</p>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={() => setJoinModalOpen(true)} className="gap-2 shrink-0">
                  <LogIn className="h-4 w-4" />
                  Join Class
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {courses.length === 0 ? (
            <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border border-dashed shadow-soft gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-primary/60" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold font-display">No courses enrolled</h2>
                <p className="text-muted-foreground mt-2 text-sm max-w-md">
                  You haven't joined any classes yet. Ask your professor for a class code and tap the button below.
                </p>
              </div>
              <Button onClick={() => setJoinModalOpen(true)} className="gap-2">
                <LogIn className="h-4 w-4" /> Join a Class
              </Button>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const partData = participation.find(p => p.name === (course.subjectName || course.name));
                let attendanceRate = 0;
                if (partData && partData.totalClasses > 0) {
                  attendanceRate = Math.round((partData.attended / partData.totalClasses) * 100);
                }

                return (
                  <Link key={course.code} to={`/student/classroom/${course.code}`}>
                    <motion.div
                      variants={fadeInUp}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-4 transition-shadow hover:shadow-glow cursor-pointer group h-full flex flex-col"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2 text-xs font-mono">{course.code}</Badge>
                          <h3 className="font-display font-semibold line-clamp-2">{course.name}</h3>
                          <p className="text-sm text-muted-foreground">Prof. {course.professorName || "Assigned"}</p>
                        </div>
                        <div className="rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <div className="space-y-2 text-xs">
                          {course.students && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span>{course.students.length} students enrolled</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-auto">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-muted-foreground">My Attendance</span>
                          <span className={`font-bold ${attendanceRate >= (course.minAttendance || 75) ? "text-success" : "text-destructive"}`}>
                            {attendanceRate}%
                          </span>
                        </div>
                        <Progress value={attendanceRate} className="h-1.5" />
                        <p className="text-[10px] text-right text-muted-foreground pt-1">
                          {partData ? `${partData.attended} / ${partData.totalClasses} classes attended` : "No sessions yet"}
                        </p>
                      </div>

                      <div className="flex items-center justify-end text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity gap-1 pt-2">
                        Open Classroom <ArrowRight className="h-3 w-3" />
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </AnimatedPage>

      <JoinClassModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onSuccess={() => { setLoading(true); fetchCoursesData(); }}
      />
    </DashboardLayout>
  );
};

export default CoursesPage;
