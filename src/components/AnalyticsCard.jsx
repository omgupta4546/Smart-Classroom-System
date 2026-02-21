import { useState, useEffect } from 'react';
import {
    LineChart, Line,
    XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell,
    PieChart, Pie, Sector,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart, ReferenceLine, LabelList
} from 'recharts';

/* ─────────────────── Shared tooltip style ─────────────────── */
const TT = {
    background: 'rgba(10, 15, 30, 0.96)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.7)',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#e2e8f0',
};

/* ─────────────────── Custom dot for line chart ─────────────────── */
const CustomDot = ({ cx, cy, fill }) => (
    <circle cx={cx} cy={cy} r={5} fill={fill} stroke="rgba(10,15,30,0.9)" strokeWidth={2} />
);

/* ─────────────────── Custom active sector for pie ─────────────────── */
const ActiveSlice = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
        <g>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 14} outerRadius={outerRadius + 18}
                startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
            <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize={22} fontWeight="900">{value}%</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={10}>{payload.name}</text>
        </g>
    );
};

/* ─────────────────── Percentage label right of bar ─────────────────── */
const PctLabel = ({ x, y, width, height, index, data }) => {
    const entry = data?.[index];
    if (!entry || !entry.totalClasses) return null;
    const pct = Math.round((entry.attended / entry.totalClasses) * 100);
    const col = pct >= 75 ? '#34d399' : pct >= 65 ? '#fbbf24' : '#f87171';
    return (
        <text x={x + width + 6} y={y + height / 2} fill={col} dominantBaseline="middle"
            fontSize={10} fontWeight="800">{entry.attended}/{entry.totalClasses} ({pct}%)</text>
    );
};

/* ─────────────────── Main Component ─────────────────── */
const AnalyticsCard = ({ data, title, type = 'line', subtitle }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [activeIdx, setActiveIdx] = useState(null);
    useEffect(() => { const t = setTimeout(() => setIsMounted(true), 50); return () => clearTimeout(t); }, []);

    const defaultData = [
        { name: 'Mon', value: 72 }, { name: 'Tue', value: 85 },
        { name: 'Wed', value: 68 }, { name: 'Thu', value: 91 }, { name: 'Fri', value: 78 },
    ];
    // For horizontalBar we always use the real data (even empty array) — don't replace with time-series defaultData
    const isParticipationData = type === 'horizontalBar';
    const chartData = data && data.length > 0 ? data : (isParticipationData ? [] : defaultData);

    /* ── Chart Renderer ── */
    const renderChart = () => {
        if (!isMounted) return <div />;

        switch (type) {

            /* ── STACKED HORIZONTAL: Attended vs Missed ── */
            case 'horizontalBar': {
                // Empty state — no classes enrolled yet
                if (!chartData || chartData.length === 0) {
                    return (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '2rem' }}>📊</div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No class data yet</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Join a class and attend sessions to see your chart</p>
                        </div>
                    );
                }

                // All-zero state — classes exist but no attendance taken yet
                const allZero = chartData.every(d => (d.totalClasses || 0) === 0);
                if (allZero) {
                    return (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '2rem' }}>🕐</div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No attendance recorded yet</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>Attendance will appear once sessions are taken</p>
                        </div>
                    );
                }

                const isAbsolute = chartData[0]?.totalClasses !== undefined;
                // Dynamic bar height based on count (min 20, grows with more subjects)
                const barH = Math.max(16, Math.min(28, Math.floor(200 / chartData.length)));

                if (isAbsolute) {
                    const maxTotal = Math.max(...chartData.map(d => d.totalClasses || 0), 1);
                    const threshold75 = maxTotal * 0.75;
                    return (
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ left: 8, right: 72, top: 18, bottom: 4 }}
                        >
                            <defs>
                                <linearGradient id="hbGreen" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#059669" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                                <linearGradient id="hbRed" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#991b1b" stopOpacity={0.7} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" hide domain={[0, maxTotal]} />
                            <YAxis
                                dataKey="name" type="category"
                                stroke="rgba(255,255,255,0.45)" fontSize={11} fontWeight={600}
                                tickLine={false} axisLine={false} width={92}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.025)' }}
                                contentStyle={TT}
                                formatter={(v, n, props) => {
                                    if (n === 'attended') {
                                        const total = props.payload?.totalClasses || 0;
                                        const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                                        return [`${v} / ${total} classes (${pct}%)`, '✅ Attended'];
                                    }
                                    return [v, '❌ Missed'];
                                }}
                            />
                            <Legend
                                iconType="circle" iconSize={8}
                                formatter={v => <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                                    {v === 'attended' ? 'Attended' : 'Missed'}</span>}
                            />
                            {/* 75% threshold line */}
                            <ReferenceLine
                                x={threshold75}
                                stroke="rgba(239,68,68,0.75)"
                                strokeDasharray="5 3"
                                strokeWidth={2}
                                label={{
                                    value: '75%',
                                    position: 'insideTopRight',
                                    fill: 'rgba(239,68,68,0.9)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    dy: -6
                                }}
                            />
                            <Bar dataKey="attended" stackId="s" name="attended"
                                fill="url(#hbGreen)" barSize={barH} radius={[4, 0, 0, 4]}>
                                <LabelList content={(p) => <PctLabel {...p} index={p.index} data={chartData} />} />
                            </Bar>
                            <Bar dataKey="missed" stackId="s" name="missed"
                                fill="url(#hbRed)" barSize={barH} radius={[0, 6, 6, 0]} />
                        </BarChart>
                    );
                }

                // Percentage fallback
                return (
                    <BarChart layout="vertical" data={chartData} margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category"
                            stroke="rgba(255,255,255,0.45)" fontSize={11} fontWeight={600}
                            tickLine={false} axisLine={false} width={88} />
                        <Tooltip contentStyle={TT} formatter={v => [`${v}%`, 'Attendance']} />
                        <ReferenceLine x={75} stroke="rgba(239,68,68,0.55)" strokeDasharray="5 3" strokeWidth={2}
                            label={{ value: '75%', position: 'insideTopRight', fill: 'rgba(239,68,68,0.75)', fontSize: 9, fontWeight: 700 }} />
                        <Bar dataKey="value" barSize={20} radius={[4, 6, 6, 4]}>
                            {chartData.map((e, i) => (
                                <Cell key={i} fill={e.value >= 75 ? '#10b981' : e.value >= 65 ? '#f59e0b' : '#ef4444'} />
                            ))}
                            <LabelList position="right" formatter={v => `${v}%`}
                                style={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700 }} />
                        </Bar>
                    </BarChart>
                );
            }

            /* ── COMPOSED: Smooth area+line trend ── */
            case 'composed':
                return (
                    <ComposedChart data={chartData} margin={{ top: 10, right: 14, bottom: 0, left: -4 }}>
                        <defs>
                            <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="85%" stopColor="#6366f1" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="avgArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#64748b" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10}
                            tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10}
                            tickLine={false} axisLine={false} unit="%" domain={[0, 100]} width={34} />
                        <Tooltip contentStyle={TT}
                            formatter={(v, n) => [`${v}%`, n === 'value' ? '📈 Attendance' : '〰 Univ. Avg']} />
                        {/* 75% reference */}
                        <ReferenceLine y={75} stroke="rgba(239,68,68,0.4)" strokeDasharray="6 4" strokeWidth={1.5}
                            label={{ value: '75%', position: 'right', fill: 'rgba(239,68,68,0.7)', fontSize: 9 }} />
                        {/* Avg area */}
                        {chartData[0]?.avg !== undefined && <>
                            <Area type="monotone" dataKey="avg" fill="url(#avgArea)"
                                stroke="rgba(100,116,139,0.4)" strokeWidth={1.5} strokeDasharray="5 3"
                                name="avg" dot={false} />
                        </>}
                        {/* Main trend area */}
                        <Area type="monotone" dataKey="value" fill="url(#trendArea)"
                            stroke="transparent" />
                        {/* Main trend line */}
                        <Line type="monotone" dataKey="value" name="value"
                            stroke="#818cf8" strokeWidth={3}
                            dot={<CustomDot fill="#818cf8" />}
                            activeDot={{ r: 7, fill: '#a5b4fc', strokeWidth: 0 }}
                            animationDuration={1500} />
                    </ComposedChart>
                );

            /* ── FACE DETECTION PIE ── */
            case 'faceDetection':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%" cy="44%"
                            innerRadius={58} outerRadius={82}
                            paddingAngle={4}
                            dataKey="value"
                            activeIndex={activeIdx}
                            activeShape={<ActiveSlice />}
                            onMouseEnter={(_, i) => setActiveIdx(i)}
                            onMouseLeave={() => setActiveIdx(null)}
                            animationBegin={0} animationDuration={1000}
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill}
                                    opacity={activeIdx === null || activeIdx === i ? 1 : 0.55} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={TT} formatter={v => [`${v}%`, 'Rate']} />
                        <Legend
                            verticalAlign="bottom" iconType="circle" iconSize={8}
                            formatter={v => <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{v}</span>}
                        />
                    </PieChart>
                );

            /* ── RADAR ── */
            case 'radar':
                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
                        <defs>
                            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
                            </linearGradient>
                        </defs>
                        <PolarGrid stroke="rgba(255,255,255,0.07)" />
                        <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.45)"
                            fontSize={10} fontWeight={600} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Attendance" dataKey="attendance"
                            stroke="#818cf8" fill="url(#radarFill)" fillOpacity={0.7} animationDuration={1200} />
                        <Tooltip contentStyle={TT} />
                    </RadarChart>
                );

            /* ── AREA ── */
            case 'area':
                return (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10 }}>
                        <defs>
                            <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={TT} />
                        <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3}
                            fill="url(#aG)" fillOpacity={1}
                            dot={<CustomDot fill="#06b6d4" />} />
                    </AreaChart>
                );

            /* ── BAR ── */
            case 'bar':
                return (
                    <BarChart data={chartData} margin={{ top: 10, right: 10 }}>
                        <defs>
                            <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={TT} />
                        <Bar dataKey="value" fill="url(#bG)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                );

            /* ── DEFAULT LINE ── */
            default:
                return (
                    <LineChart data={chartData} margin={{ top: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={TT} />
                        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3}
                            dot={<CustomDot fill="#6366f1" />} activeDot={{ r: 7 }} />
                    </LineChart>
                );
        }
    };

    return (
        <div style={{
            padding: '22px 24px 18px',
            background: 'rgba(10, 14, 28, 0.6)',
            border: '1px solid rgba(255,255,255,0.065)',
            borderRadius: '20px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Card header */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '4px', height: '22px', borderRadius: '4px',
                        background: 'linear-gradient(180deg, #818cf8, #c084fc)'
                    }} />
                    <h3 style={{
                        margin: 0, fontSize: '0.95rem', fontWeight: '700',
                        color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em'
                    }}>{title}</h3>
                </div>
                {subtitle && (
                    <p style={{ margin: '4px 0 0 14px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', height: '250px' }}>
                {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        {renderChart()}
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)',
                            borderTopColor: '#818cf8', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsCard;
