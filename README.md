<h1 align="center">
  <br/>
  FinSight AI
  <br/>
</h1>

<h4 align="center">Intelligent Financial Decision Engine · Analytics · Forecasting · Risk Scoring</h4>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/SQLite%20%7C%20PostgreSQL-dual--mode-4479A1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square&logo=docker" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

<p align="center">
  <b>FinSight AI</b> is a full-stack, AI-assisted financial intelligence platform that converts raw transactional data into predictive insights, risk scores, and actionable recommendations — designed for SMEs and FinTech operations teams.
</p>

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📊 **Dashboard** | Real-time KPI overview — health score, runway, burn rate, cash flow charts |
| 📈 **Analytics** | Income/expense trends, category breakdown, monthly comparisons |
| 🤖 **AI Forecasting** | ARIMA-based cash flow projections with confidence intervals |
| ⚠️ **Anomaly Detection** | Statistical outlier detection on transaction data |
| 🛡️ **Risk Scoring** | Composite 0–100 risk score with explainable component breakdown |
| 💡 **Smart Recommendations** | Rule-based + ML-assisted financial recommendations |
| 💬 **AI Assistant** | Conversational financial Q&A engine |
| 💱 **Multi-Currency** | 10 supported currencies (USD, EUR, GBP, INR, JPY, AUD, CAD, CHF, SGD, AED) |
| 📤 **Data Export** | Download transactions as Excel (.xlsx) or PDF summary report |
| 🔒 **Auth & RBAC** | JWT access/refresh tokens, bcrypt hashing, role-based access control |
| 📝 **Audit Logs** | Every write action logged with user, IP, timestamp |
| 📱 **Mobile Responsive** | Hamburger sidebar, responsive layouts for all screen sizes |

---

## 🏗️ Architecture

```
FinSight/
├── backend/                  # FastAPI application
│   ├── ai_engine/            # Forecaster, anomaly detection, risk scorer, recommender
│   ├── analytics/            # Cash flow, health score, category breakdown
│   ├── assistant/            # AI chat engine
│   ├── audit/                # Audit logger
│   ├── ingestion/            # CSV/Excel parser, cleaner, categorizer
│   ├── main.py               # All API routes (FastAPI app)
│   ├── database.py           # Dual-mode DB layer (SQLite + PostgreSQL)
│   ├── auth.py               # JWT auth, RBAC, password validation
│   ├── exchange_rates.py     # Multi-currency rate store + converter
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Layout (Sidebar, Header), ErrorBoundary
│   │   ├── context/          # CurrencyContext (global currency state)
│   │   ├── pages/            # Dashboard, Analytics, Forecast, Transactions, Assistant, Users
│   │   └── utils/            # api.js (axios), formatters.js
│   ├── index.html
│   └── vite.config.js
│
├── docker-compose.yml        # Full stack: Postgres + Backend + Frontend
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option A — Local Development (Recommended)

**Prerequisites:** Python 3.11+, Node.js 18+

#### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/FinSight.git
cd FinSight
```

#### 2. Backend setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
# Edit .env — set a strong SECRET_KEY

# Start the API server
python -m uvicorn main:app --reload --port 8001
```
Backend runs at → **http://localhost:8001**  
API docs → **http://localhost:8001/api/docs**

#### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at → **http://localhost:5173**

#### 4. Login
| Email | Password | Role |
|-------|----------|------|
| `admin@finsight.ai` | `Admin@123` | Admin |
| `analyst@finsight.ai` | `Analyst@123` | Analyst |
| `viewer@finsight.ai` | `Viewer@123` | Viewer |

---

### Option B — Docker Compose (Full Stack)

**Prerequisites:** Docker Desktop

```bash
git clone https://github.com/YOUR_USERNAME/FinSight.git
cd FinSight

# ⚠️ Update SECRET_KEY in docker-compose.yml before production use
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8001 |
| API Docs | http://localhost:8001/api/docs |

```bash
# Stop all services
docker compose down

# Stop and remove data volumes
docker compose down -v
```

---

## 📂 Uploading Transaction Data

FinSight accepts **CSV files** with the following columns:

```csv
date,amount,type,description,category
2024-01-15,5000.00,income,Monthly Revenue,revenue
2024-01-16,-1200.50,expense,AWS Infrastructure,technology
2024-01-17,-500.00,expense,Team Lunch,hr
```

| Column | Required | Notes |
|--------|----------|-------|
| `date` | ✅ | Any standard date format |
| `amount` | ✅ | Positive or negative; currency symbols stripped |
| `type` | ✅ | `income`, `expense`, or `transfer` |
| `description` | Optional | Free text |
| `category` | Optional | Auto-categorized if missing |

Go to **Transactions → drag & drop your CSV** to ingest.

---

## 🔌 API Reference

Full interactive docs available at `/api/docs` (Swagger UI) and `/api/redoc`.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Obtain JWT access + refresh tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/ingest/csv` | Upload and process a CSV file |
| `GET` | `/api/analytics/overview` | Health score + risk score + KPIs |
| `GET` | `/api/analytics/cashflow` | Monthly/daily cash flow data |
| `GET` | `/api/analytics/categories` | Expense category breakdown |
| `GET` | `/api/ai/forecast` | Cash flow forecast (ARIMA) |
| `GET` | `/api/ai/anomalies` | Detected transaction anomalies |
| `GET` | `/api/ai/risk-score` | Risk score with component breakdown |
| `GET` | `/api/ai/recommendations` | AI-generated financial recommendations |
| `GET` | `/api/currency/rates` | Supported currencies + exchange rates |
| `GET` | `/api/export/excel` | Download transactions as .xlsx |
| `GET` | `/api/export/pdf` | Download financial summary as PDF |
| `GET` | `/api/audit/logs` | Audit log (admin only) |
| `GET` | `/api/health` | Health check |

---

## 🛡️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and set the following:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(required)* | JWT signing key — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `DATABASE_URL` | `finsight.db` | SQLite path (dev) or PostgreSQL URL (prod) |
| `ENVIRONMENT` | `development` | `development` \| `staging` \| `production` |

> ⚠️ **Never commit `.env` to git.** The `.env.example` file is safe to commit.

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## 💱 Supported Currencies

| Code | Currency | Code | Currency |
|------|----------|------|----------|
| USD | US Dollar | JPY | Japanese Yen |
| EUR | Euro | AUD | Australian Dollar |
| GBP | British Pound | CAD | Canadian Dollar |
| INR | Indian Rupee | CHF | Swiss Franc |
| SGD | Singapore Dollar | AED | UAE Dirham |

---

## 🔧 Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python API framework
- [SQLite](https://sqlite.org/) / [PostgreSQL](https://postgresql.org/) — Dual-mode database
- [pandas](https://pandas.pydata.org/) + [NumPy](https://numpy.org/) — Data processing
- [statsmodels](https://statsmodels.org/) — ARIMA forecasting
- [scikit-learn](https://scikit-learn.org/) — ML anomaly detection
- [python-jose](https://python-jose.readthedocs.io/) — JWT
- [bcrypt](https://pypi.org/project/bcrypt/) — Password hashing
- [ReportLab](https://www.reportlab.com/) — PDF generation
- [openpyxl](https://openpyxl.readthedocs.io/) — Excel export
- [slowapi](https://slowapi.readthedocs.io/) — Rate limiting

**Frontend**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/) — Data visualization
- [Axios](https://axios-http.com/) — HTTP client
- [Lucide React](https://lucide.dev/) — Icons
- Vanilla CSS with CSS custom properties (dark mode)

**Infrastructure**
- [Docker](https://docker.com/) + Docker Compose
- [Nginx](https://nginx.org/) — Static frontend serving + API proxy

---

## 📁 Sample Data

A sample CSV is included at `data/sample_transactions.csv` for quick testing.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ by <strong>Niraj Singh</strong></p>
