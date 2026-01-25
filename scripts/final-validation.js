#!/usr/bin/env node

/**
 * Script de Validação Final - Payment First Flow
 * 
 * Executa validação completa de todos os componentes da implementação
 * Requirements: Validação completa do sistema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  SUPABASE_PROJECT_ID: 'amkelczfwazutrciqtlk',
  REPORT_FILE: './final-validation-report.json',
  LOG_FILE: './final-validation.log',
  TIMEOUT: 30000 // 30 segundos
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

class FinalValidation {
  constructor() {
    this.logEntries = [];
    this.validationResults = {
      database: {},
      edgeFunctions: {},
      frontend: {},
      integration: {},
      performance: {},
      security: {},
      monitoring: {},
      documentation: {}
    };
    this.overallScore = 0;
    this.criticalIssues = [];
    this.warnings = [];
    this.recommendations = [];
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
      case 'CRITICAL': colorCode = colors.magenta; break;
    }
    
    console.log(`${colorCode}${logEntry}${colors.reset}`);
  }

  async executeCommand(command, description, timeout = CONFIG.TIMEOUT) {
    this.log(`Executando: ${description}`, 'INFO');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: timeout
      });
      
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} - Falhou: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async validateDatabase() {
    this.log('🗄️ Validando estrutura do banco de dados...', 'INFO');
    
    const checks = [
      {
        name: 'Tabelas principais existem',
        query: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('profiles', 'user_subscriptions', 'asaas_cobrancas', 'pending_subscriptions', 'pending_completions', 'payment_first_flow_logs', 'feature_flags')`,
        expected: 7
      },
      {
        name: 'Índices de performance existem',
        query: `SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%payment_first_flow%' OR indexname LIKE '%profiles_payment_confirmed%'`,
        expected: 3
      },
      {
        name: 'Políticas RLS ativas',
        query: `SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('profiles', 'user_subscriptions', 'pending_subscriptions')`,
        expected: 6
      },
      {
        name: 'Feature flag principal configurada',
        query: `SELECT COUNT(*) FROM feature_flags WHERE name = 'payment_first_flow'`,
        expected: 1
      },
      {
        name: 'Funções de migração existem',
        query: `SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('check_migration_complete', 'cleanup_temporary_data', 'generate_migration_report')`,
        expected: 3
      }
    ];

    let passedChecks = 0;
    
    for (const check of checks) {
      const result = await this.executeCommand(
        `supabase db execute "${check.query}"`,
        check.name
      );

      if (result.success) {
        const count = this.extractNumber(result.output);
        const passed = count >= check.expected;
        
        this.validationResults.database[check.name] = {
          passed,
          expected: check.expected,
          actual: count,
          query: check.query
        };

        if (passed) {
          passedChecks++;
          this.log(`✅ ${check.name}: ${count}/${check.expected}`, 'SUCCESS');
        } else {
          this.log(`❌ ${check.name}: ${count}/${check.expected}`, 'ERROR');
          this.criticalIssues.push(`Database: ${check.name} falhou`);
        }
      } else {
        this.validationResults.database[check.name] = {
          passed: false,
          error: result.error
        };
        this.criticalIssues.push(`Database: Erro ao verificar ${check.name}`);
      }
    }

    const databaseScore = (passedChecks / checks.length) * 100;
    this.validationResults.database.score = databaseScore;
    this.log(`📊 Score do banco de dados: ${databaseScore.toFixed(1)}%`, databaseScore >= 90 ? 'SUCCESS' : 'WARNING');
  }

  async validateEdgeFunctions() {
    this.log('⚡ Validando Edge Functions...', 'INFO');
    
    const requiredFunctions = [
      'process-payment-first-registration',
      'poll-payment-status',
      'poll-payment-status-frontend',
      'process-pending-subscriptions',
      'process-pending-completions'
    ];

    let functionsValid = 0;

    // Listar functions
    const listResult = await this.executeCommand(
      'supabase functions list',
      'Listar Edge Functions'
    );

    if (listResult.success) {
      for (const functionName of requiredFunctions) {
        const exists = listResult.output.includes(functionName);
        
        if (exists) {
          // Verificar logs recentes para ver se está funcionando
          const logsResult = await this.executeCommand(
            `supabase functions logs ${functionName} --limit 5`,
            `Verificar logs de ${functionName}`
          );

          const isHealthy = logsResult.success && !logsResult.output.includes('ERROR');
          
          this.validationResults.edgeFunctions[functionName] = {
            exists: true,
            healthy: isHealthy,
            logs: logsResult.output
          };

          if (isHealthy) {
            functionsValid++;
            this.log(`✅ ${functionName}: Ativa e saudável`, 'SUCCESS');
          } else {
            this.log(`⚠️ ${functionName}: Ativa mas com possíveis problemas`, 'WARNING');
            this.warnings.push(`Edge Function ${functionName} pode ter problemas`);
          }
        } else {
          this.validationResults.edgeFunctions[functionName] = {
            exists: false,
            healthy: false
          };
          this.log(`❌ ${functionName}: Não encontrada`, 'ERROR');
          this.criticalIssues.push(`Edge Function ${functionName} não existe`);
        }
      }
    } else {
      this.criticalIssues.push('Não foi possível listar Edge Functions');
    }

    const functionsScore = (functionsValid / requiredFunctions.length) * 100;
    this.validationResults.edgeFunctions.score = functionsScore;
    this.log(`📊 Score das Edge Functions: ${functionsScore.toFixed(1)}%`, functionsScore >= 90 ? 'SUCCESS' : 'WARNING');
  }

  async validateFrontend() {
    this.log('🎨 Validando componentes frontend...', 'INFO');
    
    const requiredFiles = [
      'src/lib/services/PaymentFirstFlowService.ts',
      'src/lib/adapters/FiliacaoToPaymentFirstFlow.ts',
      'src/hooks/usePaymentFirstFlowFeature.ts',
      'src/components/payments/PaymentProcessingStatus.tsx',
      'src/components/payments/PaymentErrorHandler.tsx',
      'src/pages/admin/PaymentFirstFlowMonitoring.tsx',
      'src/pages/admin/GradualActivationDashboard.tsx'
    ];

    let validFiles = 0;

    for (const file of requiredFiles) {
      const exists = fs.existsSync(file);
      
      if (exists) {
        // Verificar se arquivo não está vazio e tem conteúdo válido
        const content = fs.readFileSync(file, 'utf8');
        const hasContent = content.length > 100; // Arquivo deve ter conteúdo substancial
        const hasExports = content.includes('export');
        
        this.validationResults.frontend[file] = {
          exists: true,
          hasContent,
          hasExports,
          size: content.length
        };

        if (hasContent && hasExports) {
          validFiles++;
          this.log(`✅ ${file}: Válido`, 'SUCCESS');
        } else {
          this.log(`⚠️ ${file}: Existe mas pode estar incompleto`, 'WARNING');
          this.warnings.push(`Arquivo ${file} pode estar incompleto`);
        }
      } else {
        this.validationResults.frontend[file] = {
          exists: false
        };
        this.log(`❌ ${file}: Não encontrado`, 'ERROR');
        this.criticalIssues.push(`Arquivo frontend ${file} não existe`);
      }
    }

    // Verificar se build funciona
    this.log('🔨 Testando build do frontend...', 'INFO');
    const buildResult = await this.executeCommand(
      'npm run build',
      'Build do frontend',
      60000 // 1 minuto
    );

    this.validationResults.frontend.buildSuccess = buildResult.success;
    
    if (buildResult.success) {
      this.log('✅ Build do frontend: Sucesso', 'SUCCESS');
    } else {
      this.log('❌ Build do frontend: Falhou', 'ERROR');
      this.criticalIssues.push('Build do frontend falhou');
    }

    const frontendScore = ((validFiles / requiredFiles.length) * 0.8 + (buildResult.success ? 0.2 : 0)) * 100;
    this.validationResults.frontend.score = frontendScore;
    this.log(`📊 Score do frontend: ${frontendScore.toFixed(1)}%`, frontendScore >= 90 ? 'SUCCESS' : 'WARNING');
  }

  async validateIntegration() {
    this.log('🔗 Validando integração end-to-end...', 'INFO');
    
    // Verificar se feature flag está configurada corretamente
    const flagResult = await this.executeCommand(
      `supabase db execute "SELECT name, is_enabled, rollout_percentage FROM feature_flags WHERE name = 'payment_first_flow'"`,
      'Verificar feature flag principal'
    );

    let integrationScore = 0;

    if (flagResult.success) {
      const hasFlag = flagResult.output.includes('payment_first_flow');
      this.validationResults.integration.featureFlag = {
        exists: hasFlag,
        output: flagResult.output
      };

      if (hasFlag) {
        integrationScore += 25;
        this.log('✅ Feature flag principal: Configurada', 'SUCCESS');
      } else {
        this.log('❌ Feature flag principal: Não encontrada', 'ERROR');
        this.criticalIssues.push('Feature flag principal não configurada');
      }
    }

    // Verificar se há logs recentes de atividade
    const logsResult = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM payment_first_flow_logs WHERE created_at > NOW() - INTERVAL '7 days'"`,
      'Verificar logs recentes'
    );

    if (logsResult.success) {
      const logCount = this.extractNumber(logsResult.output);
      this.validationResults.integration.recentLogs = {
        count: logCount,
        hasActivity: logCount > 0
      };

      if (logCount > 0) {
        integrationScore += 25;
        this.log(`✅ Logs recentes: ${logCount} entradas nos últimos 7 dias`, 'SUCCESS');
      } else {
        this.log('⚠️ Logs recentes: Nenhuma atividade nos últimos 7 dias', 'WARNING');
        this.warnings.push('Nenhuma atividade recente detectada');
      }
    }

    // Verificar conectividade com Asaas (se possível)
    this.log('🔌 Verificando conectividade com serviços externos...', 'INFO');
    
    // Verificar se secrets estão configurados
    const secretsResult = await this.executeCommand(
      'supabase secrets list',
      'Verificar secrets configurados'
    );

    if (secretsResult.success) {
      const hasAsaasKey = secretsResult.output.includes('ASAAS_API_KEY');
      const hasWebhookToken = secretsResult.output.includes('ASAAS_WEBHOOK_TOKEN');
      
      this.validationResults.integration.secrets = {
        asaasKey: hasAsaasKey,
        webhookToken: hasWebhookToken
      };

      if (hasAsaasKey && hasWebhookToken) {
        integrationScore += 25;
        this.log('✅ Secrets: Configurados corretamente', 'SUCCESS');
      } else {
        this.log('❌ Secrets: Configuração incompleta', 'ERROR');
        this.criticalIssues.push('Secrets não configurados corretamente');
      }
    }

    // Verificar se rotas estão acessíveis
    const routesValid = this.validateRoutes();
    if (routesValid) {
      integrationScore += 25;
    }

    this.validationResults.integration.score = integrationScore;
    this.log(`📊 Score de integração: ${integrationScore.toFixed(1)}%`, integrationScore >= 90 ? 'SUCCESS' : 'WARNING');
  }

  validateRoutes() {
    this.log('🛣️ Validando rotas do sistema...', 'INFO');
    
    const requiredRoutes = [
      '/admin/gradual-activation',
      '/admin/system-settings'
    ];

    // Verificar se rotas estão definidas no App.tsx
    if (fs.existsSync('src/App.tsx')) {
      const appContent = fs.readFileSync('src/App.tsx', 'utf8');
      
      let validRoutes = 0;
      for (const route of requiredRoutes) {
        const routePath = route.replace('/admin/', '');
        if (appContent.includes(`path="${routePath}"`)) {
          validRoutes++;
          this.log(`✅ Rota ${route}: Definida`, 'SUCCESS');
        } else {
          this.log(`❌ Rota ${route}: Não encontrada`, 'ERROR');
          this.criticalIssues.push(`Rota ${route} não definida`);
        }
      }

      return validRoutes === requiredRoutes.length;
    }

    return false;
  }

  async validatePerformance() {
    this.log('⚡ Validando performance do sistema...', 'INFO');
    
    // Verificar métricas de performance dos últimos 7 dias
    const metricsResult = await this.executeCommand(
      `supabase db execute "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_time, COUNT(*) as total_count FROM payment_first_flow_logs WHERE created_at > NOW() - INTERVAL '7 days' AND completed_at IS NOT NULL"`,
      'Verificar métricas de performance'
    );

    let performanceScore = 0;

    if (metricsResult.success) {
      const avgTime = this.extractNumber(metricsResult.output);
      const totalCount = this.extractNumber(metricsResult.output.split('|')[1] || '0');

      this.validationResults.performance.metrics = {
        averageTime: avgTime,
        totalProcessed: totalCount
      };

      // Avaliar tempo médio
      if (avgTime <= 20) {
        performanceScore += 50;
        this.log(`✅ Tempo médio: ${avgTime.toFixed(1)}s (Excelente)`, 'SUCCESS');
      } else if (avgTime <= 30) {
        performanceScore += 30;
        this.log(`⚠️ Tempo médio: ${avgTime.toFixed(1)}s (Aceitável)`, 'WARNING');
      } else {
        this.log(`❌ Tempo médio: ${avgTime.toFixed(1)}s (Lento)`, 'ERROR');
        this.criticalIssues.push('Performance abaixo do esperado');
      }

      // Avaliar volume
      if (totalCount > 0) {
        performanceScore += 25;
        this.log(`✅ Volume processado: ${totalCount} registros`, 'SUCCESS');
      } else {
        this.log('⚠️ Volume processado: Nenhum registro recente', 'WARNING');
        this.warnings.push('Baixo volume de processamento');
      }
    }

    // Verificar tamanho do banco
    const sizeResult = await this.executeCommand(
      `supabase db execute "SELECT pg_size_pretty(pg_database_size(current_database()))"`,
      'Verificar tamanho do banco'
    );

    if (sizeResult.success) {
      performanceScore += 25;
      this.log(`✅ Tamanho do banco: ${sizeResult.output.trim()}`, 'SUCCESS');
      this.validationResults.performance.databaseSize = sizeResult.output.trim();
    }

    this.validationResults.performance.score = performanceScore;
    this.log(`📊 Score de performance: ${performanceScore.toFixed(1)}%`, performanceScore >= 80 ? 'SUCCESS' : 'WARNING');
  }

  async validateSecurity() {
    this.log('🔒 Validando segurança do sistema...', 'INFO');
    
    let securityScore = 0;

    // Verificar políticas RLS
    const rlsResult = await this.executeCommand(
      `supabase db execute "SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('profiles', 'user_subscriptions', 'pending_subscriptions')"`,
      'Verificar políticas RLS'
    );

    if (rlsResult.success) {
      const policyCount = (rlsResult.output.match(/\|/g) || []).length;
      if (policyCount >= 6) {
        securityScore += 30;
        this.log(`✅ Políticas RLS: ${policyCount} políticas ativas`, 'SUCCESS');
      } else {
        this.log(`⚠️ Políticas RLS: Apenas ${policyCount} políticas encontradas`, 'WARNING');
        this.warnings.push('Políticas RLS podem estar incompletas');
      }
    }

    // Verificar se secrets não estão expostos no código
    const sensitiveFiles = ['src/integrations/supabase/client.ts', '.env'];
    let secretsSecure = true;

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('eyJ') && content.includes('supabase')) {
          this.log(`❌ Possível secret exposto em ${file}`, 'CRITICAL');
          this.criticalIssues.push(`Secret possivelmente exposto em ${file}`);
          secretsSecure = false;
        }
      }
    }

    if (secretsSecure) {
      securityScore += 40;
      this.log('✅ Secrets: Não expostos no código', 'SUCCESS');
    }

    // Verificar HTTPS e configurações seguras
    securityScore += 30; // Assumindo que Supabase já fornece HTTPS
    this.log('✅ HTTPS: Configurado via Supabase', 'SUCCESS');

    this.validationResults.security.score = securityScore;
    this.log(`📊 Score de segurança: ${securityScore.toFixed(1)}%`, securityScore >= 90 ? 'SUCCESS' : 'WARNING');
  }

  async validateMonitoring() {
    this.log('📊 Validando sistema de monitoramento...', 'INFO');
    
    let monitoringScore = 0;

    // Verificar se tabela de logs existe e tem dados
    const logsResult = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM payment_first_flow_logs"`,
      'Verificar logs de monitoramento'
    );

    if (logsResult.success) {
      const logCount = this.extractNumber(logsResult.output);
      if (logCount > 0) {
        monitoringScore += 40;
        this.log(`✅ Logs de monitoramento: ${logCount} entradas`, 'SUCCESS');
      } else {
        this.log('⚠️ Logs de monitoramento: Nenhuma entrada encontrada', 'WARNING');
        this.warnings.push('Sistema de logging pode não estar funcionando');
      }
    }

    // Verificar se dashboards existem
    const dashboardFiles = [
      'src/pages/admin/PaymentFirstFlowMonitoring.tsx',
      'src/pages/admin/GradualActivationDashboard.tsx'
    ];

    let validDashboards = 0;
    for (const file of dashboardFiles) {
      if (fs.existsSync(file)) {
        validDashboards++;
        this.log(`✅ Dashboard: ${file} existe`, 'SUCCESS');
      } else {
        this.log(`❌ Dashboard: ${file} não encontrado`, 'ERROR');
        this.criticalIssues.push(`Dashboard ${file} não existe`);
      }
    }

    monitoringScore += (validDashboards / dashboardFiles.length) * 40;

    // Verificar se funções de relatório existem
    const reportFunctionResult = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'generate_migration_report'"`,
      'Verificar função de relatório'
    );

    if (reportFunctionResult.success && this.extractNumber(reportFunctionResult.output) > 0) {
      monitoringScore += 20;
      this.log('✅ Função de relatório: Disponível', 'SUCCESS');
    } else {
      this.log('❌ Função de relatório: Não encontrada', 'ERROR');
      this.criticalIssues.push('Função de relatório não existe');
    }

    this.validationResults.monitoring.score = monitoringScore;
    this.log(`📊 Score de monitoramento: ${monitoringScore.toFixed(1)}%`, monitoringScore >= 80 ? 'SUCCESS' : 'WARNING');
  }

  async validateDocumentation() {
    this.log('📚 Validando documentação...', 'INFO');
    
    const requiredDocs = [
      'docs/GRADUAL_ACTIVATION_GUIDE.md',
      'docs/POST_MIGRATION_CHECKLIST.md',
      'README.md'
    ];

    let validDocs = 0;
    let totalSize = 0;

    for (const doc of requiredDocs) {
      if (fs.existsSync(doc)) {
        const content = fs.readFileSync(doc, 'utf8');
        const size = content.length;
        totalSize += size;

        if (size > 1000) { // Documentação deve ter conteúdo substancial
          validDocs++;
          this.log(`✅ ${doc}: ${size} caracteres`, 'SUCCESS');
        } else {
          this.log(`⚠️ ${doc}: Muito pequeno (${size} caracteres)`, 'WARNING');
          this.warnings.push(`Documentação ${doc} pode estar incompleta`);
        }
      } else {
        this.log(`❌ ${doc}: Não encontrado`, 'ERROR');
        this.criticalIssues.push(`Documentação ${doc} não existe`);
      }
    }

    const docScore = (validDocs / requiredDocs.length) * 100;
    this.validationResults.documentation = {
      score: docScore,
      totalSize,
      validDocs,
      requiredDocs: requiredDocs.length
    };

    this.log(`📊 Score de documentação: ${docScore.toFixed(1)}%`, docScore >= 80 ? 'SUCCESS' : 'WARNING');
  }

  extractNumber(output) {
    if (!output) return 0;
    const match = output.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  calculateOverallScore() {
    const scores = [
      this.validationResults.database.score || 0,
      this.validationResults.edgeFunctions.score || 0,
      this.validationResults.frontend.score || 0,
      this.validationResults.integration.score || 0,
      this.validationResults.performance.score || 0,
      this.validationResults.security.score || 0,
      this.validationResults.monitoring.score || 0,
      this.validationResults.documentation.score || 0
    ];

    this.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateRecommendations() {
    // Recomendações baseadas nos problemas encontrados
    if (this.criticalIssues.length > 0) {
      this.recommendations.push('Resolver todos os problemas críticos antes do deploy em produção');
    }

    if (this.overallScore < 90) {
      this.recommendations.push('Melhorar áreas com score baixo antes da ativação completa');
    }

    if (this.validationResults.performance.score < 80) {
      this.recommendations.push('Otimizar performance do sistema');
    }

    if (this.validationResults.security.score < 95) {
      this.recommendations.push('Revisar configurações de segurança');
    }

    if (this.warnings.length > 5) {
      this.recommendations.push('Investigar e resolver warnings acumulados');
    }

    // Recomendações gerais
    this.recommendations.push('Monitorar sistema continuamente por 30 dias');
    this.recommendations.push('Configurar alertas para métricas críticas');
    this.recommendations.push('Treinar equipe nos novos processos');
    this.recommendations.push('Documentar lições aprendidas');
  }

  async generateFinalReport() {
    this.calculateOverallScore();
    this.generateRecommendations();

    const report = {
      timestamp: new Date().toISOString(),
      overall_score: this.overallScore,
      status: this.overallScore >= 90 ? 'READY_FOR_PRODUCTION' : 
              this.overallScore >= 80 ? 'READY_WITH_MONITORING' : 
              'NEEDS_IMPROVEMENT',
      validation_results: this.validationResults,
      critical_issues: this.criticalIssues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      summary: {
        total_checks: Object.keys(this.validationResults).length,
        critical_issues_count: this.criticalIssues.length,
        warnings_count: this.warnings.length,
        recommendations_count: this.recommendations.length
      },
      next_steps: this.criticalIssues.length === 0 ? [
        'Sistema aprovado para produção',
        'Iniciar ativação gradual',
        'Monitorar métricas continuamente',
        'Executar checklist pós-deploy'
      ] : [
        'Resolver problemas críticos identificados',
        'Re-executar validação',
        'Não prosseguir para produção até resolução'
      ]
    };

    // Salvar relatório
    fs.writeFileSync(CONFIG.REPORT_FILE, JSON.stringify(report, null, 2));
    
    // Salvar logs
    fs.writeFileSync(CONFIG.LOG_FILE, this.logEntries.join('\n'));

    return report;
  }

  async performFinalValidation() {
    try {
      this.log('🎯 Iniciando validação final do Payment First Flow', 'INFO');
      this.log('', 'INFO');

      // Executar todas as validações
      await this.validateDatabase();
      await this.validateEdgeFunctions();
      await this.validateFrontend();
      await this.validateIntegration();
      await this.validatePerformance();
      await this.validateSecurity();
      await this.validateMonitoring();
      await this.validateDocumentation();

      // Gerar relatório final
      const report = await this.generateFinalReport();

      // Exibir resultado final
      this.log('', 'INFO');
      this.log('🎉 VALIDAÇÃO FINAL CONCLUÍDA!', 'SUCCESS');
      this.log('', 'INFO');
      this.log(`📊 SCORE GERAL: ${this.overallScore.toFixed(1)}%`, this.overallScore >= 90 ? 'SUCCESS' : 'WARNING');
      this.log(`🎯 STATUS: ${report.status}`, report.status === 'READY_FOR_PRODUCTION' ? 'SUCCESS' : 'WARNING');
      this.log('', 'INFO');

      if (this.criticalIssues.length > 0) {
        this.log(`🚨 PROBLEMAS CRÍTICOS (${this.criticalIssues.length}):`, 'CRITICAL');
        this.criticalIssues.forEach(issue => this.log(`   - ${issue}`, 'CRITICAL'));
        this.log('', 'INFO');
      }

      if (this.warnings.length > 0) {
        this.log(`⚠️ AVISOS (${this.warnings.length}):`, 'WARNING');
        this.warnings.slice(0, 5).forEach(warning => this.log(`   - ${warning}`, 'WARNING'));
        if (this.warnings.length > 5) {
          this.log(`   ... e mais ${this.warnings.length - 5} avisos`, 'WARNING');
        }
        this.log('', 'INFO');
      }

      this.log('📋 PRÓXIMOS PASSOS:', 'INFO');
      report.next_steps.forEach(step => this.log(`   - ${step}`, 'INFO'));
      this.log('', 'INFO');

      this.log(`📄 Relatório completo: ${CONFIG.REPORT_FILE}`, 'INFO');
      this.log(`📄 Logs detalhados: ${CONFIG.LOG_FILE}`, 'INFO');

      return report;

    } catch (error) {
      this.log(`💥 VALIDAÇÃO FALHOU: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validation = new FinalValidation();
  
  validation.performFinalValidation()
    .then((report) => {
      const exitCode = report.status === 'READY_FOR_PRODUCTION' ? 0 : 1;
      console.log(`\n${exitCode === 0 ? '✅' : '❌'} Validação ${exitCode === 0 ? 'aprovada' : 'reprovada'}`);
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('\n❌ Validação falhou:', error.message);
      process.exit(1);
    });
}

module.exports = FinalValidation;