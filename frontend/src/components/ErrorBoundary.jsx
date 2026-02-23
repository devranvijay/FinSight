import React from 'react';

/**
 * ErrorBoundary — catches any unhandled render errors in the tree
 * and shows a styled fallback instead of a white crash screen.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[FinSight ErrorBoundary]', error, info);
    }

    handleReset = () => this.setState({ hasError: false, error: null });

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-base)', padding: 32,
            }}>
                <div style={{
                    maxWidth: 480, width: '100%', textAlign: 'center',
                    background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 16, padding: '40px 32px',
                    boxShadow: '0 0 40px rgba(239,68,68,0.08)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                    <h2 style={{ color: '#f87171', marginBottom: 8, fontSize: 18 }}>Something went wrong</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                        {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="btn btn-primary"
                        style={{ marginRight: 8 }}
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
