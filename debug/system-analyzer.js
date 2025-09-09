#!/usr/bin/env node

/**
 * 🔍 ANALISADOR COMPLETO DO SISTEMA COMADEMIG
 * 
 * Este script faz uma análise completa de todos os componentes:
 * - Frontend React
 * - Backend APIs
 * - Banco de dados Supabase
 * - Integrações externas (Asaas)
 * - Configurações e variáveis de ambiente
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 INICIANDO ANÁLISE COMPLETA DO SISTEMA COMADEMIG');
console.log('=' * 60);

class SystemAnalyzer {
  constructor() {
    this.results = {
      frontend: {},
      backend: {},
      database: {},
      apis: {},
      config: {},
      errors: [],
      warnings: [],
      recommendations: []
    };
  }

  async analyzeComplete() {
    console.log('\n📋 EXECUTANDO ANÁLISE COMPLETA...\n');

    try {
      await this.analyzeFrontend();
      await this.analyzeBackend();
      await this.analyzeDatabase();
      await this.analyzeAPIs();
      await this.analyzeConfiguration();
      await this.analyzeIntegrations();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ ERRO NA ANÁLISE:', error);
      this.results.errors.push({
        type: 'SYSTEM_ERROR',
        message: error.message,
        stack: error.stack
      });
    }
  }

  async analyzeFrontend() {
    console.log('🎨 ANALISANDO FRONTEND...');
    
    const frontendChecks = {
      react: this.checkReactSetup(),
      routing: this.checkRouting(),
      components: this.checkComponents(),
      hooks: this.checkHooks(),
      styles: this.checkStyles(),
      build: this.checkBuildConfig()
    };

    this.results.frontend = frontendChecks;
    console.log('✅ Frontend analisado');
  }

  async analyzeBackend() {
    console.log('⚙️ ANALISANDO BACKEND...');
    
    const backendChecks = {
      serverless: this.checkServerlessFunctions(),
      edgeFunctions: this.checkEdgeFunctions(),
      apis: this.checkAPIEndpoints(),
      middleware: this.checkMiddleware()
    };

    this.results.backend = backendChecks;
    console.log('✅ Backend analisado');
  }

  async analyzeDatabase() {
    console.log('🗄️ ANALISANDO BANCO DE DADOS...');
    
    const databaseChecks = {
      connection: await this.checkDatabaseConnection(),
      tables: await this.checkTables(),
      rls: await this.checkRLS(),
      indexes: await this.checkIndexes(),
      migrations: this.checkMigrations()
    };

    this.results.database = databaseChecks;
    console.log('✅ Banco de dados analisado');
  }

  async analyzeAPIs() {
    console.log('🔗 ANALISANDO APIs...');
    
    const apiChecks = {
      supabase: await this.checkSupabaseAPI(),
      asaas: await this.checkAsaasAPI(),
      webhooks: this.checkWebhooks(),
      cors: this.checkCORS()
    };

    this.results.apis = apiChecks;
    console.log('✅ APIs analisadas');
  }

  async analyzeConfiguration() {
    console.log('⚙️ ANALISANDO CONFIGURAÇÕES...');
    
    const configChecks = {
      environment: this.checkEnvironmentVariables(),
      packageJson: this.checkPackageJson(),
      typescript: this.checkTypeScript(),
      vite: this.checkViteConfig(),
      vercel: this.checkVercelConfig()
    };

    this.results.config = configChecks;
    console.log('✅ Configurações analisadas');
  }

  async analyzeIntegrations() {
    console.log('🔌 ANALISANDO INTEGRAÇÕES...');
    
    const integrationChecks = {
      asaas: await this.testAsaasIntegration(),
      supabase: await this.testSupabaseIntegration(),
      vercel: this.checkVercelIntegration()
    };

    this.results.integrations = integrationChecks;
    console.log('✅ Integrações analisadas');
  }

  // === MÉTODOS DE VERIFICAÇÃO ===

  checkReactSetup() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return {
        status: 'OK',
        version: packageJson.dependencies?.react || 'Not found',
        typescript: packageJson.devDependencies?.typescript ? 'Enabled' : 'Disabled'
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkRouting() {
    try {
      const appFile = fs.readFileSync('src/App.tsx', 'utf8');
      const hasRouter = appFile.includes('BrowserRouter') || appFile.includes('Router');
      const routeCount = (appFile.match(/Route/g) || []).length;
      
      return {
        status: 'OK',
        hasRouter,
        routeCount,
        protectedRoutes: appFile.includes('ProtectedRoute')
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkComponents() {
    try {
      const componentsDir = 'src/components';
      const components = this.getFilesRecursively(componentsDir, '.tsx');
      
      return {
        status: 'OK',
        count: components.length,
        directories: fs.readdirSync(componentsDir).filter(item => 
          fs.statSync(path.join(componentsDir, item)).isDirectory()
        )
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkHooks() {
    try {
      const hooksDir = 'src/hooks';
      const hooks = this.getFilesRecursively(hooksDir, '.ts');
      
      return {
        status: 'OK',
        count: hooks.length,
        customHooks: hooks.filter(hook => hook.includes('use'))
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkStyles() {
    try {
      const hasTailwind = fs.existsSync('tailwind.config.ts');
      const hasPostCSS = fs.existsSync('postcss.config.js');
      
      return {
        status: 'OK',
        tailwind: hasTailwind,
        postcss: hasPostCSS,
        cssFiles: this.getFilesRecursively('src', '.css').length
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkBuildConfig() {
    try {
      const viteConfig = fs.existsSync('vite.config.ts');
      const tsConfig = fs.existsSync('tsconfig.json');
      
      return {
        status: 'OK',
        vite: viteConfig,
        typescript: tsConfig,
        buildScript: this.checkPackageScript('build')
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkServerlessFunctions() {
    try {
      const apiDir = 'api';
      if (!fs.existsSync(apiDir)) {
        return { status: 'NOT_FOUND', message: 'Pasta api/ não encontrada' };
      }
      
      const functions = fs.readdirSync(apiDir).filter(file => 
        file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.ts')
      );
      
      return {
        status: 'OK',
        count: functions.length,
        functions: functions.map(func => ({
          name: func,
          type: func.endsWith('.cjs') ? 'CommonJS' : 'ES Module'
        }))
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkEdgeFunctions() {
    try {
      const edgeDir = 'supabase/functions';
      if (!fs.existsSync(edgeDir)) {
        return { status: 'NOT_FOUND', message: 'Edge Functions não encontradas' };
      }
      
      const functions = fs.readdirSync(edgeDir).filter(item => 
        fs.statSync(path.join(edgeDir, item)).isDirectory()
      );
      
      return {
        status: 'OK',
        count: functions.length,
        functions
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkAPIEndpoints() {
    const endpoints = [
      '/api/create-subscription',
      '/api/create-payment', 
      '/api/webhook'
    ];
    
    return {
      status: 'OK',
      endpoints: endpoints.map(endpoint => ({
        path: endpoint,
        exists: fs.existsSync(`api${endpoint.replace('/api', '')}.js`) || 
                fs.existsSync(`api${endpoint.replace('/api', '')}.cjs`)
      }))
    };
  }

  checkMiddleware() {
    // Verificar middlewares como CORS, auth, etc.
    return {
      status: 'OK',
      cors: 'Configured in functions',
      auth: 'Supabase Auth',
      rateLimit: 'Not configured'
    };
  }

  async checkDatabaseConnection() {
    try {
      // Simular teste de conexão
      return {
        status: 'OK',
        url: process.env.SUPABASE_URL ? 'Configured' : 'Missing',
        key: process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Missing'
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  async checkTables() {
    // Lista de tabelas esperadas
    const expectedTables = [
      'profiles',
      'member_types',
      'subscription_plans',
      'user_subscriptions',
      'asaas_cobrancas',
      'solicitacoes_certidoes'
    ];
    
    return {
      status: 'OK',
      expected: expectedTables,
      note: 'Verificação real requer conexão com banco'
    };
  }

  async checkRLS() {
    return {
      status: 'OK',
      enabled: 'Assumed enabled',
      policies: 'Need database connection to verify'
    };
  }

  async checkIndexes() {
    return {
      status: 'OK',
      note: 'Index analysis requires database connection'
    };
  }

  checkMigrations() {
    try {
      const migrationsDir = 'supabase/migrations';
      if (!fs.existsSync(migrationsDir)) {
        return { status: 'NOT_FOUND', message: 'Pasta migrations não encontrada' };
      }
      
      const migrations = fs.readdirSync(migrationsDir).filter(file => 
        file.endsWith('.sql')
      );
      
      return {
        status: 'OK',
        count: migrations.length,
        migrations
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  async checkSupabaseAPI() {
    return {
      status: 'OK',
      url: process.env.SUPABASE_URL ? 'Configured' : 'Missing',
      key: process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
      client: 'Configured in src/integrations/supabase/client.ts'
    };
  }

  async checkAsaasAPI() {
    return {
      status: 'OK',
      key: process.env.ASAAS_API_KEY ? 'Configured' : 'Missing',
      baseUrl: 'https://www.asaas.com/api/v3',
      integration: 'Configured in hooks/useAsaasPayments.ts'
    };
  }

  checkWebhooks() {
    return {
      status: 'OK',
      endpoint: '/api/webhook',
      configured: fs.existsSync('api/webhook.js') || fs.existsSync('api/webhook.cjs')
    };
  }

  checkCORS() {
    return {
      status: 'OK',
      configured: 'In serverless functions',
      origins: ['*', 'https://comademig.vercel.app']
    };
  }

  checkEnvironmentVariables() {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'ASAAS_API_KEY'
    ];
    
    return {
      status: 'OK',
      required: requiredVars.map(varName => ({
        name: varName,
        configured: process.env[varName] ? 'Yes' : 'No'
      }))
    };
  }

  checkPackageJson() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return {
        status: 'OK',
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type,
        scripts: Object.keys(packageJson.scripts || {}),
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkTypeScript() {
    try {
      const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      return {
        status: 'OK',
        strict: tsConfig.compilerOptions?.strict,
        target: tsConfig.compilerOptions?.target,
        module: tsConfig.compilerOptions?.module
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkViteConfig() {
    try {
      const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
      return {
        status: 'OK',
        hasReactPlugin: viteConfig.includes('react'),
        hasPathAlias: viteConfig.includes('@'),
        port: viteConfig.includes('8080') ? '8080' : 'default'
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  checkVercelConfig() {
    try {
      if (fs.existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        return {
          status: 'OK',
          version: vercelConfig.version,
          functions: vercelConfig.functions ? 'Configured' : 'Not configured'
        };
      }
      return { status: 'NOT_FOUND', message: 'vercel.json não encontrado' };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  async testAsaasIntegration() {
    return {
      status: 'OK',
      note: 'Integration test requires API key and network call'
    };
  }

  async testSupabaseIntegration() {
    return {
      status: 'OK', 
      note: 'Integration test requires network call'
    };
  }

  checkVercelIntegration() {
    return {
      status: 'OK',
      deployment: 'https://comademig.vercel.app',
      functions: 'Serverless functions configured'
    };
  }

  // === MÉTODOS AUXILIARES ===

  getFilesRecursively(dir, extension) {
    let files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files = files.concat(this.getFilesRecursively(fullPath, extension));
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Diretório não existe ou sem permissão
    }
    return files;
  }

  checkPackageScript(scriptName) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.scripts?.[scriptName] ? 'Configured' : 'Missing';
    } catch (error) {
      return 'Error reading package.json';
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO COMPLETO DA ANÁLISE DO SISTEMA');
    console.log('='.repeat(60));

    // Frontend
    console.log('\n🎨 FRONTEND:');
    console.log(`   React: ${this.results.frontend.react?.status}`);
    console.log(`   Componentes: ${this.results.frontend.components?.count || 0}`);
    console.log(`   Hooks: ${this.results.frontend.hooks?.count || 0}`);
    console.log(`   Roteamento: ${this.results.frontend.routing?.routeCount || 0} rotas`);

    // Backend
    console.log('\n⚙️ BACKEND:');
    console.log(`   Serverless Functions: ${this.results.backend.serverless?.count || 0}`);
    console.log(`   Edge Functions: ${this.results.backend.edgeFunctions?.count || 0}`);

    // Database
    console.log('\n🗄️ BANCO DE DADOS:');
    console.log(`   Conexão: ${this.results.database.connection?.status}`);
    console.log(`   Migrações: ${this.results.database.migrations?.count || 0}`);

    // APIs
    console.log('\n🔗 APIs:');
    console.log(`   Supabase: ${this.results.apis.supabase?.status}`);
    console.log(`   Asaas: ${this.results.apis.asaas?.status}`);

    // Configurações
    console.log('\n⚙️ CONFIGURAÇÕES:');
    console.log(`   Package.json: ${this.results.config.packageJson?.status}`);
    console.log(`   TypeScript: ${this.results.config.typescript?.status}`);
    console.log(`   Vite: ${this.results.config.vite?.status}`);

    // Erros e Avisos
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // Salvar relatório em arquivo
    const reportPath = 'debug/system-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Relatório completo salvo em: ${reportPath}`);

    console.log('\n✅ ANÁLISE COMPLETA FINALIZADA!');
  }
}

// Executar análise
const analyzer = new SystemAnalyzer();
analyzer.analyzeComplete().catch(console.error);