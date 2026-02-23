import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-base)', padding: 32,
        }}>
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                {/* Glitch number */}
                <div style={{
                    fontSize: 96, fontWeight: 900, lineHeight: 1,
                    background: 'linear-gradient(135deg, var(--accent-blue), #06b6d4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 16, userSelect: 'none',
                }}>
                    404
                </div>

                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                    Page Not Found
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
                    The route you're looking for doesn't exist or you don't have permission to access it.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <ArrowLeft size={14} /> Go Back
                    </button>
                    <button
                        onClick={() => navigate('/', { replace: true })}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Home size={14} /> Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
