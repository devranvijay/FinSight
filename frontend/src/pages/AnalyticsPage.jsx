import { useState, useEffect } from 'react';
import { fetchTrends, fetchCategories } from '../utils/api';
import { fmt, getCatColor } from '../utils/formatters';
import { BarChart3, TrendingUp, LayoutList } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
            {payload.map(p => <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {fmt.currency(p.value)}</div>)}
        </div>
    );
};

export default function AnalyticsPage() {
    const [trends, setTrends] = useState([]);
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchTrends(), fetchCategories()])
            .then(([t, c]) => { setTrends(t.data.data || []); setCats(c.data.data || []); })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading analytics…</span></div>;

    const trendData = trends.slice(-18).map(m => ({
        ...m,
        month: m.month?.slice(2),
    }));

    return (
        <>
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title">
                    <BarChart3 size={16} strokeWidth={1.8} style={{ color: 'var(--accent-blue)' }} />
                    Income vs Expenses — Monthly Comparison
                </div>
                <div className="chart-wrapper" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} barSize={12} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => fmt.short(v)} />
                            <Tooltip content={<Tip />} />
                            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title">
                    <TrendingUp size={16} strokeWidth={1.8} style={{ color: 'var(--accent-cyan)' }} />
                    Net Cash Flow Trend
                </div>
                <div className="chart-wrapper" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => fmt.short(v)} />
                            <Tooltip content={<Tip />} />
                            <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 4" />
                            <Line type="monotone" dataKey="net" name="Net" stroke="#3b82f6" strokeWidth={2.5}
                                dot={(p) => p.value < 0
                                    ? <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill="#ef4444" />
                                    : <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill="#10b981" />
                                }
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <div className="card-title">
                    <LayoutList size={16} strokeWidth={1.8} style={{ color: 'var(--accent-purple)' }} />
                    Category-wise Expense Breakdown
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th><th>Total Spend</th><th>% of Total</th><th>Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cats.map(c => (
                                <tr key={c.category}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getCatColor(c.category) }} />
                                            <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 500 }}>{c.category}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{fmt.currency(c.amount)}</td>
                                    <td><span style={{ color: getCatColor(c.category), fontWeight: 600 }}>{c.percent}%</span></td>
                                    <td style={{ minWidth: 140 }}>
                                        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: 99, width: `${c.percent}%`, background: getCatColor(c.category), transition: 'width 1s ease' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
