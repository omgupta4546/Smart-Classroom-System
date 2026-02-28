import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "./AnimatedPage";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
  gradient?: string;
}

const StatsCard = ({ title, value, change, changeType = "neutral", icon: Icon, description, gradient }: StatsCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition-shadow duration-300 hover:shadow-elevated"
    >
      {/* Decorative blob */}
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors duration-500" />
      <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-accent/[0.03] group-hover:bg-accent/[0.06] transition-colors duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-display text-card-foreground leading-none">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm ${gradient || "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${gradient ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>
      {(change || description) && (
        <div className="relative mt-3 flex items-center gap-2">
          {change && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                changeType === "positive"
                  ? "text-success bg-success/10"
                  : changeType === "negative"
                  ? "text-destructive bg-destructive/10"
                  : "text-muted-foreground bg-muted"
              }`}
            >
              {change}
            </span>
          )}
          {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
