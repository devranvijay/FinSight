import csv, random, uuid
from datetime import date, timedelta

random.seed(42)

transactions_spec = [
    ('operations', 'rent', 'Office Rent', -5500, -5500),
    ('operations', 'utilities', 'Electricity Bill', -180, -280),
    ('operations', 'utilities', 'Internet Broadband', -120, -120),
    ('operations', 'software', 'AWS Cloud Services', -800, -2200),
    ('operations', 'software', 'GitHub Enterprise License', -400, -400),
    ('operations', 'software', 'Slack Subscription', -150, -300),
    ('operations', 'software', 'Figma License', -75, -150),
    ('operations', 'software', 'Notion Team Plan', -80, -80),
    ('marketing', 'advertising', 'Google Ads Campaign', -1200, -4000),
    ('marketing', 'advertising', 'Facebook Ads', -800, -2500),
    ('marketing', 'events', 'Tech Conference Sponsorship', -2000, -5000),
    ('marketing', 'pr', 'PR Agency Retainer', -1500, -1500),
    ('hr', 'training', 'Team Training Workshop', -500, -1500),
    ('hr', 'benefits', 'Health Insurance Premium', -2200, -2800),
    ('hr', 'recruitment', 'LinkedIn Recruiter License', -1200, -1200),
    ('hr', 'benefits', 'Employee Provident Fund', -3000, -4500),
    ('finance', 'banking', 'Bank Processing Fee', -50, -150),
    ('finance', 'banking', 'Wire Transfer Fee', -30, -80),
    ('finance', 'taxes', 'Advance Tax Payment', -3000, -8000),
    ('finance', 'insurance', 'General Insurance Premium', -800, -1200),
    ('travel', 'flights', 'Business Travel Flights Indigo', -600, -2500),
    ('travel', 'lodging', 'Hotel Accommodation', -400, -1200),
    ('travel', 'meals', 'Client Dinner Restaurant', -150, -600),
    ('travel', 'transport', 'Uber Business Travel', -50, -200),
    ('technology', 'hardware', 'Laptop Purchase', -800, -3500),
    ('technology', 'development', 'API Development Hosting', -200, -600),
    ('payroll', 'salary', 'Monthly Salary Payroll', 45000, 75000),
    ('payroll', 'bonus', 'Quarterly Bonus', 5000, 15000),
    ('revenue', 'sales', 'Client Payment Invoice', 8000, 40000),
    ('revenue', 'sales', 'SaaS Subscription Revenue', 5000, 20000),
    ('revenue', 'investment', 'Dividend Income', 500, 3000),
    ('revenue', 'grants', 'Startup Grant Funding', 10000, 50000),
]

start_date = date(2024, 1, 1)
end_date   = date(2025, 12, 31)
rows = []

d = start_date
while d <= end_date:
    n_txns = random.randint(5, 12)
    for _ in range(n_txns):
        spec = random.choice(transactions_spec)
        lo, hi = sorted([abs(spec[3]), abs(spec[4])])
        amount = round(random.uniform(lo, hi), 2)
        if spec[3] < 0:
            amount = -amount
        type_ = 'income' if amount > 0 else 'expense'
        # Inject anomalies (~1.5%)
        if random.random() < 0.015:
            factor = random.uniform(5, 12)
            amount = amount * factor
        rows.append({
            'date': d.strftime('%Y-%m-%d'),
            'description': spec[2],
            'amount': round(amount, 2),
            'type': type_,
            'category': spec[0],
            'account_id': random.choice(['ACC001', 'ACC002']),
            'currency': 'USD',
            'counterparty': random.choice(['Vendor Corp', 'TechSupply Ltd', 'Client Alpha', 'Client Beta', 'Metro Bank']),
        })
    d += timedelta(days=random.randint(1, 3))

with open('data/sample_transactions.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['date','description','amount','type','category','account_id','currency','counterparty'])
    writer.writeheader()
    writer.writerows(rows)

print(f'Generated {len(rows)} transactions from {start_date} to {end_date}')
