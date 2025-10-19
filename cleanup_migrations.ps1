# Script para deletar migrações não aplicadas
# MANTER apenas as 2 migrações que estão no banco:
# - 20250109000001_create_member_types_system.sql
# - 20251017212727_cleanup_unused_tables.sql

$migrationsToKeep = @(
    "20250109000001_create_member_types_system.sql",
    "20251017212727_cleanup_unused_tables.sql"
)

$migrationsPath = "supabase\migrations"
$allMigrations = Get-ChildItem -Path $migrationsPath -Filter "*.sql"

Write-Host "=" * 80
Write-Host "LIMPEZA DE MIGRAÇÕES NÃO APLICADAS"
Write-Host "=" * 80
Write-Host ""
Write-Host "Total de migrações encontradas: $($allMigrations.Count)"
Write-Host "Migrações a manter: $($migrationsToKeep.Count)"
Write-Host "Migrações a deletar: $($allMigrations.Count - $migrationsToKeep.Count)"
Write-Host ""

$deletedCount = 0

foreach ($migration in $allMigrations) {
    if ($migrationsToKeep -notcontains $migration.Name) {
        Write-Host "🗑️  Deletando: $($migration.Name)"
        Remove-Item $migration.FullName -Force
        $deletedCount++
    } else {
        Write-Host "✅ Mantendo: $($migration.Name)"
    }
}

Write-Host ""
Write-Host "=" * 80
Write-Host "LIMPEZA CONCLUÍDA"
Write-Host "=" * 80
Write-Host "Migrações deletadas: $deletedCount"
Write-Host "Migrações mantidas: $($migrationsToKeep.Count)"
Write-Host ""
Write-Host "✅ Diretório limpo! Futuras migrações funcionarão corretamente."
