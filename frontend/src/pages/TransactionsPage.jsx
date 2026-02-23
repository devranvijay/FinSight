import { useState, useEffect, useCallback } from 'react';
import { fetchTransactions, ingestCSV, downloadExcel, downloadPDF } from '../utils/api';
import { getCatColor } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { UploadCloud, FilterX, FileSpreadsheet, FileText } from 'lucide-react';

const TYPE_COLORS = { income: 'var(--accent-green)', expense: 'var(--accent-red)', transfer: 'var(--accent-blue)' };

export default function TransactionsPage() {
    const { fmt, currency } = useCurrency();
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', category: '', date_from: '', date_to: '' });
    const [drag, setDrag] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');
    const [exporting, setExporting] = useState('');

    const PAGE_SIZE = 50;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, page_size: PAGE_SIZE, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
            const res = await fetchTransactions(params);
            setRows(res.data.data || []);
            setTotal(res.data.total || 0);
        } finally { setLoading(false); }
    }, [page, filters]);

    useEffect(() => { load(); }, [load]);

    const handleUpload = async (files) => {
        const file = files[0];
        if (!file || !file.name.match(/\.(csv)$/i)) return;
        setUploading(true);
        setUploadMsg('');
        try {
            const res = await ingestCSV(file);
            const r = res.data.report;
            setUploadMsg(`Ingested ${r.final_rows} rows (${r.dropped_duplicates} duplicates removed).`);
            setPage(1); load();
        } catch (e) {
            setUploadMsg(`Error: ${e.response?.data?.detail || e.message}`);
        } finally { setUploading(false); }
    };

    const handleExport = async (type) => {
        setExporting(type);
        try {
            if (type === 'excel') downloadExcel(currency);
            else downloadPDF(currency);
        } finally { setTimeout(() => setExporting(''), 2000); }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <>
            {/* Upload */}
            <div
                className={`upload-zone${drag ? ' drag-over' : ''}`}
                style={{ marginBottom: 24 }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleUpload(e.dataTransfer.files); }}
                onClick={() => document.getElementById('csv-input').click()}
            >
                <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }}
                    onChange={e => handleUpload(e.target.files)} />
                <div className="upload-icon">
                    <UploadCloud size={32} strokeWidth={1.3} style={{ color: drag ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                </div>
                <div className="upload-text">
                    {uploading ? 'Processing…' : <><strong>Drop a CSV</strong> or click to upload transaction data</>}
                </div>
                {uploadMsg && (
                    <div style={{ marginTop: 10, fontSize: 12, color: uploadMsg.startsWith('Error') ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {uploadMsg}
                    </div>
                )}
            </div>

            {/* Filters + Export */}
            <div className="filters-row">
                <select className="filter-select" value={filters.type}
                    onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="transfer">Transfer</option>
                </select>
                <select className="filter-select" value={filters.category}
                    onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}>
                    <option value="">All Categories</option>
                    {['operations', 'marketing', 'hr', 'finance', 'travel', 'technology', 'payroll', 'revenue', 'uncategorized'].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <input className="filter-input" type="date" value={filters.date_from}
                    onChange={e => { setFilters(f => ({ ...f, date_from: e.target.value })); setPage(1); }} />
                <input className="filter-input" type="date" value={filters.date_to}
                    onChange={e => { setFilters(f => ({ ...f, date_to: e.target.value })); setPage(1); }} />
                <button className="btn btn-ghost" onClick={() => { setFilters({ type: '', category: '', date_from: '', date_to: '' }); setPage(1); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FilterX size={14} /> Clear
                </button>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>
                    {total.toLocaleString()} transactions
                </span>

                {/* Export Buttons */}
                <button
                    className="btn btn-export"
                    onClick={() => handleExport('excel')}
                    disabled={exporting === 'excel'}
                    title="Download as Excel"
                >
                    <FileSpreadsheet size={14} />
                    {exporting === 'excel' ? 'Preparing…' : 'Excel'}
                </button>
                <button
                    className="btn btn-export btn-export-pdf"
                    onClick={() => handleExport('pdf')}
                    disabled={exporting === 'pdf'}
                    title="Download PDF report"
                >
                    <FileText size={14} />
                    {exporting === 'pdf' ? 'Preparing…' : 'PDF Report'}
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading transactions…</span></div>
            ) : (
                <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th><th>Description</th><th>Category</th>
                                    <th>Type</th><th>Amount</th><th className="hide-mobile">Account</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.date}</td>
                                        <td style={{ color: 'var(--text-primary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.description}
                                        </td>
                                        <td>
                                            <span className="cat-tag" style={{ background: `${getCatColor(r.category)}22`, color: getCatColor(r.category) }}>
                                                {r.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: TYPE_COLORS[r.type], fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                                                {r.type}
                                            </span>
                                        </td>
                                        <td className={r.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                                            {fmt(r.amount)}
                                        </td>
                                        <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.account_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                        <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        {[...Array(Math.min(7, totalPages))].map((_, i) => {
                            const p = Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
                            return p <= totalPages ? (
                                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ) : null;
                        })}
                        <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                </>
            )}
        </>
    );
}
