import React, { useEffect, useState } from 'react';

const OverallAttendanceBar = ({ percentage, message }) => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const t = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(t);
    }, []);

    const pct = Number(percentage) || 0;

    const getColor = (p) => {
        if (p >= 75) return '#10b981';
        if (p >= 65) return '#f59e0b';
        return '#ef4444';
    };

    const getGradient = (p) => {
        if (p >= 75) return 'linear-gradient(90deg, #059669, #34d399)';
        if (p >= 65) return 'linear-gradient(90deg, #d97706, #fbbf24)';
        return 'linear-gradient(90deg, #dc2626, #f87171)';
    };

    const getStatusLabel = (p) => {
        if (p >= 75) return { label: '✓ SAFE ZONE', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399' };
        if (p >= 65) return { label: '⚠ AT RISK', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24' };
        return { label: '✕ CRITICAL', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171' };
    };

    const color = getColor(pct);
    const gradient = getGradient(pct);
    const status = getStatusLabel(pct);

    return (
        <div style={{
            padding: '28px 32px',
            marginBottom: '30px',
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: `0 20px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)`,
            borderRadius: '22px',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle background glow */}
            <div style={{
                position: 'absolute', top: 0, right: 0, width: '300px', height: '300px',
                background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
                borderRadius: '50%', transform: 'translate(30%, -30%)', pointerEvents: 'none'
            }} />

            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Attendance Score
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '3.5rem', margin: 0, fontWeight: '900', color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                            {pct}
                        </h2>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: `${color}aa` }}>%</span>
                    </div>
                </div>
                <span style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    background: status.bg,
                    color: status.color,
                    border: `1px solid ${status.border}`,
                    alignSelf: 'center'
                }}>
                    {status.label}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                {/* Track */}
                <div style={{
                    height: '20px',
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '100px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    {/* Animated fill */}
                    <div style={{
                        height: '100%',
                        width: animated ? `${Math.min(pct, 100)}%` : '0%',
                        background: gradient,
                        borderRadius: '100px',
                        transition: 'width 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: `0 0 24px ${color}60`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Shimmer effect */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                            animation: 'shimmer 2s infinite',
                        }} />
                    </div>
                </div>

                {/* 75% Marker */}
                <div style={{
                    position: 'absolute',
                    left: '75%',
                    top: '-6px',
                    bottom: '-6px',
                    width: '2px',
                    background: 'rgba(255,255,255,0.25)',
                    boxShadow: '0 0 8px rgba(255,255,255,0.2)',
                }}>
                    <div style={{
                        position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
                        fontSize: '9px', fontWeight: '800', color: 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.05em', whiteSpace: 'nowrap'
                    }}>
                        75%
                    </div>
                </div>
            </div>

            {/* Status message */}
            {message && (
                <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: pct < 75 ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <span>{pct < 75 ? '⚡' : '🎯'}</span>
                    {message}
                </p>
            )}

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
};

export default OverallAttendanceBar;
