import {
    LineChart, Line,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell
} from 'recharts';

const AnalyticsCard = ({ data, title, type = 'line' }) => {
    // Mock data if none provided
    const defaultData = [
        { name: 'Mon', value: 85 },
        { name: 'Tue', value: 92 },
        { name: 'Wed', value: 78 },
        { name: 'Thu', value: 95 },
        { name: 'Fri', value: 88 },
    ];

    const chartData = data || defaultData;

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ background: '#1e1b4b', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            formatter={(value) => [`${value}%`, 'Participation']}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'} />
                            ))}
                        </Bar>
                    </BarChart>
                );
            case 'area':
                return (
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip
                            contentStyle={{ background: '#1e1b4b', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                            formatter={(value) => [`${value}%`, 'Attendance']}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--accent-secondary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={4} />
                    </AreaChart>
                );
            default:
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                        <Tooltip
                            contentStyle={{ background: '#1e1b4b', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                            formatter={(value) => [`${value}%`, 'Rate']}
                        />
                        <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={4} dot={{ r: 4, fill: 'var(--accent-primary)', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
        }
    };

    return (
        <div className="glass-panel card fade-in" style={{ padding: '25px', minHeight: '350px', background: 'rgba(15, 23, 42, 0.4)' }}>
            <h3 style={{ marginBottom: '25px', fontSize: '1.1rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                {title}
            </h3>
            <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsCard;
