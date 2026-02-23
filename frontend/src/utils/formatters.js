export const fmt = {
    currency: (v, decimals = 0) => {
        if (v === null || v === undefined) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: decimals, maximumFractionDigits: decimals
        }).format(v);
    },
    percent: (v, d = 1) =>
        v === null || v === undefined ? '—' : `${Number(v).toFixed(d)}%`,
    number: (v) =>
        v === null || v === undefined ? '—' : new Intl.NumberFormat('en-US').format(v),
    date: (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    short: (v) => {
        if (!v && v !== 0) return '—';
        if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
        if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
        return `$${v.toFixed(0)}`;
    }
};

export const riskColor = (level) => ({
    Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Unknown: '#64748b'
})[level] || '#64748b';

export const categoryColors = {
    operations: '#3b82f6', marketing: '#8b5cf6', hr: '#06b6d4',
    finance: '#f59e0b', travel: '#10b981', technology: '#ec4899',
    payroll: '#14b8a6', revenue: '#22c55e', uncategorized: '#94a3b8',
};

export const getCatColor = (cat) => categoryColors[cat] || '#3b82f6';
