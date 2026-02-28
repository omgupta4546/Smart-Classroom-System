import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { Building2, Users, Globe, Plus, Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center h-[80vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const SuperAdminDashboard = () => {
  const { api, user } = useAuth();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [instDialogOpen, setInstDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const [newInst, setNewInst] = useState({ name: '', code: '', address: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', institutionId: '' });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [instRes, statsRes] = await Promise.all([
        api.get('/institutions/all'),
        api.get('/admin/stats')
      ]);
      setInstitutions(instRes.data);
      setGlobalStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load super admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [api, user]);

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/institutions/create', newInst);
      toast({ title: "Success", description: "Institution Created Successfully" });
      setInstDialogOpen(false);
      setNewInst({ name: '', code: '', address: '' });
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to create institution", variant: "destructive" });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/institutions/add-admin', newAdmin);
      toast({ title: "Success", description: "College Admin Created Successfully" });
      setAdminDialogOpen(false);
      setNewAdmin({ name: '', email: '', password: '', institutionId: '' });
      fetchData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to create admin", variant: "destructive" });
    }
  };

  if (loading) return <DashboardLayout role="super_admin"><SkeletonLoader /></DashboardLayout>;

  return (
    <DashboardLayout role="super_admin">
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {/* Header Banner */}
          <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl gradient-info p-5 sm:p-6 text-primary-foreground">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/70">Super Admin</span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold">Platform Overview</h1>
                <p className="text-primary-foreground/75 text-sm mt-1">Manage all institutions and global platform metrics.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={instDialogOpen} onOpenChange={setInstDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white/20 backdrop-blur-sm border border-white/20 text-primary-foreground gap-2 rounded-xl hover:bg-white/30 transition-colors font-semibold">
                      <Plus className="h-4 w-4" /> Add Institution
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <form onSubmit={handleCreateInstitution}>
                      <DialogHeader>
                        <DialogTitle className="font-display">Create Institution</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Institution Name</Label>
                          <Input required value={newInst.name} onChange={e => setNewInst({ ...newInst, name: e.target.value })} className="rounded-xl" placeholder="e.g. Stanford University" />
                        </div>
                        <div className="space-y-2">
                          <Label>Identifier Code</Label>
                          <Input required value={newInst.code} onChange={e => setNewInst({ ...newInst, code: e.target.value })} className="rounded-xl font-mono uppercase" placeholder="e.g. STNFD" />
                        </div>
                        <div className="space-y-2">
                          <Label>Address (Optional)</Label>
                          <Input value={newInst.address} onChange={e => setNewInst({ ...newInst, address: e.target.value })} className="rounded-xl" placeholder="e.g. California, US" />
                        </div>
                        <Button type="submit" className="w-full rounded-xl">Create</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-primary-foreground gap-2 rounded-xl hover:bg-white/20 hover:text-white transition-colors font-semibold">
                      <ShieldCheck className="h-4 w-4" /> Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <form onSubmit={handleCreateAdmin}>
                      <DialogHeader>
                        <DialogTitle className="font-display">Create College Admin</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Institution</Label>
                          <Select required value={newAdmin.institutionId} onValueChange={v => setNewAdmin({ ...newAdmin, institutionId: v })}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select Institution" />
                            </SelectTrigger>
                            <SelectContent>
                              {institutions.map(inst => (
                                <SelectItem key={inst._id} value={inst._id}>{inst.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Admin Name</Label>
                          <Input required value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} className="rounded-xl" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} className="rounded-xl" placeholder="admin@university.edu" />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} className="rounded-xl" />
                        </div>
                        <Button type="submit" className="w-full rounded-xl">Create Admin</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={staggerContainer} className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatsCard title="Institutions" value={institutions.length.toString()} icon={Building2} description="onboarded" />
            <StatsCard title="Global Users" value={globalStats?.users?.total?.toString() || "0"} icon={Users} description="across all institutions" />
            <StatsCard title="System Uptime" value="99.9%" icon={Globe} description="operational" />
          </motion.div>

          {/* Institutions Table */}
          <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Registered Institutions</h3>
              <Badge variant="secondary" className="rounded-lg">{institutions.length} Total</Badge>
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground pl-2">Institution</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Code</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Added On</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted-foreground">No institutions found.</td>
                    </tr>
                  ) : institutions.map((inst) => (
                    <tr key={inst._id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-2 font-medium">{inst.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="font-mono text-[10px] rounded bg-secondary">{inst.code}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={`text-[10px] rounded-lg bg-success/10 text-success border-success/20`}
                          variant="outline"
                        >Active</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {new Date(inst.createdAt || Date.now()).toLocaleDateString()}
                      </td>
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

export default SuperAdminDashboard;
