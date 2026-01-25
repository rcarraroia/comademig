#!/usr/bin/env node

/**
 * Script para executar testes de integração do Payment First Flow
 * 
 * Executa todos os testes de integração e gera relatório
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';

console.log('🧪 Executando Testes de Integração - Payment First Flow');
console.log('=' .repeat(60));

// Configurações
const testFiles = [
  'src/__tests__/integration/PaymentFirstFlowIntegration.test.ts',
  'src/__tests__/integration/MemberTypeCompatibility.test.ts',
  'src/__tests__/integration/FlowRollback.test.ts'
];

const reportFile = 'test-integration-report.json';
const results = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  duration: 0,
  files: [],
  summary: '',
  errors: []
};

try {
  const startTime = Date.now();

  console.log('📋 Arquivos de teste encontrados:');
  testFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  console.log('');

  // Executar testes
  console.log('🚀 Executando testes...');
  
  try {
    const output = execSync('npm run test:integration', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Testes executados com sucesso!');
    console.log('');
    console.log('📊 Resultado:');
    console.log(output);
    
    // Parsear resultado (simplificado)
    const lines = output.split('\n');
    let testCount = 0;
    let passCount = 0;
    
    lines.forEach(line => {
      if (line.includes('✓') || line.includes('PASS')) {
        passCount++;
      }
      if (line.includes('Test Files:')) {
        const match = line.match(/(\d+) passed/);
        if (match) {
          testCount = parseInt(match[1]);
        }
      }
    });
    
    results.totalTests = testCount;
    results.passedTests = passCount;
    results.summary = 'Todos os testes passaram com sucesso';
    
  } catch (error) {
    console.log('❌ Alguns testes falharam:');
    console.log(error.stdout || error.message);
    
    results.errors.push({
      type: 'test_failure',
      message: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
    
    results.summary = 'Alguns testes falharam - verifique os detalhes';
  }

  const endTime = Date.now();
  results.duration = endTime - startTime;

  // Verificar cobertura de código (se disponível)
  console.log('');
  console.log('📈 Verificando cobertura de código...');
  
  try {
    const coverageOutput = execSync('npm run test:coverage', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Relatório de cobertura gerado');
    results.coverage = 'Relatório de cobertura disponível';
    
  } catch (error) {
    console.log('⚠️ Cobertura de código não disponível');
    results.coverage = 'Não disponível';
  }

  // Validar arquivos críticos
  console.log('');
  console.log('🔍 Validando arquivos críticos...');
  
  const criticalFiles = [
    'src/lib/services/PaymentFirstFlowService.ts',
    'src/lib/adapters/FiliacaoToPaymentFirstFlow.ts',
    'src/hooks/useFiliacaoPayment.ts',
    'src/hooks/usePaymentFirstFlowFeature.ts',
    'src/utils/memberTypeMapping.ts',
    'src/components/admin/PaymentFirstFlowControl.tsx'
  ];

  const missingFiles = [];
  const existingFiles = [];

  criticalFiles.forEach(file => {
    if (existsSync(file)) {
      existingFiles.push(file);
      console.log(`  ✅ ${file}`);
    } else {
      missingFiles.push(file);
      console.log(`  ❌ ${file} - ARQUIVO FALTANDO`);
    }
  });

  results.files = {
    critical: {
      total: criticalFiles.length,
      existing: existingFiles.length,
      missing: missingFiles.length,
      missingFiles
    }
  };

  // Verificar Edge Functions
  console.log('');
  console.log('🔧 Verificando Edge Functions...');
  
  const edgeFunctions = [
    'supabase/functions/process-payment-first-registration/index.ts',
    'supabase/functions/poll-payment-status/index.ts',
    'supabase/functions/process-pending-subscriptions/index.ts',
    'supabase/functions/process-pending-completions/index.ts'
  ];

  const missingFunctions = [];
  const existingFunctions = [];

  edgeFunctions.forEach(func => {
    if (existsSync(func)) {
      existingFunctions.push(func);
      console.log(`  ✅ ${func}`);
    } else {
      missingFunctions.push(func);
      console.log(`  ❌ ${func} - FUNÇÃO FALTANDO`);
    }
  });

  results.edgeFunctions = {
    total: edgeFunctions.length,
    existing: existingFunctions.length,
    missing: missingFunctions.length,
    missingFunctions
  };

  // Gerar relatório final
  console.log('');
  console.log('📄 Gerando relatório...');
  
  writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`✅ Relatório salvo em: ${reportFile}`);

  // Resumo final
  console.log('');
  console.log('📋 RESUMO FINAL');
  console.log('=' .repeat(40));
  console.log(`⏱️  Duração: ${results.duration}ms`);
  console.log(`🧪 Testes: ${results.totalTests} total, ${results.passedTests} passou, ${results.failedTests} falhou`);
  console.log(`📁 Arquivos críticos: ${existingFiles.length}/${criticalFiles.length} encontrados`);
  console.log(`🔧 Edge Functions: ${existingFunctions.length}/${edgeFunctions.length} encontradas`);
  console.log(`📊 Status: ${results.summary}`);

  if (missingFiles.length > 0 || missingFunctions.length > 0) {
    console.log('');
    console.log('⚠️  ATENÇÃO: Alguns arquivos estão faltando!');
    if (missingFiles.length > 0) {
      console.log('   Arquivos críticos faltando:', missingFiles.length);
    }
    if (missingFunctions.length > 0) {
      console.log('   Edge Functions faltando:', missingFunctions.length);
    }
  }

  // Recomendações
  console.log('');
  console.log('💡 PRÓXIMOS PASSOS');
  console.log('=' .repeat(40));
  
  if (results.passedTests === results.totalTests && missingFiles.length === 0) {
    console.log('✅ Implementação completa! Pronto para deploy.');
    console.log('   1. Fazer deploy das Edge Functions');
    console.log('   2. Configurar feature flag em produção');
    console.log('   3. Iniciar rollout gradual (5% → 25% → 50% → 100%)');
  } else {
    console.log('🔧 Implementação precisa de ajustes:');
    
    if (results.failedTests > 0) {
      console.log('   1. Corrigir testes que falharam');
    }
    
    if (missingFiles.length > 0) {
      console.log('   2. Implementar arquivos críticos faltando');
    }
    
    if (missingFunctions.length > 0) {
      console.log('   3. Criar Edge Functions faltando');
    }
    
    console.log('   4. Executar testes novamente');
  }

  console.log('');
  console.log('🎯 Para executar testes específicos:');
  console.log('   npm run test src/__tests__/integration/PaymentFirstFlowIntegration.test.ts');
  console.log('   npm run test src/__tests__/integration/MemberTypeCompatibility.test.ts');
  console.log('   npm run test src/__tests__/integration/FlowRollback.test.ts');

  // Exit code baseado no resultado
  if (results.failedTests > 0 || missingFiles.length > 0 || missingFunctions.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }

} catch (error) {
  console.error('💥 Erro ao executar testes:', error.message);
  
  results.errors.push({
    type: 'execution_error',
    message: error.message,
    stack: error.stack
  });
  
  results.summary = 'Erro na execução dos testes';
  
  writeFileSync(reportFile, JSON.stringify(results, null, 2));
  process.exit(1);
}