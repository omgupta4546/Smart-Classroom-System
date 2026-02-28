import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AttendanceChart from "@/components/AttendanceChart";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Users, BookOpen, UserPlus, ShieldCheck, Activity, CheckCircle2, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AddUserDialog = ({ children, onAdded }: { children: React.ReactNode, onAdded: () => void }) => {
  const { api } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "student", key: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast({ title: "User Created", description: `${formData.name} has been added as a ${formData.role}.` });
      setOpen(false);
      onAdded();
      setFormData({ name: "", email: "", password: "", role: "student", key: "" });
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.response?.data?.msg || "Could not create user", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new student or professor account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@university.edu" />
          </div>
          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <Input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.role === 'professor' && (
            <div className="space-y-2">
              <Label>Professor Entry Key</Label>
              <Input required type="password" value={formData.key} onChange={e => setFormData({ ...formData, key: e.target.value })} placeholder="Required admin key" />
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AdminDashboard = () => {
  const { api, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, classesRes, attendanceRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/classes'),
        api.get('/admin/analytics/attendance')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setClasses(classesRes.data);
      setAttendanceAnalytics(attendanceRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAdminData();
  }, [api, user]);

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/user/${id}`);
      setUsers(users.filter(u => u._id !== id));
      setStats((prev: any) => ({
        ...prev,
        users: { ...prev.users, total: prev.users.total - 1 }
      }));
      toast({ title: "User Deleted", description: `${name} has been removed from the system.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  if (loading) return <DashboardLayout role="admin"><SkeletonLoader /></DashboardLayout>;

  return (
    <DashboardLayout role="admin">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {/* Header Banner */}
          <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl gradient-admin p-5 sm:p-6 text-warning-foreground">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/75 text-sm mt-1">Manage users, classes, and platform settings.</p>
              </div>
              <div className="flex gap-2">
                <AddUserDialog onAdded={fetchAdminData}>
                  <Button className="bg-white/20 backdrop-blur-sm border border-white/20 text-white gap-2 rounded-xl hover:bg-white/30 transition-colors font-semibold">
                    <UserPlus className="h-4 w-4" /> Add User
                  </Button>
                </AddUserDialog>
              </div>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-success" />
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Health</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl p-3 border bg-success/5 border-success/15">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-xs font-medium">Platform</p>
                  <p className="text-[10px] text-muted-foreground">99.9% uptime</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl p-3 border bg-success/5 border-success/15">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-xs font-medium">Database</p>
                  <p className="text-[10px] text-muted-foreground">Operational</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={staggerContainer} className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatsCard title="Total Users" value={stats?.users?.total?.toString() || "0"} icon={Users} description="across platform" />
            <StatsCard title="Active Classes" value={stats?.classes?.toString() || "0"} icon={BookOpen} description="currently running" />
            <StatsCard title="Attendance Logs" value={stats?.attendanceLogs?.toString() || "0"} icon={ShieldCheck} description="recorded sessions" />
          </motion.div>

          {/* Charts */}
          <div className="grid gap-4">
            <AttendanceChart
              title="Global Attendance Trends"
              data={attendanceAnalytics.length > 0 ? attendanceAnalytics.map((d: any) => ({ day: d.name, attendance: d.value })) : undefined}
            />
          </div>

          {/* User Table */}
          <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card py-5 px-5 shadow-card overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base font-semibold">User Management</h3>
              </div>
              <Badge variant="secondary" className="rounded-lg">{users.length} Total</Badge>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground pl-2">User</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Verification</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Joined</th>
                    <th className="pb-3 pr-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 15).map((u) => (
                    <tr key={u._id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`text-[10px] rounded-md ${u.role === 'admin' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          u.role === 'professor' ? 'bg-warning/10 text-warning border-warning/20' :
                            'bg-primary/10 text-primary border-primary/20'
                          }`}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {u.isFaceRegistered ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-success font-medium">
                            <Shield className="h-3 w-3" /> Verified
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">Unverified</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {u.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(u._id, u.name)}
                            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 rounded-lg"
                          >
                            <Trash2 className="h-3 w-3" /> <span className="sr-only sm:not-sr-only text-[10px]">Remove</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length > 15 && (
                <div className="py-3 text-center text-xs text-muted-foreground border-t border-border">
                  Showing 15 of {users.length} users. Use global search for more.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card py-5 px-5 shadow-card overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base font-semibold">Class Monitoring</h3>
              </div>
              <Badge variant="secondary" className="rounded-lg">{classes.length} Active</Badge>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground pl-2">Class</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Code</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Professor</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Enrollment</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.slice(0, 10).map((c) => (
                    <tr key={c._id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-2 font-medium">{c.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="font-mono text-[10px] rounded bg-secondary">{c.code}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm">{c.professor?.name || "Unknown"}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{c.students?.length || 0} Students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </AnimatedPage>
    </DashboardLayout>
  );
};

export default AdminDashboard;
