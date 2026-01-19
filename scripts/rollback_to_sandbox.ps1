# Script PowerShell para rollback para ambiente sandbox
# COMADEMIG - Rollback Produção → Sandbox

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ROLLBACK PARA SANDBOX - COMADEMIG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRef = "amkelczfwazutrciqtlk"

Write-Host "⚠️  ATENÇÃO: Isso reverterá para o ambiente SANDBOX!" -ForegroundColor Red
Write-Host "⚠️  Cobranças voltarão a ser simuladas!" -ForegroundColor Red
Write-Host ""
Write-Host "Continuar? (S/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operação cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Digite a API Key de SANDBOX do Asaas:" -ForegroundColor Cyan
Write-Host "(Formato: `$aact_hmlg_...)" -ForegroundColor Gray
$asaasApiKey = Read-Host -AsSecureString
$asaasApiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($asaasApiKey)
)

Write-Host ""
Write-Host "Digite o Webhook Token de sandbox:" -ForegroundColor Cyan
$webhookToken = Read-Host

Write-Host ""
Write-Host "1. Fazendo backup dos secrets atuais..." -ForegroundColor Yellow
$backupFile = "secrets_backup_production_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
supabase secrets list --project-ref $projectRef > $backupFile
Write-Host "✅ Backup salvo em: $backupFile" -ForegroundColor Green
Write-Host ""

Write-Host "2. Restaurando secrets de sandbox..." -ForegroundColor Yellow

# Configurar ASAAS_API_KEY
Write-Host "   Configurando ASAAS_API_KEY..." -ForegroundColor Gray
supabase secrets set "ASAAS_API_KEY=$asaasApiKeyPlain" --project-ref $projectRef

# Configurar ASAAS_BASE_URL
Write-Host "   Configurando ASAAS_BASE_URL..." -ForegroundColor Gray
supabase secrets set "ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3" --project-ref $projectRef

# Configurar ASAAS_ENVIRONMENT
Write-Host "   Configurando ASAAS_ENVIRONMENT..." -ForegroundColor Gray
supabase secrets set "ASAAS_ENVIRONMENT=sandbox" --project-ref $projectRef

# Configurar ASAAS_WEBHOOK_TOKEN
Write-Host "   Configurando ASAAS_WEBHOOK_TOKEN..." -ForegroundColor Gray
supabase secrets set "ASAAS_WEBHOOK_TOKEN=$webhookToken" --project-ref $projectRef

Write-Host ""
Write-Host "3. Verificando secrets..." -ForegroundColor Yellow
supabase secrets list --project-ref $projectRef
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Redeploy das Edge Functions:" -ForegroundColor Yellow
Write-Host "   supabase functions deploy --project-ref $projectRef" -ForegroundColor White
Write-Host ""
Write-Host "2. Atualizar variáveis no Vercel:" -ForegroundColor Yellow
Write-Host "   - VITE_ASAAS_ENVIRONMENT=sandbox" -ForegroundColor White
Write-Host "   - VITE_ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3" -ForegroundColor White
Write-Host ""
Write-Host "✅ Rollback concluído!" -ForegroundColor Green
Write-Host ""
