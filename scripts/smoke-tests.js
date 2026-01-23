#!/usr/bin/env node

/**
 * Smoke Tests - Testes básicos para validar funcionalidades críticas
 * Executa testes rápidos para verificar se a aplicação está funcionando
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');

// Simulação de testes básicos (em produção, usar ferramentas como Playwright ou Cypress)
const SMOKE_TESTS = [
  {
    name: 'Verificar se index.html carrega',
    test: () => {
      const indexPath = path.join(DIST_DIR, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Verificar se contém elementos essenciais
      const hasTitle = content.includes('<title>');
      const hasBody = content.includes('<body>');
      const hasRoot = content.includes('id="root"');
      const hasScripts = content.includes('<script');
      
      return hasTitle && hasBody && hasRoot && hasScripts;
    }
  },
  {
    name: 'Verificar se assets JavaScript existem',
    test: () => {
      const assetsDir = path.join(DIST_DIR, 'assets');
      const files = fs.readdirSync(assetsDir);
      const jsFiles = files.filter(file => file.endsWith('.js') && !file.endsWith('.js.map'));
      
      return jsFiles.length > 0;
    }
  },
  {
    name: 'Verificar se assets CSS existem',
    test: () => {
      const assetsDir = path.join(DIST_DIR, 'assets');
      const files = fs.readdirSync(assetsDir);
      const cssFiles = files.filter(file => file.endsWith('.css'));
      
      return cssFiles.length > 0;
    }
  },
  {
    name: 'Verificar se sourcemaps existem',
    test: () => {
      const assetsDir = path.join(DIST_DIR, 'assets');
      const files = fs.readdirSync(assetsDir);
      const sourcemaps = files.filter(file => file.endsWith('.js.map'));
      
      return sourcemaps.length > 0;
    }
  },
  {
    name: 'Verificar se não há arquivos de desenvolvimento',
    test: () => {
      const indexPath = path.join(DIST_DIR, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Não deve conter referências de desenvolvimento
      const hasDevReferences = content.includes('localhost') || 
                              content.includes('127.0.0.1') ||
                              content.includes('dev-server');
      
      return !hasDevReferences;
    }
  },
  {
    name: 'Verificar se arquivos essenciais estão presentes',
    test: () => {
      const essentialFiles = [
        'index.html',
        'favicon.ico',
        'robots.txt',
        '_redirects'
      ];
      
      return essentialFiles.every(file => {
        const filePath = path.join(DIST_DIR, file);
        return fs.existsSync(filePath);
      });
    }
  },
  {
    name: 'Verificar se não há placeholders não substituídos',
    test: () => {
      const indexPath = path.join(DIST_DIR, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Verificar placeholders comuns
      const hasPlaceholders = content.includes('%VITE_') ||
                             content.includes('{{') ||
                             content.includes('__') ||
                             content.includes('PLACEHOLDER');
      
      return !hasPlaceholders;
    }
  }
];

function runSmokeTests() {
  console.log('🧪 Executando smoke tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  const results = [];
  
  for (const test of SMOKE_TESTS) {
    try {
      const result = test.test();
      
      if (result) {
        console.log(`✅ ${test.name}`);
        passedTests++;
        results.push({ name: test.name, status: 'PASS' });
      } else {
        console.log(`❌ ${test.name}`);
        failedTests++;
        results.push({ name: test.name, status: 'FAIL' });
      }
    } catch (error) {
      console.log(`💥 ${test.name} - Erro: ${error.message}`);
      failedTests++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
  }
  
  console.log('\n📊 Resultados dos Smoke Tests:');
  console.log(`✅ Testes aprovados: ${passedTests}`);
  console.log(`❌ Testes falharam: ${failedTests}`);
  console.log(`📈 Taxa de sucesso: ${((passedTests / SMOKE_TESTS.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 Todos os smoke tests passaram!');
    console.log('✅ Aplicação pronta para produção');
    return true;
  } else {
    console.log('\n⚠️ Alguns smoke tests falharam!');
    console.log('❌ Aplicação pode ter problemas em produção');
    
    // Mostrar detalhes dos testes que falharam
    const failedResults = results.filter(r => r.status !== 'PASS');
    if (failedResults.length > 0) {
      console.log('\n🔍 Testes que falharam:');
      failedResults.forEach(result => {
        console.log(`  - ${result.name}: ${result.status}`);
        if (result.error) {
          console.log(`    Erro: ${result.error}`);
        }
      });
    }
    
    return false;
  }
}

function main() {
  console.log('🚀 Iniciando smoke tests para validação de deploy...\n');
  
  // Verificar se o build existe
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Pasta dist não encontrada! Execute npm run build primeiro.');
    process.exit(1);
  }
  
  const success = runSmokeTests();
  
  if (!success) {
    console.log('\n💡 Dicas para resolver problemas:');
    console.log('  1. Execute npm run build novamente');
    console.log('  2. Verifique se todas as variáveis de ambiente estão configuradas');
    console.log('  3. Verifique se não há erros no console durante o build');
    console.log('  4. Execute npm run validate-build para mais detalhes');
    
    process.exit(1);
  }
  
  console.log('\n🚀 Deploy pode prosseguir com segurança!');
}

main();