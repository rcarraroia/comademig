#!/usr/bin/env node

/**
 * 💳 ANALISADOR DE FLUXO DE PAGAMENTOS
 * 
 * Analisa especificamente o fluxo completo de pagamentos:
 * - Frontend: Formulários, hooks, componentes
 * - Backend: APIs, Edge Functions, Serverless
 * - Integrações: Asaas, Supabase
 * - Fluxo: Filiação, Certidões, Regularização
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('💳 ANALISANDO FLUXO COMPLETO DE PAGAMENTOS');
console.log('=' * 50);

class PaymentFlowAnalyzer {
  constructor() {
    this.results = {
      frontend: {},
      backend: {},
      integrations: {},
      flows: {},
      issues: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('\n📋 EXECUTANDO ANÁLISE DO FLUXO DE PAGAMENTOS...\n');

    try {
      this.analyzeFrontendPayments();
      this.analyzeBackendPayments();
      this.analyzePaymentIntegrations();
      this.analyzePaymentFlows();
      this.detectIssues();
      
      this.generatePaymentReport();
      
    } catch (error) {
      console.error('❌ ERRO NA ANÁLISE DE PAGAMENTOS:', error);
      this.results.issues.push({
        type: 'ANALYSIS_ERROR',
        severity: 'HIGH',
        message: error.message
      });
    }
  }

  analyzeFrontendPayments() {
    console.log('🎨 ANALISANDO FRONTEND DE PAGAMENTOS...');

    // Analisar componentes de pagamento
    const paymentComponents = this.findPaymentComponents();
    
    // Analisar hooks de pagamento
    const paymentHooks = this.findPaymentHooks();
    
    // Analisar formulários
    const paymentForms = this.findPaymentForms();
    
    // Analisar páginas de checkout
    const checkoutPages = this.findCheckoutPages();

    this.results.frontend = {
      components: paymentComponents,
      hooks: paymentHooks,
      forms: paymentForms,
      checkout: checkoutPages
    };

    console.log('✅ Frontend de pagamentos analisado');
  }

  analyzeBackendPayments() {
    console.log('⚙️ ANALISANDO BACKEND DE PAGAMENTOS...');

    // Analisar APIs serverless
    const serverlessAPIs = this.findServerlessPaymentAPIs();
    
    // Analisar Edge Functions
    const edgeFunctions = this.findPaymentEdgeFunctions();
    
    // Analisar webhooks
    const webhooks = this.findPaymentWebhooks();

    this.results.backend = {
      serverless: serverlessAPIs,
      edgeFunctions: edgeFunctions,
      webhooks: webhooks
    };

    console.log('✅ Backend de pagamentos analisado');
  }

  analyzePaymentIntegrations() {
    console.log('🔌 ANALISANDO INTEGRAÇÕES DE PAGAMENTO...');

    // Analisar integração Asaas
    const asaasIntegration = this.analyzeAsaasIntegration();
    
    // Analisar integração Supabase
    const supabaseIntegration = this.analyzeSupabasePaymentIntegration();

    this.results.integrations = {
      asaas: asaasIntegration,
      supabase: supabaseIntegration
    };

    console.log('✅ Integrações de pagamento analisadas');
  }

  analyzePaymentFlows() {
    console.log('🔄 ANALISANDO FLUXOS DE PAGAMENTO...');

    const flows = {
      filiacao: this.analyzeFiliacaoFlow(),
      certidoes: this.analyzeCertidoesFlow(),
      regularizacao: this.analyzeRegularizacaoFlow(),
      checkout: this.analyzeCheckoutFlow()
    };

    this.results.flows = flows;

    console.log('✅ Fluxos de pagamento analisados');
  }

  // === MÉTODOS DE ANÁLISE ESPECÍFICOS ===

  findPaymentComponents() {
    const components = [];
    const componentDirs = ['src/components/payments', 'src/components'];
    
    componentDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getFilesRecursively(dir, '.tsx');
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (this.isPaymentComponent(content)) {
            components.push({
              file: file,
              type: this.getComponentType(content),
              hasAsaasIntegration: content.includes('asaas') || content.includes('Asaas'),
              hasSupabaseIntegration: content.includes('supabase'),
              hasFormValidation: content.includes('zod') || content.includes('yup'),
              hasErrorHandling: content.includes('try') && content.includes('catch')
            });
          }
        });
      }
    });

    return {
      count: components.length,
      components: components
    };
  }

  findPaymentHooks() {
    const hooks = [];
    const hooksDir = 'src/hooks';
    
    if (fs.existsSync(hooksDir)) {
      const files = this.getFilesRecursively(hooksDir, '.ts');
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (this.isPaymentHook(content)) {
          hooks.push({
            file: file,
            name: path.basename(file, '.ts'),
            hasAsaasIntegration: content.includes('asaas') || content.includes('Asaas'),
            hasSupabaseIntegration: content.includes('supabase'),
            hasErrorHandling: content.includes('try') && content.includes('catch'),
            exports: this.extractExports(content)
          });
        }
      });
    }

    return {
      count: hooks.length,
      hooks: hooks
    };
  }

  findPaymentForms() {
    const forms = [];
    const srcDir = 'src';
    
    if (fs.existsSync(srcDir)) {
      const files = this.getFilesRecursively(srcDir, '.tsx');
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (this.isPaymentForm(content)) {
          forms.push({
            file: file,
            hasValidation: content.includes('zod') || content.includes('yup'),
            hasSubmitHandler: content.includes('onSubmit') || content.includes('handleSubmit'),
            hasPaymentMethods: content.includes('PIX') || content.includes('CREDIT_CARD'),
            hasErrorHandling: content.includes('try') && content.includes('catch')
          });
        }
      });
    }

    return {
      count: forms.length,
      forms: forms
    };
  }

  findCheckoutPages() {
    const checkoutPages = [];
    const pagesDir = 'src/pages';
    
    if (fs.existsSync(pagesDir)) {
      const files = this.getFilesRecursively(pagesDir, '.tsx');
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (this.isCheckoutPage(content)) {
          checkoutPages.push({
            file: file,
            name: path.basename(file, '.tsx'),
            hasPaymentProcessing: content.includes('payment') || content.includes('Payment'),
            hasRedirection: content.includes('navigate') || content.includes('redirect'),
            hasErrorHandling: content.includes('try') && content.includes('catch')
          });
        }
      });
    }

    return {
      count: checkoutPages.length,
      pages: checkoutPages
    };
  }

  findServerlessPaymentAPIs() {
    const apis = [];
    const apiDir = 'api';
    
    if (fs.existsSync(apiDir)) {
      const files = fs.readdirSync(apiDir);
      files.forEach(file => {
        if (this.isPaymentAPI(file)) {
          const content = fs.readFileSync(path.join(apiDir, file), 'utf8');
          apis.push({
            file: file,
            type: this.getAPIType(file),
            hasAsaasIntegration: content.includes('asaas') || content.includes('Asaas'),
            hasSupabaseIntegration: content.includes('supabase'),
            hasCORS: content.includes('Access-Control-Allow-Origin'),
            hasErrorHandling: content.includes('try') && content.includes('catch'),
            moduleType: file.endsWith('.cjs') ? 'CommonJS' : 'ES Module'
          });
        }
      });
    }

    return {
      count: apis.length,
      apis: apis
    };
  }

  findPaymentEdgeFunctions() {
    const functions = [];
    const edgeDir = 'supabase/functions';
    
    if (fs.existsSync(edgeDir)) {
      const dirs = fs.readdirSync(edgeDir).filter(item => 
        fs.statSync(path.join(edgeDir, item)).isDirectory()
      );
      
      dirs.forEach(dir => {
        if (this.isPaymentEdgeFunction(dir)) {
          const indexFile = path.join(edgeDir, dir, 'index.ts');
          if (fs.existsSync(indexFile)) {
            const content = fs.readFileSync(indexFile, 'utf8');
            functions.push({
              name: dir,
              file: indexFile,
              hasAsaasIntegration: content.includes('asaas') || content.includes('Asaas'),
              hasSupabaseIntegration: content.includes('supabase'),
              hasCORS: content.includes('Access-Control-Allow-Origin'),
              hasErrorHandling: content.includes('try') && content.includes('catch')
            });
          }
        }
      });
    }

    return {
      count: functions.length,
      functions: functions
    };
  }

  findPaymentWebhooks() {
    const webhooks = [];
    
    // Verificar webhook serverless
    if (fs.existsSync('api/webhook.js') || fs.existsSync('api/webhook.cjs')) {
      const file = fs.existsSync('api/webhook.js') ? 'api/webhook.js' : 'api/webhook.cjs';
      const content = fs.readFileSync(file, 'utf8');
      
      webhooks.push({
        type: 'serverless',
        file: file,
        hasEventHandling: content.includes('event'),
        hasAsaasIntegration: content.includes('asaas') || content.includes('Asaas'),
        hasSupabaseIntegration: content.includes('supabase'),
        hasErrorHandling: content.includes('try') && content.includes('catch')
      });
    }

    return {
      count: webhooks.length,
      webhooks: webhooks
    };
  }

  analyzeAsaasIntegration() {
    const integration = {
      configured: false,
      apiKey: process.env.ASAAS_API_KEY ? 'Configured' : 'Missing',
      baseUrl: 'https://www.asaas.com/api/v3',
      endpoints: [],
      issues: []
    };

    // Verificar hook useAsaasPayments
    const hookFile = 'src/hooks/useAsaasPayments.ts';
    if (fs.existsSync(hookFile)) {
      const content = fs.readFileSync(hookFile, 'utf8');
      integration.configured = true;
      integration.hasCreatePayment = content.includes('createPayment');
      integration.hasCheckStatus = content.includes('checkPaymentStatus');
      integration.hasErrorHandling = content.includes('try') && content.includes('catch');
      
      // Verificar endpoints usados
      if (content.includes('create-subscription')) integration.endpoints.push('create-subscription');
      if (content.includes('create-payment')) integration.endpoints.push('create-payment');
    } else {
      integration.issues.push('Hook useAsaasPayments não encontrado');
    }

    return integration;
  }

  analyzeSupabasePaymentIntegration() {
    const integration = {
      configured: false,
      url: process.env.SUPABASE_URL ? 'Configured' : 'Missing',
      key: process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
      tables: [],
      issues: []
    };

    // Verificar cliente Supabase
    const clientFile = 'src/integrations/supabase/client.ts';
    if (fs.existsSync(clientFile)) {
      integration.configured = true;
      
      // Verificar tabelas de pagamento esperadas
      const expectedTables = ['asaas_cobrancas', 'user_subscriptions'];
      integration.tables = expectedTables;
    } else {
      integration.issues.push('Cliente Supabase não encontrado');
    }

    return integration;
  }

  analyzeFiliacaoFlow() {
    const flow = {
      page: 'src/pages/Filiacao.tsx',
      exists: fs.existsSync('src/pages/Filiacao.tsx'),
      components: [],
      issues: []
    };

    if (flow.exists) {
      const content = fs.readFileSync('src/pages/Filiacao.tsx', 'utf8');
      flow.hasPaymentForm = content.includes('PaymentForm');
      flow.hasRedirection = content.includes('navigate') || content.includes('redirect');
      flow.hasErrorHandling = content.includes('try') && content.includes('catch');
      flow.usesAsaasHook = content.includes('useAsaasPayments');
    } else {
      flow.issues.push('Página de filiação não encontrada');
    }

    return flow;
  }

  analyzeCertidoesFlow() {
    const flow = {
      page: 'src/pages/dashboard/Certidoes.tsx',
      exists: fs.existsSync('src/pages/dashboard/Certidoes.tsx'),
      components: [],
      issues: []
    };

    if (flow.exists) {
      const content = fs.readFileSync('src/pages/dashboard/Certidoes.tsx', 'utf8');
      flow.hasPaymentIntegration = content.includes('payment') || content.includes('Payment');
      flow.hasCheckout = content.includes('checkout') || content.includes('Checkout');
      flow.hasErrorHandling = content.includes('try') && content.includes('catch');
    } else {
      flow.issues.push('Página de certidões não encontrada');
    }

    return flow;
  }

  analyzeRegularizacaoFlow() {
    const flow = {
      page: 'src/pages/dashboard/Regularizacao.tsx',
      exists: fs.existsSync('src/pages/dashboard/Regularizacao.tsx'),
      components: [],
      issues: []
    };

    if (flow.exists) {
      const content = fs.readFileSync('src/pages/dashboard/Regularizacao.tsx', 'utf8');
      flow.hasPaymentIntegration = content.includes('payment') || content.includes('Payment');
      flow.hasCheckout = content.includes('checkout') || content.includes('Checkout');
      flow.hasErrorHandling = content.includes('try') && content.includes('catch');
    } else {
      flow.issues.push('Página de regularização não encontrada');
    }

    return flow;
  }

  analyzeCheckoutFlow() {
    const flow = {
      page: 'src/pages/Checkout.tsx',
      exists: fs.existsSync('src/pages/Checkout.tsx'),
      components: [],
      issues: []
    };

    if (flow.exists) {
      const content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');
      flow.hasPaymentProcessing = content.includes('payment') || content.includes('Payment');
      flow.hasAsaasIntegration = content.includes('asaas') || content.includes('Asaas');
      flow.hasSupabaseIntegration = content.includes('supabase');
      flow.hasErrorHandling = content.includes('try') && content.includes('catch');
    } else {
      flow.issues.push('Página de checkout não encontrada');
    }

    return flow;
  }

  detectIssues() {
    console.log('🔍 DETECTANDO PROBLEMAS NO FLUXO DE PAGAMENTOS...');

    // Verificar problemas comuns
    this.checkMissingComponents();
    this.checkConfigurationIssues();
    this.checkIntegrationIssues();
    this.checkFlowIssues();

    console.log(`⚠️ ${this.results.issues.length} problemas detectados`);
  }

  checkMissingComponents() {
    // Verificar componentes essenciais
    const essentialFiles = [
      'src/hooks/useAsaasPayments.ts',
      'src/pages/Checkout.tsx',
      'src/pages/Filiacao.tsx'
    ];

    essentialFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.results.issues.push({
          type: 'MISSING_COMPONENT',
          severity: 'HIGH',
          message: `Arquivo essencial não encontrado: ${file}`
        });
      }
    });
  }

  checkConfigurationIssues() {
    // Verificar configurações
    if (!process.env.ASAAS_API_KEY) {
      this.results.issues.push({
        type: 'MISSING_CONFIG',
        severity: 'HIGH',
        message: 'ASAAS_API_KEY não configurada'
      });
    }

    if (!process.env.SUPABASE_URL) {
      this.results.issues.push({
        type: 'MISSING_CONFIG',
        severity: 'HIGH',
        message: 'SUPABASE_URL não configurada'
      });
    }
  }

  checkIntegrationIssues() {
    // Verificar problemas de integração
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.type === 'module' && fs.existsSync('api/create-subscription.js')) {
      this.results.issues.push({
        type: 'MODULE_CONFLICT',
        severity: 'HIGH',
        message: 'Conflito ES Module/CommonJS nas funções serverless'
      });
    }
  }

  checkFlowIssues() {
    // Verificar problemas nos fluxos
    Object.entries(this.results.flows).forEach(([flowName, flow]) => {
      if (flow.issues && flow.issues.length > 0) {
        flow.issues.forEach(issue => {
          this.results.issues.push({
            type: 'FLOW_ISSUE',
            severity: 'MEDIUM',
            flow: flowName,
            message: issue
          });
        });
      }
    });
  }

  // === MÉTODOS AUXILIARES ===

  isPaymentComponent(content) {
    const paymentKeywords = ['payment', 'Payment', 'pagamento', 'cobranca', 'asaas', 'checkout'];
    return paymentKeywords.some(keyword => content.includes(keyword));
  }

  isPaymentHook(content) {
    const hookKeywords = ['payment', 'Payment', 'asaas', 'Asaas', 'cobranca'];
    return hookKeywords.some(keyword => content.includes(keyword));
  }

  isPaymentForm(content) {
    const formKeywords = ['PaymentForm', 'payment', 'billingType', 'PIX', 'CREDIT_CARD'];
    return formKeywords.some(keyword => content.includes(keyword));
  }

  isCheckoutPage(content) {
    const checkoutKeywords = ['checkout', 'Checkout', 'payment', 'Payment', 'cobranca'];
    return checkoutKeywords.some(keyword => content.includes(keyword));
  }

  isPaymentAPI(filename) {
    const paymentAPIs = ['create-subscription', 'create-payment', 'webhook', 'process-pix', 'process-card'];
    return paymentAPIs.some(api => filename.includes(api));
  }

  isPaymentEdgeFunction(dirname) {
    const paymentFunctions = ['asaas-create-payment', 'asaas-create-subscription', 'asaas-process'];
    return paymentFunctions.some(func => dirname.includes(func));
  }

  getComponentType(content) {
    if (content.includes('PaymentForm')) return 'Form';
    if (content.includes('Checkout')) return 'Checkout';
    if (content.includes('Modal')) return 'Modal';
    return 'Component';
  }

  getAPIType(filename) {
    if (filename.includes('subscription')) return 'Subscription';
    if (filename.includes('payment')) return 'Payment';
    if (filename.includes('webhook')) return 'Webhook';
    return 'API';
  }

  extractExports(content) {
    const exports = [];
    const exportMatches = content.match(/export\s+(?:const|function)\s+(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const name = match.match(/(\w+)$/)[1];
        exports.push(name);
      });
    }
    return exports;
  }

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

  generatePaymentReport() {
    console.log('\n' + '='.repeat(60));
    console.log('💳 RELATÓRIO DE ANÁLISE DE PAGAMENTOS');
    console.log('='.repeat(60));

    // Frontend
    console.log('\n🎨 FRONTEND:');
    console.log(`   Componentes de Pagamento: ${this.results.frontend.components?.count || 0}`);
    console.log(`   Hooks de Pagamento: ${this.results.frontend.hooks?.count || 0}`);
    console.log(`   Formulários: ${this.results.frontend.forms?.count || 0}`);
    console.log(`   Páginas de Checkout: ${this.results.frontend.checkout?.count || 0}`);

    // Backend
    console.log('\n⚙️ BACKEND:');
    console.log(`   APIs Serverless: ${this.results.backend.serverless?.count || 0}`);
    console.log(`   Edge Functions: ${this.results.backend.edgeFunctions?.count || 0}`);
    console.log(`   Webhooks: ${this.results.backend.webhooks?.count || 0}`);

    // Integrações
    console.log('\n🔌 INTEGRAÇÕES:');
    console.log(`   Asaas: ${this.results.integrations.asaas?.configured ? 'Configurada' : 'Não configurada'}`);
    console.log(`   Supabase: ${this.results.integrations.supabase?.configured ? 'Configurada' : 'Não configurada'}`);

    // Fluxos
    console.log('\n🔄 FLUXOS:');
    Object.entries(this.results.flows).forEach(([name, flow]) => {
      console.log(`   ${name}: ${flow.exists ? 'Existe' : 'Não encontrado'}`);
    });

    // Problemas
    if (this.results.issues.length > 0) {
      console.log('\n❌ PROBLEMAS DETECTADOS:');
      this.results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity}] ${issue.type}: ${issue.message}`);
      });
    }

    // Salvar relatório
    const reportPath = 'debug/payment-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Relatório de pagamentos salvo em: ${reportPath}`);

    console.log('\n✅ ANÁLISE DE PAGAMENTOS FINALIZADA!');
  }
}

// Executar análise
const analyzer = new PaymentFlowAnalyzer();
analyzer.analyze().catch(console.error);