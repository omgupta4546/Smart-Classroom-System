import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { User, Lock, Mail, Camera, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SettingsPage = ({ role }: { role: string }) => {
    const { user, api, checkAuth } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        email: user?.email || ""
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/profile', profileData);
            toast({ title: "Success", description: "Profile updated successfully." });
            await checkAuth(); // Refresh user context
        } catch (err: any) {
            toast({
                title: "Update Failed",
                description: err.response?.data?.msg || "Could not update profile",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
        }

        setPasswordLoading(true);
        try {
            await api.put('/users/password', passwordData);
            toast({ title: "Success", description: "Password changed successfully." });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            toast({
                title: "Password Change Failed",
                description: err.response?.data?.msg || "Could not change password",
                variant: "destructive"
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <DashboardLayout role={role}>
            <AnimatedPage>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-6">
                    <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold">Account Settings</h1>
                            <p className="text-muted-foreground text-sm">Manage your profile and security preferences.</p>
                        </div>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Profile Modification */}
                        <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
                            <div className="flex items-center gap-2 border-b border-border pb-4">
                                <User className="h-5 w-5 text-primary" />
                                <h3 className="font-display text-lg font-semibold">Profile Information</h3>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            required
                                            className="pl-9"
                                            value={profileData.name}
                                            onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            required
                                            type="email"
                                            className="pl-9"
                                            value={profileData.email}
                                            onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {role === 'student' && (
                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full gap-2 text-sm"
                                            onClick={() => navigate('/student/face')}
                                        >
                                            <Camera className="h-4 w-4" /> Reset Face Registration
                                        </Button>
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className="w-full mt-2 gap-2">
                                    <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Profile"}
                                </Button>
                            </form>
                        </motion.div>

                        {/* Password Modification */}
                        <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
                            <div className="flex items-center gap-2 border-b border-border pb-4">
                                <Lock className="h-5 w-5 text-primary" />
                                <h3 className="font-display text-lg font-semibold">Change Password</h3>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <Input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <Input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" disabled={passwordLoading} variant="secondary" className="w-full mt-2 gap-2">
                                    <Lock className="h-4 w-4" /> {passwordLoading ? "Updating..." : "Update Password"}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatedPage>
        </DashboardLayout>
    );
};

export default SettingsPage;
