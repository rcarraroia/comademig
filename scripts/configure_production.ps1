# Script PowerShell para configurar ambiente de produção
# COMADEMIG - Migração Sandbox → Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURAÇÃO DE PRODUÇÃO - COMADEMIG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Supabase CLI está instalado
Write-Host "1. Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: scoop install supabase" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase CLI instalado: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Solicitar credenciais
Write-Host "2. Configuração de Credenciais" -ForegroundColor Yellow
Write-Host ""

$projectRef = "amkelczfwazutrciqtlk"

Write-Host "Digite a API Key de PRODUÇÃO do Asaas:" -ForegroundColor Cyan
Write-Host "(Formato: `$aact_prod_...)" -ForegroundColor Gray
$asaasApiKey = Read-Host -AsSecureString
$asaasApiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($asaasApiKey)
)

Write-Host ""
Write-Host "Digite o Wallet ID do Asaas (opcional):" -ForegroundColor Cyan
$walletId = Read-Host

Write-Host ""
Write-Host "Gerar novo Webhook Token? (S/N)" -ForegroundColor Cyan
$generateToken = Read-Host
$webhookToken = ""
if ($generateToken -eq "S" -or $generateToken -eq "s") {
    $webhookToken = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "✅ Token gerado: $webhookToken" -ForegroundColor Green
} else {
    Write-Host "Digite o Webhook Token:" -ForegroundColor Cyan
    $webhookToken = Read-Host
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIRMAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Projeto: $projectRef" -ForegroundColor White
Write-Host "API Key: $($asaasApiKeyPlain.Substring(0, 20))..." -ForegroundColor White
Write-Host "Base URL: https://api.asaas.com/v3" -ForegroundColor White
Write-Host "Ambiente: production" -ForegroundColor White
Write-Host "Wallet ID: $walletId" -ForegroundColor White
Write-Host "Webhook Token: $($webhookToken.Substring(0, 20))..." -ForegroundColor White
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Isso configurará o ambiente de PRODUÇÃO!" -ForegroundColor Red
Write-Host "⚠️  Cobranças serão REAIS!" -ForegroundColor Red
Write-Host ""
Write-Host "Continuar? (S/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "3. Fazendo backup dos secrets atuais..." -ForegroundColor Yellow
$backupFile = "secrets_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
supabase secrets list --project-ref $projectRef > $backupFile
Write-Host "✅ Backup salvo em: $backupFile" -ForegroundColor Green
Write-Host ""

Write-Host "4. Configurando secrets de produção..." -ForegroundColor Yellow

# Configurar ASAAS_API_KEY
Write-Host "   Configurando ASAAS_API_KEY..." -ForegroundColor Gray
supabase secrets set "ASAAS_API_KEY=$asaasApiKeyPlain" --project-ref $projectRef
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ASAAS_API_KEY configurado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao configurar ASAAS_API_KEY" -ForegroundColor Red
    exit 1
}

# Configurar ASAAS_BASE_URL
Write-Host "   Configurando ASAAS_BASE_URL..." -ForegroundColor Gray
supabase secrets set "ASAAS_BASE_URL=https://api.asaas.com/v3" --project-ref $projectRef
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ASAAS_BASE_URL configurado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao configurar ASAAS_BASE_URL" -ForegroundColor Red
}

# Configurar ASAAS_ENVIRONMENT
Write-Host "   Configurando ASAAS_ENVIRONMENT..." -ForegroundColor Gray
supabase secrets set "ASAAS_ENVIRONMENT=production" --project-ref $projectRef
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ASAAS_ENVIRONMENT configurado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao configurar ASAAS_ENVIRONMENT" -ForegroundColor Red
}

# Configurar ASAAS_WEBHOOK_TOKEN
Write-Host "   Configurando ASAAS_WEBHOOK_TOKEN..." -ForegroundColor Gray
supabase secrets set "ASAAS_WEBHOOK_TOKEN=$webhookToken" --project-ref $projectRef
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ASAAS_WEBHOOK_TOKEN configurado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao configurar ASAAS_WEBHOOK_TOKEN" -ForegroundColor Red
}

# Configurar ASAAS_WALLET_ID (se fornecido)
if ($walletId) {
    Write-Host "   Configurando ASAAS_WALLET_ID..." -ForegroundColor Gray
    supabase secrets set "ASAAS_WALLET_ID=$walletId" --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ ASAAS_WALLET_ID configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao configurar ASAAS_WALLET_ID" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "5. Verificando secrets configurados..." -ForegroundColor Yellow
supabase secrets list --project-ref $projectRef
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Redeploy das Edge Functions:" -ForegroundColor Yellow
Write-Host "   supabase functions deploy --project-ref $projectRef" -ForegroundColor White
Write-Host ""
Write-Host "2. Configurar variáveis no Vercel:" -ForegroundColor Yellow
Write-Host "   - VITE_ASAAS_ENVIRONMENT=production" -ForegroundColor White
Write-Host "   - VITE_ASAAS_BASE_URL=https://api.asaas.com/v3" -ForegroundColor White
Write-Host ""
Write-Host "3. Configurar webhook no Asaas:" -ForegroundColor Yellow
Write-Host "   URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook" -ForegroundColor White
Write-Host "   Token: $webhookToken" -ForegroundColor White
Write-Host ""
Write-Host "4. Testar ambiente de produção" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  LEMBRE-SE: Em produção, cobranças são REAIS!" -ForegroundColor Red
Write-Host ""
