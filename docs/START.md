# FinSight AI – Start Scripts

## Start Backend
```powershell
cd backend
py -m uvicorn main:app --reload --port 8000
```
API: http://localhost:8000
Docs: http://localhost:8000/api/docs

## Start Frontend  
```powershell
cd frontend
npm run dev
```
App: http://localhost:5173

## Ingest Sample Data (PowerShell)
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body "username=admin@finsight.ai&password=Admin@123" -ContentType "application/x-www-form-urlencoded").access_token

$form = [System.Net.Http.MultipartFormDataContent]::new()
$fileBytes = [System.IO.File]::ReadAllBytes("$PWD\data\sample_transactions.csv")
$fileContent = [System.Net.Http.ByteArrayContent]::new($fileBytes)
$form.Add($fileContent, "file", "sample_transactions.csv")

$client = [System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $token)
$response = $client.PostAsync("http://localhost:8000/api/ingest/csv", $form).Result
$response.Content.ReadAsStringAsync().Result
```
