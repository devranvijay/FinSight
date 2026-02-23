import { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function Header({ title, subtitle }) {
    const { currency, changeCurrency, SUPPORTED } = useCurrency();
    const [open, setOpen] = useState(false);

    return (
        <header className="header">
            <div>
                <div className="header-title">{title}</div>
                {subtitle && <div className="header-sub">{subtitle}</div>}
            </div>
            <div className="header-right">
                {/* Currency Selector */}
                <div className="currency-selector" style={{ position: 'relative' }}>
                    <button
                        className="currency-btn"
                        onClick={() => setOpen(o => !o)}
                        title="Change display currency"
                    >
                        <span>{SUPPORTED[currency]?.symbol}</span>
                        <span style={{ fontSize: 11 }}>{currency}</span>
                        <ChevronDown size={11} />
                    </button>
                    {open && (
                        <div className="currency-dropdown">
                            {Object.entries(SUPPORTED).map(([code, info]) => (
                                <button
                                    key={code}
                                    className={`currency-option${currency === code ? ' active' : ''}`}
                                    onClick={() => { changeCurrency(code); setOpen(false); }}
                                >
                                    <span style={{ fontWeight: 600, minWidth: 28 }}>{info.symbol}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{code}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{info.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="header-badge">
                    <Activity size={12} style={{ color: 'var(--accent-green)' }} />
                    Live Data
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }} className="header-date">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </div>
        </header>
    );
}
