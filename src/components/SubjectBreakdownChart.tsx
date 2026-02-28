import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { fadeInUp } from "./AnimatedPage";

interface BreakdownProps {
  data?: { name: string; rate: number; color?: string }[];
}

const defaultData = [
  { name: "Math", rate: 92, color: "hsl(220, 72%, 50%)" },
  { name: "Physics", rate: 85, color: "hsl(165, 70%, 42%)" },
  { name: "Chemistry", rate: 78, color: "hsl(38, 92%, 50%)" },
  { name: "English", rate: 95, color: "hsl(280, 60%, 55%)" },
  { name: "CS", rate: 88, color: "hsl(200, 80%, 50%)" },
];

const SubjectBreakdownChart = ({ data = defaultData }: BreakdownProps) => {
  return (
    <motion.div variants={fadeInUp} className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 font-display text-base font-semibold text-card-foreground">
        Attendance by Subject
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} width={65} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 20%, 92%)",
                borderRadius: "10px",
                boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [`${value}%`, "Attendance"]}
            />
            <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color || "hsl(220, 72%, 50%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SubjectBreakdownChart;
