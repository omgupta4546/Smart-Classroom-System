import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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

    return (
        <div className="glass-panel card" style={{ padding: '20px', minHeight: '300px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>{title}</h3>
            <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'line' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-gradient-mid)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}
                                itemStyle={{ color: 'var(--accent-primary)' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={3} dot={{ fill: 'var(--accent-primary)' }} />
                        </LineChart>
                    ) : (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-gradient-mid)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="var(--accent-secondary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsCard;
