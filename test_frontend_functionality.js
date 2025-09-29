// Script para testar funcionalidades do frontend
// Execute no console do navegador na página /dashboard/admin/subscriptions

console.log('🧪 TESTE DE FUNCIONALIDADE DO FRONTEND');
console.log('=====================================');

// 1. Verificar se os componentes estão carregados
console.log('\n📋 VERIFICAÇÃO DE COMPONENTES:');
console.log('- SubscriptionsManagement:', document.querySelector('[data-testid="subscriptions-management"]') ? '✅ Carregado' : '⚠️ Não encontrado');
console.log('- Botão Novo Plano:', document.querySelector('button:contains("Novo Plano")') ? '✅ Presente' : '⚠️ Não encontrado');

// 2. Verificar se há erros no console
console.log('\n🚨 VERIFICAÇÃO DE ERROS:');
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  errors.push(args.join(' '));
  originalError.apply(console, args);
};

// 3. Verificar se os hooks estão funcionando
console.log('\n🔗 VERIFICAÇÃO DE HOOKS:');
try {
  // Simular chamada do hook
  fetch('/api/subscription-plans')
    .then(response => {
      console.log('- API Response Status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('- Dados recebidos:', data ? '✅ Sucesso' : '❌ Vazio');
    })
    .catch(error => {
      console.log('- Erro na API:', error.message);
    });
} catch (e) {
  console.log('- Erro ao testar API:', e.message);
}

// 4. Verificar localStorage/sessionStorage
console.log('\n💾 VERIFICAÇÃO DE STORAGE:');
console.log('- Auth Token:', localStorage.getItem('supabase.auth.token') ? '✅ Presente' : '❌ Ausente');
console.log('- Session:', sessionStorage.length > 0 ? '✅ Ativa' : '❌ Vazia');

// 5. Verificar se Supabase está conectado
console.log('\n🔌 VERIFICAÇÃO DE CONEXÃO:');
if (window.supabase) {
  console.log('- Supabase Client:', '✅ Carregado');
  window.supabase.from('subscription_plans').select('count').then(result => {
    console.log('- Conexão DB:', result.error ? '❌ Erro: ' + result.error.message : '✅ Conectado');
  });
} else {
  console.log('- Supabase Client:', '❌ Não encontrado');
}

// 6. Aguardar e reportar erros
setTimeout(() => {
  console.log('\n📊 RESUMO DOS ERROS:');
  if (errors.length === 0) {
    console.log('✅ Nenhum erro encontrado!');
  } else {
    console.log('❌ Erros encontrados:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verifique se a página carrega sem erros');
  console.log('2. Teste o botão "Novo Plano"');
  console.log('3. Verifique se a listagem aparece (mesmo vazia)');
  console.log('4. Teste a criação de um plano de exemplo');
  
}, 3000);

console.log('\n⏳ Aguardando 3 segundos para coletar erros...');