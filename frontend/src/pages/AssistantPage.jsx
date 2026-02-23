import { useState, useEffect, useRef } from 'react';
import { sendChat } from '../utils/api';
import { Send, Bot, User } from 'lucide-react';

const SUGGESTED = [
    "What is my current financial risk?",
    "Can I sustain operations for the next 3 months?",
    "Why did my expenses increase?",
    "What are the top recommendations?",
    "Show me anomalies in my spending",
    "What is my cash flow forecast?",
];

function renderResponse(text) {
    return text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={j} style={{ color: 'var(--accent-cyan)' }}>{part.slice(2, -2)}</strong>;
            return part;
        });
        return <div key={i}>{parts}</div>;
    });
}

export default function AssistantPage() {
    const [messages, setMessages] = useState([{
        role: 'assistant',
        text: "I'm FinSight AI Assistant — your analytics-grounded financial advisor.\n\nEvery answer is derived directly from your transaction data — no hallucinations, no guesses.\n\nAsk me anything about your risk, runway, expenses, anomalies, or forecasts.",
    }]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = async (q) => {
        const text = q || query;
        if (!text.trim() || loading) return;
        setMessages(m => [...m, { role: 'user', text }]);
        setQuery('');
        setLoading(true);
        try {
            const res = await sendChat(text);
            setMessages(m => [...m, { role: 'assistant', text: res.data.response }]);
        } catch (e) {
            setMessages(m => [...m, { role: 'assistant', text: `Error: ${e.message}` }]);
        } finally { setLoading(false); }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.role}`}>
                        <span className="chat-avatar">
                            {m.role === 'assistant'
                                ? <Bot size={14} strokeWidth={1.8} />
                                : <User size={14} strokeWidth={1.8} />
                            }
                        </span>
                        <div className="chat-text">
                            {m.role === 'user' ? m.text : renderResponse(m.text)}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="chat-bubble assistant">
                        <span className="chat-avatar"><Bot size={14} strokeWidth={1.8} /></span>
                        <div className="chat-text" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                            <span style={{ color: 'var(--text-muted)' }}>Analyzing your financial data…</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {messages.length <= 2 && (
                <div className="suggested-queries">
                    {SUGGESTED.map(s => (
                        <button key={s} className="query-chip" onClick={() => send(s)}>{s}</button>
                    ))}
                </div>
            )}

            <div className="chat-input-row">
                <input
                    className="chat-input"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask a financial question…"
                    disabled={loading}
                />
                <button
                    className="btn btn-primary"
                    onClick={() => send()}
                    disabled={loading || !query.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <Send size={14} /> Send
                </button>
            </div>
        </div>
    );
}
