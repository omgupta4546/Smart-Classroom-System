import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { fadeInUp } from "./AnimatedPage";

interface AttendanceChartProps {
  title?: string;
  data?: { day: string; attendance: number }[];
}

const defaultData = [
  { day: "Mon", attendance: 85 },
  { day: "Tue", attendance: 92 },
  { day: "Wed", attendance: 78 },
  { day: "Thu", attendance: 88 },
  { day: "Fri", attendance: 95 },
  { day: "Sat", attendance: 70 },
  { day: "Sun", attendance: 0 },
];

const AttendanceChart = ({ title = "Attendance Trend (14 Days)", data = defaultData }: AttendanceChartProps) => {
  return (
    <motion.div variants={fadeInUp} className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 font-display text-base font-semibold text-card-foreground">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 72%, 50%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(220, 72%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 20%, 92%)",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [`${value}%`, "Attendance"]}
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="hsl(220, 72%, 50%)"
              strokeWidth={2.5}
              fill="url(#colorAttendance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AttendanceChart;
