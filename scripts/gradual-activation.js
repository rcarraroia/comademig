#!/usr/bin/env node

/**
 * Script de Ativação Gradual do Payment First Flow
 * 
 * Permite ativar gradualmente o novo fluxo para percentuais crescentes de usuários
 * Requirements: 10.1, 10.4
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// Configurações
const CONFIG = {
  SUPABASE_PROJECT_ID: 'amkelczfwazutrciqtlk',
  FEATURE_FLAG_NAME: 'payment_first_flow',
  LOG_FILE: './gradual-activation.log',
  MONITORING_INTERVAL: 5 * 60 * 1000, // 5 minutos
  ROLLOUT_STEPS: [5, 10, 25, 50, 75, 100], // Percentuais de rollout
  SUCCESS_THRESHOLD: 95, // % de sucesso mínimo para continuar
  ERROR_THRESHOLD: 5 // % de erro máximo para continuar
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

class GradualActivationManager {
  constructor() {
    this.currentPercentage = 0;
    this.logEntries = [];
    this.metrics = {
      totalAttempts: 0,
      successfulRegistrations: 0,
      failedRegistrations: 0,
      averageProcessingTime: 0,
      errorsByType: {}
    };
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
      case 'METRIC': colorCode = colors.cyan; break;
    }
    
    console.log(`${colorCode}${logEntry}${colors.reset}`);
  }

  async executeCommand(command, description) {
    this.log(`Executando: ${description}`, 'INFO');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} - Falhou: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async getCurrentRolloutPercentage() {
    const result = await this.executeCommand(
      `supabase db execute "SELECT rollout_percentage FROM feature_flags WHERE name = '${CONFIG.FEATURE_FLAG_NAME}'"`,
      'Verificar percentual atual'
    );

    if (result.success) {
      const match = result.output.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    
    return 0;
  }

  async updateRolloutPercentage(percentage) {
    this.log(`🎯 Atualizando rollout para ${percentage}%`, 'INFO');
    
    const result = await this.executeCommand(
      `supabase db execute "UPDATE feature_flags SET rollout_percentage = ${percentage}, is_enabled = TRUE WHERE name = '${CONFIG.FEATURE_FLAG_NAME}'"`,
      `Atualizar rollout para ${percentage}%`
    );

    if (result.success) {
      this.currentPercentage = percentage;
      this.log(`✅ Rollout atualizado para ${percentage}%`, 'SUCCESS');
      
      // Registrar no histórico
      await this.executeCommand(
        `supabase db execute "INSERT INTO feature_flag_history (feature_flag_id, action, new_value, reason) SELECT id, 'percentage_changed', '${percentage}', 'Ativação gradual automática' FROM feature_flags WHERE name = '${CONFIG.FEATURE_FLAG_NAME}'"`,
        'Registrar no histórico'
      );
      
      return true;
    }
    
    return false;
  }

  async collectMetrics() {
    this.log('📊 Coletando métricas...', 'METRIC');
    
    // Métricas dos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    // Total de tentativas de registro
    const totalResult = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM payment_first_flow_logs WHERE created_at >= '${thirtyMinutesAgo}' AND event_type = 'registration_attempt'"`,
      'Contar tentativas de registro'
    );
    
    // Registros bem-sucedidos
    const successResult = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM payment_first_flow_logs WHERE created_at >= '${thirtyMinutesAgo}' AND event_type = 'registration_completed'"`,
      'Contar registros bem-sucedidos'
    );
    
    // Registros com falha
    const failureResult = await this.executeCommand(
      `supabase db execute "SELECT COUNT(*) FROM payment_first_flow_logs WHERE created_at >= '${thirtyMinutesAgo}' AND event_type = 'registration_failed'"`,
      'Contar registros com falha'
    );
    
    // Tempo médio de processamento
    const avgTimeResult = await this.executeCommand(
      `supabase db execute "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FROM payment_first_flow_logs WHERE created_at >= '${thirtyMinutesAgo}' AND completed_at IS NOT NULL"`,
      'Calcular tempo médio'
    );
    
    // Erros por tipo
    const errorTypesResult = await this.executeCommand(
      `supabase db execute "SELECT error_type, COUNT(*) FROM payment_first_flow_logs WHERE created_at >= '${thirtyMinutesAgo}' AND event_type = 'error' GROUP BY error_type"`,
      'Contar erros por tipo'
    );

    // Processar resultados
    this.metrics.totalAttempts = this.extractNumber(totalResult.output) || 0;
    this.metrics.successfulRegistrations = this.extractNumber(successResult.output) || 0;
    this.metrics.failedRegistrations = this.extractNumber(failureResult.output) || 0;
    this.metrics.averageProcessingTime = this.extractNumber(avgTimeResult.output) || 0;

    // Calcular taxas
    const successRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.successfulRegistrations / this.metrics.totalAttempts) * 100 
      : 100;
    
    const errorRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.failedRegistrations / this.metrics.totalAttempts) * 100 
      : 0;

    this.log(`📈 Métricas dos últimos 30 min:`, 'METRIC');
    this.log(`   Total de tentativas: ${this.metrics.totalAttempts}`, 'METRIC');
    this.log(`   Registros bem-sucedidos: ${this.metrics.successfulRegistrations}`, 'METRIC');
    this.log(`   Registros com falha: ${this.metrics.failedRegistrations}`, 'METRIC');
    this.log(`   Taxa de sucesso: ${successRate.toFixed(1)}%`, 'METRIC');
    this.log(`   Taxa de erro: ${errorRate.toFixed(1)}%`, 'METRIC');
    this.log(`   Tempo médio: ${this.metrics.averageProcessingTime.toFixed(1)}s`, 'METRIC');

    return {
      successRate,
      errorRate,
      averageTime: this.metrics.averageProcessingTime
    };
  }

  extractNumber(output) {
    if (!output) return 0;
    const match = output.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  async checkSystemHealth() {
    this.log('🏥 Verificando saúde do sistema...', 'INFO');
    
    const metrics = await this.collectMetrics();
    
    // Verificar se métricas estão dentro dos limites aceitáveis
    const isHealthy = 
      metrics.successRate >= CONFIG.SUCCESS_THRESHOLD &&
      metrics.errorRate <= CONFIG.ERROR_THRESHOLD &&
      metrics.averageTime <= 30; // 30 segundos máximo

    if (isHealthy) {
      this.log('✅ Sistema está saudável', 'SUCCESS');
    } else {
      this.log('⚠️ Sistema apresenta problemas:', 'WARNING');
      if (metrics.successRate < CONFIG.SUCCESS_THRESHOLD) {
        this.log(`   Taxa de sucesso baixa: ${metrics.successRate.toFixed(1)}% (mín: ${CONFIG.SUCCESS_THRESHOLD}%)`, 'WARNING');
      }
      if (metrics.errorRate > CONFIG.ERROR_THRESHOLD) {
        this.log(`   Taxa de erro alta: ${metrics.errorRate.toFixed(1)}% (máx: ${CONFIG.ERROR_THRESHOLD}%)`, 'WARNING');
      }
      if (metrics.averageTime > 30) {
        this.log(`   Tempo de processamento alto: ${metrics.averageTime.toFixed(1)}s (máx: 30s)`, 'WARNING');
      }
    }

    return { isHealthy, metrics };
  }

  async waitForUserConfirmation(message) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${message} (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async performGradualRollout() {
    this.log('🚀 Iniciando ativação gradual do Payment First Flow', 'INFO');
    
    // Verificar estado atual
    this.currentPercentage = await this.getCurrentRolloutPercentage();
    this.log(`📊 Percentual atual: ${this.currentPercentage}%`, 'INFO');

    // Encontrar próximo step
    const nextSteps = CONFIG.ROLLOUT_STEPS.filter(step => step > this.currentPercentage);
    
    if (nextSteps.length === 0) {
      this.log('✅ Rollout já está em 100%', 'SUCCESS');
      return;
    }

    for (const targetPercentage of nextSteps) {
      this.log(`\n🎯 Preparando para rollout de ${targetPercentage}%`, 'INFO');
      
      // Verificar saúde do sistema antes de continuar
      const healthCheck = await this.checkSystemHealth();
      
      if (!healthCheck.isHealthy) {
        this.log('🚨 Sistema não está saudável. Parando rollout.', 'ERROR');
        
        const shouldContinue = await this.waitForUserConfirmation(
          'Sistema apresenta problemas. Deseja continuar mesmo assim?'
        );
        
        if (!shouldContinue) {
          this.log('🛑 Rollout interrompido pelo usuário', 'WARNING');
          break;
        }
      }

      // Confirmar com usuário
      const shouldProceed = await this.waitForUserConfirmation(
        `Aumentar rollout para ${targetPercentage}%?`
      );
      
      if (!shouldProceed) {
        this.log('🛑 Rollout interrompido pelo usuário', 'WARNING');
        break;
      }

      // Atualizar percentual
      const success = await this.updateRolloutPercentage(targetPercentage);
      
      if (!success) {
        this.log('❌ Falha ao atualizar rollout. Parando.', 'ERROR');
        break;
      }

      // Aguardar período de monitoramento
      this.log(`⏱️ Aguardando ${CONFIG.MONITORING_INTERVAL / 60000} minutos para monitoramento...`, 'INFO');
      
      // Monitoramento em tempo real
      await this.monitorForPeriod(CONFIG.MONITORING_INTERVAL);
      
      // Verificar métricas após período de monitoramento
      const postRolloutHealth = await this.checkSystemHealth();
      
      if (!postRolloutHealth.isHealthy) {
        this.log('🚨 Problemas detectados após rollout!', 'ERROR');
        
        const shouldRollback = await this.waitForUserConfirmation(
          'Detectados problemas. Fazer rollback?'
        );
        
        if (shouldRollback) {
          await this.performEmergencyRollback('Problemas detectados durante ativação gradual');
          break;
        }
      }

      this.log(`✅ Rollout para ${targetPercentage}% concluído com sucesso`, 'SUCCESS');
    }

    // Salvar logs
    fs.writeFileSync(CONFIG.LOG_FILE, this.logEntries.join('\n'));
    this.log(`📄 Logs salvos em: ${CONFIG.LOG_FILE}`, 'INFO');
  }

  async monitorForPeriod(duration) {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    while (Date.now() < endTime) {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      process.stdout.write(`\r⏱️ Monitorando... ${remaining}s restantes`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n');
  }

  async performEmergencyRollback(reason) {
    this.log(`🚨 Executando rollback de emergência: ${reason}`, 'ERROR');
    
    const result = await this.executeCommand(
      `supabase db execute "UPDATE feature_flags SET is_enabled = FALSE, rollout_percentage = 0 WHERE name = '${CONFIG.FEATURE_FLAG_NAME}'"`,
      'Rollback de emergência'
    );

    if (result.success) {
      this.log('✅ Rollback executado com sucesso', 'SUCCESS');
      
      // Registrar no histórico
      await this.executeCommand(
        `supabase db execute "INSERT INTO feature_flag_history (feature_flag_id, action, reason) SELECT id, 'disabled', 'Rollback de emergência: ${reason}' FROM feature_flags WHERE name = '${CONFIG.FEATURE_FLAG_NAME}'"`,
        'Registrar rollback no histórico'
      );
    } else {
      this.log('❌ Falha no rollback de emergência!', 'ERROR');
    }
  }

  async showCurrentStatus() {
    this.log('📊 Status atual do Payment First Flow:', 'INFO');
    
    const percentage = await this.getCurrentRolloutPercentage();
    const health = await this.checkSystemHealth();
    
    this.log(`   Rollout: ${percentage}%`, 'INFO');
    this.log(`   Sistema saudável: ${health.isHealthy ? '✅' : '❌'}`, 'INFO');
    this.log(`   Taxa de sucesso: ${health.metrics.successRate.toFixed(1)}%`, 'INFO');
    this.log(`   Taxa de erro: ${health.metrics.errorRate.toFixed(1)}%`, 'INFO');
    this.log(`   Tempo médio: ${health.metrics.averageTime.toFixed(1)}s`, 'INFO');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new GradualActivationManager();
  
  switch (command) {
    case 'status':
      await manager.showCurrentStatus();
      break;
      
    case 'rollout':
      await manager.performGradualRollout();
      break;
      
    case 'rollback':
      const reason = args[1] || 'Rollback manual';
      await manager.performEmergencyRollback(reason);
      break;
      
    case 'metrics':
      await manager.collectMetrics();
      break;
      
    case 'health':
      const health = await manager.checkSystemHealth();
      process.exit(health.isHealthy ? 0 : 1);
      break;
      
    default:
      console.log('Uso: node gradual-activation.js <comando>');
      console.log('');
      console.log('Comandos disponíveis:');
      console.log('  status   - Mostra status atual do rollout');
      console.log('  rollout  - Inicia ativação gradual interativa');
      console.log('  rollback - Executa rollback de emergência');
      console.log('  metrics  - Coleta e exibe métricas');
      console.log('  health   - Verifica saúde do sistema');
      process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });
}

module.exports = GradualActivationManager;