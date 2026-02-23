import { createContext, useContext, useState, useEffect } from 'react';

const SUPPORTED = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar' },
    AED: { symbol: 'د.إ', name: 'UAE Dirham' },
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem('finsight_currency') || 'USD'
    );
    const [rates, setRates] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('finsight_token');
        if (!token) return;
        fetch('http://localhost:8001/api/currency/rates', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => setRates(d.rates || {}))
            .catch(() => { }); // fallback to no conversion
    }, [currency]);

    const changeCurrency = (code) => {
        setCurrency(code);
        localStorage.setItem('finsight_currency', code);
    };

    /**
     * Convert a USD amount to selected currency using live rates.
     * Falls back to 1:1 if rates not loaded yet.
     */
    const convert = (usdAmount) => {
        const rate = rates[currency]?.rate ?? 1;
        return usdAmount * rate;
    };

    const symbol = SUPPORTED[currency]?.symbol ?? '$';

    /** Format a USD amount → converted + symbol + locale string */
    const fmt = (usdAmount, opts = {}) => {
        const converted = convert(usdAmount);
        const digits = currency === 'JPY' ? 0 : (opts.digits ?? 2);
        return `${symbol}${Math.abs(converted).toLocaleString('en-US', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, symbol, rates, changeCurrency, convert, fmt, SUPPORTED }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
    return ctx;
}
