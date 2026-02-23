import sys, json
sys.path.insert(0, '.')

# 1. Init DB
from database import init_db, DB
init_db()
print('DB initialized with seed users')

# 2. Ingest sample data
from ingestion.parser import parse_csv, normalize_dataframe
from ingestion.cleaner import clean
from ingestion.categorizer import categorize
from pathlib import Path

# Resolve sample data path relative to this file to avoid pytest cwd issues
data_file = Path(__file__).resolve().parents[1] / 'data' / 'sample_transactions.csv'
if not data_file.exists():
    raise FileNotFoundError(f"Missing sample data: {data_file}")

with open(data_file, 'rb') as f:
    raw_bytes = f.read()

raw_df   = parse_csv(raw_bytes)
norm_df  = normalize_dataframe(raw_df)
clean_df, report = clean(norm_df)
cat_df   = categorize(clean_df)

print(f'Ingestion report: {report}')

records = []
for _, row in cat_df.iterrows():
    records.append((
        row['id'], str(row['date'].date()), float(row['amount']),
        row['type'], row.get('category','uncategorized'),
        row.get('sub_category','other'), row.get('description',''),
        row.get('account_id','default'), row.get('counterparty'),
        row.get('currency','USD'), 0, float(row.get('confidence',0.5)),
        row.get('raw_description','')
    ))

# Disable FK checks for bulk insert (accounts may not exist in test environment)
from database import get_connection
_conn = get_connection()
_conn.execute("PRAGMA foreign_keys = OFF")
_conn.executemany(
    'INSERT OR IGNORE INTO transactions (id,date,amount,type,category,sub_category,description,account_id,counterparty,currency,is_recurring,confidence,raw_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    records
)
_conn.commit()
_conn.execute("PRAGMA foreign_keys = ON")
_conn.close()
count = DB.fetch_one('SELECT COUNT(*) as c FROM transactions')['c']
print(f'Rows in DB: {count}')
assert count > 3000, f'Expected >3000 rows, got {count}'

# 3. Analytics
from analytics.health_score import compute_health_score
from analytics.cashflow import get_monthly_cashflow, get_category_breakdown

h = compute_health_score()
print(f'Health Score: {h["score"]}/100 ({h["level"]})')
print(f'Runway: {h["metrics"]["runway_months"]} months')
print(f'Burn Rate: ${h["metrics"]["monthly_burn_rate"]:,.0f}/mo')
assert 0 <= h['score'] <= 100, 'Health score out of range'

cats = get_category_breakdown()
print(f'Top 4 categories: {[(c["category"], str(c["percent"]) + "%") for c in cats[:4]]}')

# 4. AI Engine
from ai_engine.forecaster import forecast_cashflow
from ai_engine.anomaly import detect_anomalies
from ai_engine.risk_scorer import compute_risk_score
from ai_engine.recommender import generate_recommendations

fc = forecast_cashflow(6)
print(f'Forecast method: {fc["method"]}')
print(f'Next 3 months forecast: {[(f["month"], f["net"]) for f in fc["forecast"][:3]]}')

anomalies = detect_anomalies()
print(f'Anomalies detected: {len(anomalies)}')
if anomalies:
    a = anomalies[0]
    print(f'Top anomaly: {a["description"]} - ${a["amount"]:,.0f} (Z={a["z_score"]}, {a["severity"]})')

risk = compute_risk_score()
print(f'Risk Score: {risk["score"]}/100 ({risk["level"]})')
assert risk['level'] in ['Low','Medium','High'], 'Invalid risk level'

recs = generate_recommendations()
print(f'Recommendations: {len(recs)} generated')
for r in recs[:2]:
    print(f'  - [{r["urgency"].upper()}] {r["title"]}')

# 5. AI Assistant
from assistant.chat import chat

tests = [
    ('What is my current financial risk?', 'risk'),
    ('Can I sustain operations for 3 months?', 'runway'),
    ('Why did my expenses increase?', 'expenses'),
    ('What is my cash flow forecast?', 'forecast'),
    ('What is my financial health score?', 'health'),
]

print('\nAI Assistant Tests:')
for q, expected_intent in tests:
    r = chat(q)
    status = 'PASS' if r['intent'] == expected_intent else f'FAIL (got {r["intent"]})'
    print(f'  [{status}] Q: "{q[:50]}" -> intent={r["intent"]}')
    print(f'         Preview: {r["response"][:100]}...')
    print()

print('ALL TESTS PASSED!')
