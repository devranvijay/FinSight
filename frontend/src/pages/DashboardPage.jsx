import { useState, useEffect } from 'react';
import { fetchOverview, fetchCashflow, fetchCategories, fetchRecommendations, downloadPDF } from '../utils/api';
import { riskColor, getCatColor, fmt as fmtUtil } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import {
    Heart, DollarSign, Flame, Clock, Zap,
    TrendingUp, Activity, Target, Lightbulb, FileText
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

function ScoreBar({ label, value, color }) {
    return (
        <div className="score-bar-wrap">
            <div className="score-bar-label">
                <span>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value?.toFixed(0)}</span>
            </div>
            <div className="score-bar-track">
                <div className="score-bar-fill" style={{
                    width: `${Math.max(2, value ?? 0)}%`,
                    background: color || 'var(--accent-blue)'
                }} />
            </div>
        </div>
    );
}

const LEVEL_CLASS = {
    Excellent: 'level-excellent', Good: 'level-good',
    Fair: 'level-fair', Poor: 'level-poor',
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
            {payload.map(p => (
                <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
                    {p.name}: {fmtUtil.currency(p.value)}
                </div>
            ))}
        </div>
    );
};

const RISK_ICON = { Low: '🟢', Medium: '🟡', High: '🔴' };

const KPI_ICONS = [Heart, DollarSign, Flame, Clock, Zap];

export default function DashboardPage() {
    const { fmt, currency } = useCurrency();
    const [overview, setOverview] = useState(null);
    const [cashflow, setCashflow] = useState([]);
    const [cats, setCats] = useState([]);
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        Promise.all([fetchOverview(), fetchCashflow(), fetchCategories(), fetchRecommendations()])
            .then(([ov, cf, ca, rc]) => {
                setOverview(ov.data);
                setCashflow(cf.data.data?.slice(-12) || []);
                setCats(ca.data.data || []);
                setRecs(rc.data.data || []);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading analytics…</span></div>;
    if (error) return <div className="loading-state" style={{ color: 'var(--accent-red)' }}>⚠ {error} — <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => window.location.reload()}>retry</span></div>;

    const health = overview?.health;
    const risk = overview?.risk;
    const m = health?.metrics || {};
    const c = health?.components || {};

    const kpis = [
        { label: 'Health Score', value: health?.score ?? '—', unit: '/ 100', color: 'var(--accent-green)', change: health?.level },
        { label: 'Monthly Income', value: fmt(m.avg_monthly_income ?? 0), color: 'var(--accent-blue)', change: `+${fmt(m.avg_monthly_net ?? 0)} net` },
        { label: 'Monthly Burn', value: fmt(m.monthly_burn_rate ?? 0), color: 'var(--accent-red)', change: `${m.expense_ratio_pct?.toFixed(0) ?? 0}% of income` },
        { label: 'Runway', value: m.runway_months?.toFixed(1) ?? '—', color: 'var(--accent-yellow)', change: m.runway_months < 6 ? 'Below 6-mo target' : 'Safe level', unit: 'mo' },
        { label: 'Risk Level', value: risk?.level ?? '—', color: riskColor(risk?.level), change: `Score: ${risk?.score}/100` },
    ];

    return (
        <>
            {/* Export button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button
                    className="btn btn-export btn-export-pdf"
                    onClick={() => { setExporting(true); downloadPDF(currency); setTimeout(() => setExporting(false), 3000); }}
                    disabled={exporting}
                >
                    <FileText size={14} />
                    {exporting ? 'Generating…' : 'PDF Report'}
                </button>
            </div>

            {/* KPI Row */}
            <div className="kpi-grid">
                {kpis.map((k, i) => {
                    const Icon = KPI_ICONS[i];
                    return (
                        <div key={k.label} className="kpi-card" style={{ '--accent-color': k.color }}>
                            <div className="kpi-label">{k.label}</div>
                            <div className="kpi-value" style={{ color: k.color }}>
                                {k.value}
                                {k.unit && <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{k.unit}</span>}
                            </div>
                            <div className="kpi-change neutral">{k.change}</div>
                            <Icon size={28} strokeWidth={1.3} style={{ position: 'absolute', top: 16, right: 16, color: k.color, opacity: 0.18 }} />
                        </div>
                    );
                })}
            </div>

            {/* Cash Flow + Health Score */}
            <div className="chart-grid">
                <div className="card">
                    <div className="card-title">
                        <TrendingUp size={16} strokeWidth={1.8} style={{ color: 'var(--accent-blue)' }} />
                        Monthly Cash Flow
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashflow}>
                                <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => v?.slice(2)} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => fmtUtil.short(v)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" name="Income" strokeWidth={2} />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" name="Expenses" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-title">
                        <Activity size={16} strokeWidth={1.8} style={{ color: 'var(--accent-green)' }} />
                        Financial Health Score
                    </div>
                    <div className="health-gauge">
                        <div className="health-score-num" style={{ color: c.cashflow_score > 60 ? 'var(--accent-green)' : c.cashflow_score > 30 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                            {health?.score ?? '—'}
                        </div>
                        <span className={`health-level ${LEVEL_CLASS[health?.level]}`}>{health?.level}</span>
                        <div style={{ width: '100%', marginTop: 8 }}>
                            <ScoreBar label="Cash Flow" value={c.cashflow_score} color="var(--accent-green)" />
                            <ScoreBar label="Runway" value={c.runway_score} color="var(--accent-blue)" />
                            <ScoreBar label="Expense Stability" value={c.expense_stability} color="var(--accent-cyan)" />
                            <ScoreBar label="Income Consistency" value={c.income_consistency} color="var(--accent-purple)" />
                            <ScoreBar label="Expense Ratio" value={c.expense_ratio_score} color="var(--accent-yellow)" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Pie + Recommendations */}
            <div className="chart-grid">
                <div className="card">
                    <div className="card-title">
                        <Target size={16} strokeWidth={1.8} style={{ color: 'var(--accent-purple)' }} />
                        Expense Categories
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', height: 260, gap: 24 }}>
                        <div style={{ flex: '0 0 220px', height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={cats.slice(0, 7)} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={3}>
                                        {cats.slice(0, 7).map(c => <Cell key={c.category} fill={getCatColor(c.category)} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => fmt(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ flex: 1 }}>
                            {cats.slice(0, 7).map(cat => (
                                <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getCatColor(cat.category) }} />
                                        <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: 12 }}>{cat.category}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{cat.percent}%</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>{fmt(cat.amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-title">
                        <Lightbulb size={16} strokeWidth={1.8} style={{ color: 'var(--accent-yellow)' }} />
                        Smart Recommendations
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {recs.slice(0, 4).map((r, i) => (
                            <div key={i} className={`alert-item ${r.urgency}`}>
                                <div className="alert-dot" />
                                <div>
                                    <div className="alert-title">{r.title}</div>
                                    <div className="alert-detail">{r.detail}</div>
                                    <div className="alert-action">{r.action}</div>
                                </div>
                            </div>
                        ))}
                        {!recs.length && <div className="empty-state"><div className="empty-icon" /><p>No recommendations — financials look healthy.</p></div>}
                    </div>
                </div>
            </div>
        </>
    );
}
