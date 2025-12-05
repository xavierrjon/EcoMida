# Script de teste para EcoMida Backend com SQLite - Windows PowerShell
# Versão com usuários únicos

$BaseUrl = "http://localhost:5000/api"

# Gerar um usuário único baseado no timestamp
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testUser = "user$timestamp"
$testEmail = "$testUser@example.com"

Write-Host "INICIANDO TESTES DO BACKEND ECO-MIDA (SQLite)" -ForegroundColor Green
Write-Host "Usuário de teste: $testUser" -ForegroundColor Cyan
Write-Host "================================================"

# Teste de Saúde
Write-Host "`n[1] Testando saúde do servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "SUCESSO: Servidor está rodando!" -ForegroundColor Green
        Write-Host "Resposta: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERRO: Servidor não está respondendo" -ForegroundColor Red
    exit 1
}

# Teste de Registro
Write-Host "`n[2] Testando registro de usuario..." -ForegroundColor Yellow
$registerBody = @{
    username = $testUser
    email = $testEmail
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "SUCESSO: Registro funcionando! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "ERRO no registro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorContent" -ForegroundColor Red
    }
}

# Teste de Login
Write-Host "`n[3] Testando login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "123456"
} | ConvertTo-Json

$Token = $null

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $content = $response.Content | ConvertFrom-Json
    $Token = $content.access_token
    
    if ($Token) {
        Write-Host "SUCESSO: Login funcionando!" -ForegroundColor Green
        Write-Host "Token recebido (primeiros 50 caracteres): $($Token.Substring(0, 50))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "ERRO no login: $($_.Exception.Message)" -ForegroundColor Red
}

# ... resto do script permanece igual (testes protegidos)