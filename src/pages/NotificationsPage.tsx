import DashboardLayout from "@/components/DashboardLayout";
import AnimatedPage, { staggerContainer, fadeInUp } from "@/components/AnimatedPage";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, MessageSquare, BookOpen, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SkeletonLoader = () => (
  <div className="flex items-center justify-center p-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const NotificationsPage = ({ role = "student" }: { role?: string }) => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const markAsRead = async (id: string, link: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (link) {
        // Handle backend links lacking the role prefix (e.g. '/classroom/XYZ' -> '/student/classroom/XYZ')
        const formattedLink = link.startsWith('/classroom') ? `/${role}${link}` : link;
        navigate(formattedLink);
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'attendance': return CheckCircle2;
      case 'absence': return AlertTriangle;
      case 'class': return BookOpen;
      case 'assignment': return MessageSquare;
      case 'update': return Info;
      default: return Bell;
    }
  };

  const getIconColors = (type: string) => {
    switch (type) {
      case 'attendance': return "text-success bg-success/10";
      case 'absence': return "text-destructive bg-destructive/10";
      case 'class': return "text-primary bg-primary/10";
      case 'assignment': return "text-warning bg-warning/10";
      default: return "text-info bg-info/10";
    }
  };

  return (
    <DashboardLayout role={role}>
      <AnimatedPage>
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 max-w-4xl mx-auto">
          <motion.div variants={fadeInUp} className="flex items-center justify-between bg-card p-6 rounded-2xl border shadow-soft mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Notifications</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {loading ? "Loading..." : unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && !loading && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-lg">
                Mark all as read
              </Button>
            )}
          </motion.div>

          {loading ? (
            <SkeletonLoader />
          ) : notifications.length === 0 ? (
            <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-soft">
              <Bell className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h2 className="text-xl font-semibold font-display">No notifications</h2>
              <p className="text-muted-foreground mt-2 text-sm text-center max-w-md">
                You're all caught up! When there are updates about your classes, attendance, or assignments, they will appear here.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const Icon = getIcon(notif.type);
                const colors = getIconColors(notif.type);
                return (
                  <motion.div
                    key={notif._id}
                    variants={fadeInUp}
                    onClick={() => markAsRead(notif._id, notif.link)}
                    className={`flex items-start gap-4 rounded-xl border p-5 transition-all duration-200 cursor-pointer ${notif.isRead
                      ? "border-border bg-card hover:bg-secondary/30"
                      : "border-primary/30 bg-primary/5 shadow-sm hover:bg-primary/10"
                      }`}
                  >
                    <div className={`mt-0.5 rounded-lg p-2.5 flex-shrink-0 ${colors}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between">
                        <p className={`font-semibold text-base ${!notif.isRead ? "text-foreground" : "text-foreground/80"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className={`mt-1 text-sm ${!notif.isRead ? "text-foreground/90 font-medium" : "text-muted-foreground"}`}>
                        {notif.message}
                      </p>

                      {notif.link && (
                        <p className="mt-3 text-xs font-semibold text-primary uppercase tracking-wider hover:underline inline-block">
                          View details →
                        </p>
                      )}
                    </div>
                    {!notif.isRead && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatedPage>
    </DashboardLayout>
  );
};

export default NotificationsPage;
