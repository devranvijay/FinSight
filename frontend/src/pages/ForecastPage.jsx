import { useState, useEffect } from 'react';
import { fetchForecast, fetchAnomalies, fetchRiskScore } from '../utils/api';
import { fmt, riskColor } from '../utils/formatters';
import { ShieldAlert, ScanSearch, TrendingUp } from 'lucide-react';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>
                    {p.name}: {fmt.currency(p.value)}
                </div>
            ))}
        </div>
    );
};

const RISK_COLOR_MAP = { Low: 'var(--accent-green)', Medium: 'var(--accent-yellow)', High: 'var(--accent-red)' };

export default function ForecastPage() {
    const [data, setData] = useState({ historical: [], forecast: [] });
    const [anomalies, setAnomalies] = useState([]);
    const [risk, setRisk] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchForecast(6), fetchAnomalies(), fetchRiskScore()])
            .then(([fc, an, rs]) => {
                setData(fc.data);
                setAnomalies(an.data.data || []);
                setRisk(rs.data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state"><div className="spinner" /><span>Computing forecast…</span></div>;

    const chartData = [
        ...data.historical.map(h => ({ month: h.month, actual: h.net, type: 'historical' })),
        ...data.forecast.map(f => ({ month: f.month, forecast: f.net, lower: f.lower, upper: f.upper, type: 'forecast' })),
    ];

    return (
        <>
            <div className="grid-2">
                {/* Risk Score */}
                <div className="card">
                    <div className="card-title">
                        <ShieldAlert size={16} strokeWidth={1.8} style={{ color: 'var(--accent-red)' }} />
                        Financial Risk Score
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -3, color: riskColor(risk?.level) }}>
                                {risk?.score ?? '—'}
                            </div>
                            <div>
                                <span className={`risk-badge risk-${risk?.level?.toLowerCase()}`}>
                                    {risk?.level} Risk
                                </span>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                                    Runway: {risk?.runway_months} months
                                </div>
                            </div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                            {risk?.recommendation}
                        </div>
                        <div>
                            {risk?.factors?.filter(f => f.points > 0).map(f => (
                                <div key={f.factor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{f.factor}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{f.detail}</div>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                                        +{f.points} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Anomalies */}
                <div className="card">
                    <div className="card-title">
                        <ScanSearch size={16} strokeWidth={1.8} style={{ color: 'var(--accent-cyan)' }} />
                        Anomaly Detection
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: anomalies.length > 5 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                            {anomalies.length}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>anomalies detected</span>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {anomalies.slice(0, 8).map(a => (
                            <div key={a.id} className={`alert-item ${a.severity}`}>
                                <div className="alert-dot" />
                                <div style={{ flex: 1 }}>
                                    <div className="alert-title">{a.description}</div>
                                    <div className="alert-detail">{a.date} — <strong style={{ color: 'var(--accent-red)' }}>{fmt.currency(a.amount)}</strong> (avg: {fmt.currency(a.category_mean)})</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', fontWeight: 700 }}>
                                            Z={a.z_score}
                                        </span>
                                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                            {a.severity?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!anomalies.length && <div className="empty-state"><p>No anomalies detected.</p></div>}
                    </div>
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="card">
                <div className="card-title">
                    <TrendingUp size={16} strokeWidth={1.8} style={{ color: 'var(--accent-blue)' }} />
                    6-Month Cash Flow Forecast
                    <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: 4, fontWeight: 400 }}>
                        {data.note || 'Statistical projection'}
                    </span>
                </div>
                <div className="chart-wrapper" style={{ height: 340 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <defs>
                                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => v?.slice(2)} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => fmt.short(v)} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                            <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" strokeDasharray="4 4" />
                            <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#ciGrad)" name="Upper CI" legendType="none" />
                            <Area type="monotone" dataKey="lower" stroke="transparent" fill="white" name="Lower CI" legendType="none" fillOpacity={0} />
                            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} name="Actual Net" />
                            <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: '#3b82f6', r: 4 }} name="Forecast Net" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
                    {data.forecast?.map(f => (
                        <div key={f.month} style={{ flex: '0 0 auto', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.month?.slice(2)}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: f.net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {fmt.short(f.net)}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmt.short(f.lower)} – {fmt.short(f.upper)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
