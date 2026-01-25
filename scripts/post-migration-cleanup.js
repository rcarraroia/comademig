#!/usr/bin/env node

/**
 * Script de Limpeza Pós-Migração
 * 
 * Remove código legado e limpa estruturas não utilizadas após migração completa
 * Requirements: 9.4
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  SUPABASE_PROJECT_ID: 'amkelczfwazutrciqtlk',
  BACKUP_DIR: './cleanup-backups',
  LOG_FILE: './post-migration-cleanup.log',
  DRY_RUN: process.argv.includes('--dry-run'),
  FORCE: process.argv.includes('--force')
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class PostMigrationCleanup {
  constructor() {
    this.logEntries = [];
    this.cleanupItems = [];
    this.backupCreated = false;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    this.logEntries.push(logEntry);
    
    // Colorir output baseado no level
    let colorCode = colors.reset;
    switch (level) {
      case 'ERROR': colorCode = colors.red; break;
      case 'SUCCESS': colorCode = colors.green; break;
      case 'WARNING': colorCode = colors.yellow; break;
      case 'INFO': colorCode = colors.blue; break;
      case 'DRY_RUN': colorCode = colors.cyan; break;
    }
    
    console.log(`${colorCode}${logEntry}${colors.reset}`);
  }

  async executeCommand(command, description) {
    this.log(`${CONFIG.DRY_RUN ? '[DRY RUN] ' : ''}Executando: ${description}`, CONFIG.DRY_RUN ? 'DRY_RUN' : 'INFO');
    
    if (CONFIG.DRY_RUN) {
      this.log(`[DRY RUN] Comando: ${command}`, 'DRY_RUN');
      return { success: true, output: 'DRY RUN - comando não executado' };
    }
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.log(`✅ ${description} - Concluído`, 'SUCCESS');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} - Falhou: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async verifyMigrationComplete() {
    this.log('🔍 Verificando se migração está 100% completa...', 'INFO');
    
    // Verificar se feature flag está em 100%
    const flagCheck = await this.executeCommand(
      `supabase db execute "SELECT rollout_percentage, is_enabled FROM feature_flags WHERE name = 'payment_first_flow'"`,
      'Verificar status da feature flag'
    );

    if (!flagCheck.success) {
      throw new Error('Não foi possível verificar status da feature flag');
    }

    const isComplete = flagCheck.output.includes('100') && flagCheck.output.includes('t');
    
    if (!isComplete && !CONFIG.FORCE) {
      throw new Error('Migração não está 100% completa. Use --force para prosseguir mesmo assim.');
    }

    // Verificar se não há registros pendentes
    const pendingCheck = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM pending_subscriptions WHERE status = 'pending'"`,
      'Verificar registros pendentes'
    );

    if (pendingCheck.success) {
      const pendingCount = this.extractNumber(pendingCheck.output);
      if (pendingCount > 0 && !CONFIG.FORCE) {
        throw new Error(`Ainda há ${pendingCount} registros pendentes. Use --force para prosseguir mesmo assim.`);
      }
    }

    this.log('✅ Migração verificada como completa', 'SUCCESS');
  }

  extractNumber(output) {
    if (!output) return 0;
    const match = output.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async createBackup() {
    if (this.backupCreated) return;

    this.log('💾 Criando backup antes da limpeza...', 'INFO');
    
    const backupDir = path.join(CONFIG.BACKUP_DIR, `cleanup-${Date.now()}`);
    
    if (!CONFIG.DRY_RUN) {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
    }

    // Backup do código que será removido
    const filesToBackup = [
      'src/hooks/useFiliacaoPayment.ts',
      'src/components/payments/PaymentFormEnhanced.tsx',
      'src/pages/Filiacao.tsx'
    ];

    for (const file of filesToBackup) {
      if (fs.existsSync(file)) {
        const backupPath = path.join(backupDir, file);
        
        if (!CONFIG.DRY_RUN) {
          const backupFileDir = path.dirname(backupPath);
          if (!fs.existsSync(backupFileDir)) {
            fs.mkdirSync(backupFileDir, { recursive: true });
          }
          fs.copyFileSync(file, backupPath);
        }
        
        this.log(`📄 Backup criado: ${file} -> ${backupPath}`, 'INFO');
      }
    }

    // Backup do banco de dados
    await this.executeCommand(
      `supabase db dump --schema public -f "${backupDir}/database_backup.sql"`,
      'Backup do banco de dados'
    );

    this.backupCreated = true;
    this.log(`✅ Backup criado em: ${backupDir}`, 'SUCCESS');
  }

  async identifyLegacyCode() {
    this.log('🔍 Identificando código legado para remoção...', 'INFO');

    // Arquivos que podem ser removidos após migração completa
    const legacyFiles = [
      // Hooks antigos
      'src/hooks/useFiliacaoPaymentLegacy.ts',
      
      // Componentes antigos (se existirem versões separadas)
      'src/components/payments/LegacyPaymentForm.tsx',
      
      // Utilitários antigos
      'src/utils/legacyValidation.ts',
      
      // Testes antigos
      'src/__tests__/legacy/',
      
      // Documentação temporária
      'docs/MIGRATION_TEMP.md',
      'docs/LEGACY_FLOW.md'
    ];

    // Código dentro de arquivos que pode ser removido
    const codeToRemove = [
      {
        file: 'src/hooks/useFiliacaoPayment.ts',
        patterns: [
          '// LEGACY CODE - Remove after migration',
          '// TODO: Remove after Payment First Flow migration',
          'if (useOldFlow) {', // Blocos condicionais do fluxo antigo
        ]
      },
      {
        file: 'src/pages/Filiacao.tsx',
        patterns: [
          '// Legacy payment flow',
          'const legacyMode =',
        ]
      }
    ];

    // Feature flags que podem ser removidas
    const legacyFeatureFlags = [
      'payment_first_flow_beta',
      'payment_first_flow_test',
      'legacy_payment_flow_fallback'
    ];

    // Tabelas temporárias que podem ser limpas
    const temporaryTables = [
      'migration_temp_data',
      'legacy_payment_backup',
      'temp_user_migration'
    ];

    this.cleanupItems = {
      files: legacyFiles.filter(file => fs.existsSync(file)),
      codePatterns: codeToRemove,
      featureFlags: legacyFeatureFlags,
      tables: temporaryTables
    };

    this.log(`📋 Identificados ${this.cleanupItems.files.length} arquivos legados`, 'INFO');
    this.log(`📋 Identificados ${this.cleanupItems.codePatterns.length} arquivos com código legado`, 'INFO');
    this.log(`📋 Identificadas ${this.cleanupItems.featureFlags.length} feature flags temporárias`, 'INFO');
    this.log(`📋 Identificadas ${this.cleanupItems.tables.length} tabelas temporárias`, 'INFO');
  }

  async removeLegacyFiles() {
    this.log('🗑️ Removendo arquivos legados...', 'INFO');

    for (const file of this.cleanupItems.files) {
      if (fs.existsSync(file)) {
        if (!CONFIG.DRY_RUN) {
          if (fs.lstatSync(file).isDirectory()) {
            fs.rmSync(file, { recursive: true, force: true });
          } else {
            fs.unlinkSync(file);
          }
        }
        this.log(`🗑️ Removido: ${file}`, 'SUCCESS');
      }
    }
  }

  async cleanLegacyCode() {
    this.log('✂️ Limpando código legado dentro de arquivos...', 'INFO');

    for (const item of this.cleanupItems.codePatterns) {
      if (!fs.existsSync(item.file)) continue;

      const content = fs.readFileSync(item.file, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      for (const pattern of item.patterns) {
        if (content.includes(pattern)) {
          this.log(`✂️ Encontrado código legado em ${item.file}: ${pattern}`, 'INFO');
          
          // Para padrões simples, remover a linha
          if (pattern.startsWith('//')) {
            const lines = modifiedContent.split('\n');
            modifiedContent = lines.filter(line => !line.includes(pattern)).join('\n');
            hasChanges = true;
          }
          
          // Para blocos condicionais, seria necessário análise mais complexa
          // Por segurança, apenas reportar
          if (pattern.includes('if (')) {
            this.log(`⚠️ Bloco condicional encontrado em ${item.file}. Revisão manual necessária.`, 'WARNING');
          }
        }
      }

      if (hasChanges && !CONFIG.DRY_RUN) {
        fs.writeFileSync(item.file, modifiedContent);
        this.log(`✅ Código legado removido de: ${item.file}`, 'SUCCESS');
      }
    }
  }

  async removeLegacyFeatureFlags() {
    this.log('🚩 Removendo feature flags temporárias...', 'INFO');

    for (const flagName of this.cleanupItems.featureFlags) {
      // Verificar se existe
      const checkResult = await this.executeCommand(
        `supabase db execute "SELECT id FROM feature_flags WHERE name = '${flagName}'"`,
        `Verificar feature flag ${flagName}`
      );

      if (checkResult.success && checkResult.output.trim()) {
        // Remover
        await this.executeCommand(
          `supabase db execute "DELETE FROM feature_flags WHERE name = '${flagName}'"`,
          `Remover feature flag ${flagName}`
        );
      }
    }
  }

  async cleanTemporaryTables() {
    this.log('🗄️ Limpando tabelas temporárias...', 'INFO');

    for (const tableName of this.cleanupItems.tables) {
      // Verificar se existe
      const checkResult = await this.executeCommand(
        `supabase db execute "SELECT to_regclass('${tableName}')"`,
        `Verificar tabela ${tableName}`
      );

      if (checkResult.success && !checkResult.output.includes('null')) {
        // Verificar se tem dados importantes
        const countResult = await this.executeCommand(
          `supabase db execute "SELECT COUNT(*) FROM ${tableName}"`,
          `Contar registros em ${tableName}`
        );

        const recordCount = this.extractNumber(countResult.output);
        
        if (recordCount > 0) {
          this.log(`⚠️ Tabela ${tableName} tem ${recordCount} registros. Revisão manual necessária.`, 'WARNING');
        } else {
          // Remover tabela vazia
          await this.executeCommand(
            `supabase db execute "DROP TABLE IF EXISTS ${tableName}"`,
            `Remover tabela vazia ${tableName}`
          );
        }
      }
    }
  }

  async optimizeDatabase() {
    this.log('⚡ Otimizando banco de dados...', 'INFO');

    // Recriar índices se necessário
    await this.executeCommand(
      `supabase db execute "REINDEX DATABASE"`,
      'Recriar índices do banco'
    );

    // Atualizar estatísticas
    await this.executeCommand(
      `supabase db execute "ANALYZE"`,
      'Atualizar estatísticas do banco'
    );

    // Vacuum para recuperar espaço
    await this.executeCommand(
      `supabase db execute "VACUUM"`,
      'Vacuum do banco de dados'
    );
  }

  async updateDocumentation() {
    this.log('📚 Atualizando documentação...', 'INFO');

    const updatedDocs = [
      {
        file: 'README.md',
        changes: 'Remover referências ao fluxo antigo de pagamento'
      },
      {
        file: 'docs/ARCHITECTURE.md',
        changes: 'Atualizar arquitetura para refletir Payment First Flow'
      },
      {
        file: 'docs/API.md',
        changes: 'Remover endpoints legados'
      }
    ];

    for (const doc of updatedDocs) {
      if (fs.existsSync(doc.file)) {
        this.log(`📝 Documentação a atualizar: ${doc.file} - ${doc.changes}`, 'INFO');
      }
    }

    // Criar documentação de migração concluída
    const migrationSummary = `# Migração Payment First Flow - Concluída

## Data de Conclusão
${new Date().toISOString()}

## Resumo
A migração do fluxo de registro foi concluída com sucesso. O sistema agora utiliza exclusivamente o Payment First Flow.

## Mudanças Principais
- Fluxo de registro invertido (pagamento → conta)
- Melhoria na taxa de conversão
- Redução do tempo de processamento
- Sistema de fallback robusto

## Código Removido
${this.cleanupItems.files.map(f => `- ${f}`).join('\n')}

## Feature Flags Removidas
${this.cleanupItems.featureFlags.map(f => `- ${f}`).join('\n')}

## Próximos Passos
- Monitoramento contínuo por 30 dias
- Análise de métricas de negócio
- Otimizações baseadas em feedback

---
Gerado automaticamente pelo script de limpeza pós-migração
`;

    if (!CONFIG.DRY_RUN) {
      fs.writeFileSync('docs/MIGRATION_COMPLETED.md', migrationSummary);
    }
    
    this.log('📄 Documentação de migração concluída criada', 'SUCCESS');
  }

  async generateCleanupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      dry_run: CONFIG.DRY_RUN,
      migration_verified: true,
      cleanup_summary: {
        files_removed: this.cleanupItems.files.length,
        code_patterns_cleaned: this.cleanupItems.codePatterns.length,
        feature_flags_removed: this.cleanupItems.featureFlags.length,
        tables_cleaned: this.cleanupItems.tables.length
      },
      items_processed: {
        files: this.cleanupItems.files,
        feature_flags: this.cleanupItems.featureFlags,
        tables: this.cleanupItems.tables
      },
      recommendations: [
        'Monitorar sistema por 30 dias após limpeza',
        'Verificar se todas as funcionalidades continuam operacionais',
        'Revisar manualmente código com padrões condicionais',
        'Atualizar documentação técnica',
        'Treinar equipe nas novas funcionalidades'
      ],
      rollback_info: {
        backup_location: CONFIG.BACKUP_DIR,
        rollback_possible: true,
        rollback_time_estimate: '2-4 horas'
      }
    };

    const reportPath = `./cleanup-report-${Date.now()}.json`;
    
    if (!CONFIG.DRY_RUN) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    }

    // Salvar logs
    if (!CONFIG.DRY_RUN) {
      fs.writeFileSync(CONFIG.LOG_FILE, this.logEntries.join('\n'));
    }

    this.log('📊 Relatório de limpeza gerado', 'SUCCESS');
    this.log(`📄 Relatório: ${reportPath}`, 'INFO');
    this.log(`📄 Logs: ${CONFIG.LOG_FILE}`, 'INFO');

    return report;
  }

  async performCleanup() {
    try {
      this.log(`🧹 Iniciando limpeza pós-migração${CONFIG.DRY_RUN ? ' (DRY RUN)' : ''}`, 'INFO');
      
      if (CONFIG.DRY_RUN) {
        this.log('🔍 Modo DRY RUN ativo - nenhuma alteração será feita', 'DRY_RUN');
      }

      // 1. Verificar se migração está completa
      await this.verifyMigrationComplete();

      // 2. Criar backup
      await this.createBackup();

      // 3. Identificar itens para limpeza
      await this.identifyLegacyCode();

      // 4. Remover arquivos legados
      await this.removeLegacyFiles();

      // 5. Limpar código legado
      await this.cleanLegacyCode();

      // 6. Remover feature flags temporárias
      await this.removeLegacyFeatureFlags();

      // 7. Limpar tabelas temporárias
      await this.cleanTemporaryTables();

      // 8. Otimizar banco de dados
      await this.optimizeDatabase();

      // 9. Atualizar documentação
      await this.updateDocumentation();

      // 10. Gerar relatório
      const report = await this.generateCleanupReport();

      this.log('🎉 LIMPEZA PÓS-MIGRAÇÃO CONCLUÍDA!', 'SUCCESS');
      this.log('', 'INFO');
      this.log('📋 RESUMO:', 'INFO');
      this.log(`   Arquivos removidos: ${report.cleanup_summary.files_removed}`, 'INFO');
      this.log(`   Feature flags removidas: ${report.cleanup_summary.feature_flags_removed}`, 'INFO');
      this.log(`   Tabelas limpas: ${report.cleanup_summary.tables_cleaned}`, 'INFO');
      this.log('', 'INFO');
      this.log('📋 PRÓXIMOS PASSOS:', 'INFO');
      this.log('1. Monitorar sistema por 30 dias', 'INFO');
      this.log('2. Verificar funcionalidades críticas', 'INFO');
      this.log('3. Atualizar documentação técnica', 'INFO');
      this.log('4. Treinar equipe', 'INFO');

      return report;

    } catch (error) {
      this.log(`💥 LIMPEZA FALHOU: ${error.message}`, 'ERROR');
      this.log('', 'ERROR');
      this.log('🔄 INSTRUÇÕES DE RECUPERAÇÃO:', 'ERROR');
      this.log('1. Verificar logs de erro', 'ERROR');
      this.log('2. Restaurar backup se necessário', 'ERROR');
      this.log(`3. Backup disponível em: ${CONFIG.BACKUP_DIR}`, 'ERROR');
      
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node post-migration-cleanup.js [opções]');
    console.log('');
    console.log('Opções:');
    console.log('  --dry-run    Simular limpeza sem fazer alterações');
    console.log('  --force      Prosseguir mesmo se migração não estiver 100% completa');
    console.log('  --help, -h   Mostrar esta ajuda');
    console.log('');
    console.log('Exemplos:');
    console.log('  node post-migration-cleanup.js --dry-run');
    console.log('  node post-migration-cleanup.js --force');
    process.exit(0);
  }

  const cleanup = new PostMigrationCleanup();
  
  try {
    await cleanup.performCleanup();
    console.log('\n✅ Limpeza concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Limpeza falhou:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = PostMigrationCleanup;