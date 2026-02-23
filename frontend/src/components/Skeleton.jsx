/**
 * Skeleton loading components — use these while data is being fetched
 * to prevent layout shift and give users visual feedback.
 */

const shimmer = {
    background: 'linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255,255,255,0.04) 50%, var(--bg-elevated) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.4s infinite',
    borderRadius: 6,
};

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-keyframes')) {
    const style = document.createElement('style');
    style.id = 'skeleton-keyframes';
    style.textContent = `
    @keyframes skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
    document.head.appendChild(style);
}

/** Generic shimmer block */
export function SkeletonBlock({ width = '100%', height = 16, style = {} }) {
    return <div style={{ ...shimmer, width, height, ...style }} />;
}

/** KPI stat card skeleton */
export function SkeletonKpiCard() {
    return (
        <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <SkeletonBlock width={42} height={42} style={{ borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <SkeletonBlock width="40%" height={22} style={{ marginBottom: 8 }} />
                    <SkeletonBlock width="60%" height={12} />
                </div>
            </div>
        </div>
    );
}

/** Chart area skeleton */
export function SkeletonChart({ height = 240 }) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <SkeletonBlock width="30%" height={14} style={{ marginBottom: 20 }} />
            <SkeletonBlock width="100%" height={height} style={{ borderRadius: 8 }} />
        </div>
    );
}

/** Table row skeleton */
export function SkeletonTableRows({ rows = 5, cols = 5 }) {
    return Array.from({ length: rows }, (_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            {Array.from({ length: cols }, (_, j) => (
                <td key={j} style={{ padding: '12px 16px' }}>
                    <SkeletonBlock width={j === 0 ? '70%' : j === cols - 1 ? '40%' : '55%'} height={12} />
                </td>
            ))}
        </tr>
    ));
}

/** Full‐page loading screen */
export function SkeletonPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[0, 1, 2, 3].map(i => <SkeletonKpiCard key={i} />)}
            </div>
            <SkeletonChart />
            <SkeletonChart height={180} />
        </div>
    );
}

export default SkeletonBlock;
