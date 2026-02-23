import axios from 'axios';

const API_BASE = 'http://localhost:8001';

const api = axios.create({ baseURL: API_BASE });

// Attach token if stored
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('finsight_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const login = (email, password) => {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  return api.post('/api/auth/login', form);
};

// Analytics
export const fetchOverview = () => api.get('/api/analytics/overview');
export const fetchCashflow = (g = 'monthly') => api.get(`/api/analytics/cashflow?granularity=${g}`);
export const fetchCategories = () => api.get('/api/analytics/categories');
export const fetchTrends = () => api.get('/api/analytics/trends');
export const fetchHealthScore = () => api.get('/api/analytics/health-score');

// AI Engine
export const fetchForecast = (p = 6) => api.get(`/api/ai/forecast?periods=${p}`);
export const fetchAnomalies = () => api.get('/api/ai/anomalies');
export const fetchRiskScore = () => api.get('/api/ai/risk-score');
export const fetchRecommendations = () => api.get('/api/ai/recommendations');

// Transactions
export const fetchTransactions = (params) => api.get('/api/transactions', { params });

// Assistant
export const sendChat = (query) => api.post('/api/assistant/chat', { query });

// Ingest
export const ingestCSV = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/ingest/csv', form);
};

// User Management (admin)
export const fetchUsers = () => api.get('/api/users');
export const updateUser = (id, data) => api.patch(`/api/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/users/${id}`);
export const resetUserPwd = (id, pwd) => api.post(`/api/users/${id}/reset-password`, { new_password: pwd });

// Currency
export const fetchCurrencyRates = () => api.get('/api/currency/rates');

// Export helpers — trigger browser download
export const downloadExcel = (currency = 'USD') => {
  const token = localStorage.getItem('finsight_token');
  const a = document.createElement('a');
  a.href = `${API_BASE}/api/export/excel?currency=${currency}`;
  // Pass auth via URL won't work — use fetch + blob instead
  fetch(`${API_BASE}/api/export/excel?currency=${currency}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `finsight_transactions_${currency}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    });
};

export const downloadPDF = (currency = 'USD') => {
  const token = localStorage.getItem('finsight_token');
  fetch(`${API_BASE}/api/export/pdf?currency=${currency}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finsight_report_${currency}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
};

export default api;
