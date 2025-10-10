# Script PowerShell Simplificado para criar subcontas no Asaas Sandbox
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

Write-Host "========================================"
Write-Host "Criacao de Subcontas - Asaas Sandbox"
Write-Host "========================================"
Write-Host ""

$AsaasUrl = "https://api-sandbox.asaas.com/v3"

Write-Host "Subcontas que serao criadas:"
Write-Host "1. RENUM (para receber 40% do split)"
Write-Host "2. Beatriz Carraro (afiliada de teste)"
Write-Host ""
Write-Host "Aguarde..."
Write-Host ""

# Criar Subconta RENUM
Write-Host "========================================"
Write-Host "1. Criando Subconta: RENUM"
Write-Host "========================================"

$renumBody = @{
    name = "RENUM"
    email = "renum+sandbox@comademig.org.br"
    cpfCnpj = "66625514000140"
    birthDate = "1990-01-01"
    companyType = "ASSOCIATION"
    phone = "31999990001"
    mobilePhone = "31999990001"
    address = "Rua Teste RENUM"
    addressNumber = "100"
    province = "Centro"
    postalCode = "30000000"
} | ConvertTo-Json

$headers = @{
    "access_token" = $ApiKey
    "Content-Type" = "application/json"
    "User-Agent" = "COMADEMIG-Setup"
}

try {
    $renumResponse = Invoke-RestMethod -Uri "$AsaasUrl/accounts" -Method Post -Headers $headers -Body $renumBody
    
    Write-Host "Subconta RENUM criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Dados da RENUM:"
    Write-Host "   ID: $($renumResponse.id)"
    Write-Host "   Wallet ID: $($renumResponse.walletId)"
    Write-Host "   API Key: $($renumResponse.apiKey)"
    Write-Host ""
    
    $envContent = "# Subconta RENUM - Sandbox`n"
    $envContent += "RENUM_ID=$($renumResponse.id)`n"
    $envContent += "RENUM_WALLET_ID=$($renumResponse.walletId)`n"
    $envContent += "RENUM_API_KEY=$($renumResponse.apiKey)`n"
    $envContent += "`n"
    
    $envContent | Out-File -FilePath ".env.subcontas-sandbox" -Encoding UTF8
    
    $renumWalletId = $renumResponse.walletId
    
} catch {
    Write-Host "Erro ao criar subconta RENUM:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
}

Start-Sleep -Seconds 2

# Criar Subconta Beatriz Carraro
Write-Host "========================================"
Write-Host "2. Criando Subconta: Beatriz Carraro"
Write-Host "========================================"

$beatrizBody = @{
    name = "Beatriz Carraro"
    email = "beatriz.carraro+sandbox@comademig.org.br"
    cpfCnpj = "24971563792"
    birthDate = "1995-05-15"
    companyType = "INDIVIDUAL"
    phone = "31999990002"
    mobilePhone = "31999990002"
    address = "Rua Teste Afiliado"
    addressNumber = "200"
    province = "Centro"
    postalCode = "30000000"
} | ConvertTo-Json

try {
    $beatrizResponse = Invoke-RestMethod -Uri "$AsaasUrl/accounts" -Method Post -Headers $headers -Body $beatrizBody
    
    Write-Host "Subconta Beatriz Carraro criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Dados da Beatriz Carraro:"
    Write-Host "   ID: $($beatrizResponse.id)"
    Write-Host "   Wallet ID: $($beatrizResponse.walletId)"
    Write-Host "   API Key: $($beatrizResponse.apiKey)"
    Write-Host ""
    
    $envContent = "# Subconta Beatriz Carraro (Afiliada) - Sandbox`n"
    $envContent += "BEATRIZ_ID=$($beatrizResponse.id)`n"
    $envContent += "BEATRIZ_WALLET_ID=$($beatrizResponse.walletId)`n"
    $envContent += "BEATRIZ_API_KEY=$($beatrizResponse.apiKey)`n"
    
    $envContent | Out-File -FilePath ".env.subcontas-sandbox" -Append -Encoding UTF8
    
    $beatrizWalletId = $beatrizResponse.walletId
    
} catch {
    Write-Host "Erro ao criar subconta Beatriz Carraro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
}

Start-Sleep -Seconds 1

# Resumo Final
Write-Host ""
Write-Host "========================================"
Write-Host "Processo Concluido!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""

if (Test-Path ".env.subcontas-sandbox") {
    Write-Host "Dados salvos em: .env.subcontas-sandbox" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE - Adicione no Supabase:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Acesse: Supabase > Settings > Edge Functions > Secrets"
    Write-Host "2. Adicione a variavel:"
    Write-Host ""
    Write-Host "   Key:   RENUM_WALLET_ID" -ForegroundColor Green
    Write-Host "   Value: $renumWalletId" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para testes de afiliados:" -ForegroundColor Yellow
    Write-Host "   Use o Wallet ID da Beatriz: $beatrizWalletId"
    Write-Host ""
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Resumo das Subcontas:" -ForegroundColor Yellow
    Get-Content ".env.subcontas-sandbox"
    Write-Host ""
}

Write-Host "Pronto para testes!" -ForegroundColor Green
Write-Host ""
