#!/usr/bin/env node

/**
 * Script de validação de build
 * Verifica se o build foi criado corretamente e se a aplicação pode ser carregada
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const REQUIRED_FILES = [
  'index.html',
  'assets'
];

const REQUIRED_ASSETS = [
  '.js',
  '.css',
  '.js.map'
];

function validateBuildExists() {
  console.log('🔍 Verificando se o build existe...');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Pasta dist não encontrada!');
    process.exit(1);
  }
  
  console.log('✅ Pasta dist encontrada');
}

function validateRequiredFiles() {
  console.log('🔍 Verificando arquivos obrigatórios...');
  
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo obrigatório não encontrado: ${file}`);
      process.exit(1);
    }
    console.log(`✅ ${file} encontrado`);
  }
}

function validateAssets() {
  console.log('🔍 Verificando assets...');
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Pasta assets não encontrada!');
    process.exit(1);
  }
  
  const files = fs.readdirSync(assetsDir);
  
  for (const extension of REQUIRED_ASSETS) {
    const hasFile = files.some(file => file.endsWith(extension));
    if (!hasFile) {
      console.error(`❌ Nenhum arquivo ${extension} encontrado em assets/`);
      process.exit(1);
    }
    console.log(`✅ Arquivos ${extension} encontrados`);
  }
  
  // Verificar se sourcemaps foram gerados
  const sourcemaps = files.filter(file => file.endsWith('.js.map'));
  if (sourcemaps.length === 0) {
    console.error('❌ Nenhum sourcemap encontrado!');
    process.exit(1);
  }
  console.log(`✅ ${sourcemaps.length} sourcemap(s) encontrado(s)`);
}

function validateIndexHtml() {
  console.log('🔍 Verificando index.html...');
  
  const indexPath = path.join(DIST_DIR, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Verificar se contém referências aos assets
  if (!content.includes('<script') || !content.includes('<link')) {
    console.error('❌ index.html não contém referências aos assets!');
    process.exit(1);
  }
  
  // Verificar se não há placeholders não substituídos
  if (content.includes('%VITE_') || content.includes('{{')) {
    console.error('❌ index.html contém placeholders não substituídos!');
    process.exit(1);
  }
  
  console.log('✅ index.html válido');
}

function validateBuildSize() {
  console.log('🔍 Verificando tamanho do build...');
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  
  files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    
    totalSize += size;
    
    if (file.endsWith('.js') && !file.endsWith('.js.map')) {
      jsSize += size;
    } else if (file.endsWith('.css')) {
      cssSize += size;
    }
  });
  
  const totalMB = (totalSize / 1024 / 1024).toFixed(2);
  const jsMB = (jsSize / 1024 / 1024).toFixed(2);
  const cssMB = (cssSize / 1024 / 1024).toFixed(2);
  
  console.log(`📊 Tamanho total dos assets: ${totalMB} MB`);
  console.log(`📊 JavaScript: ${jsMB} MB`);
  console.log(`📊 CSS: ${cssMB} MB`);
  
  // Alertar se o build estiver muito grande
  if (totalSize > 10 * 1024 * 1024) { // 10MB
    console.warn(`⚠️ Build muito grande (${totalMB} MB). Considere otimizações.`);
  }
  
  console.log('✅ Análise de tamanho concluída');
}

function main() {
  console.log('🚀 Iniciando validação do build...\n');
  
  try {
    validateBuildExists();
    validateRequiredFiles();
    validateAssets();
    validateIndexHtml();
    validateBuildSize();
    
    console.log('\n🎉 Build validado com sucesso!');
    console.log('✅ Todos os arquivos necessários estão presentes');
    console.log('✅ Sourcemaps foram gerados para debugging');
    console.log('✅ index.html está correto');
    console.log('✅ Build pronto para deploy');
    
  } catch (error) {
    console.error('\n💥 Erro durante a validação:', error.message);
    process.exit(1);
  }
}

main();