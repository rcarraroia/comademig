// Script de debug para executar no console do navegador
console.log('=== DEBUG FRONTEND ===');

// 1. Verificar se React está carregado
console.log('1. React:', typeof React !== 'undefined' ? '✅ Carregado' : '❌ Não encontrado');

// 2. Verificar se os componentes estão sendo renderizados
console.log('2. Verificando elementos na página:');
console.log('   - Botão "Criar Tipo + Plano":', document.querySelector('button:contains("Criar Tipo + Plano")') ? '✅ Encontrado' : '❌ Não encontrado');
console.log('   - Botão "Apenas Tipo":', document.querySelector('button:contains("Apenas Tipo")') ? '✅ Encontrado' : '❌ Não encontrado');
console.log('   - Botão "Novo Tipo":', document.querySelector('button:contains("Novo Tipo")') ? '✅ Encontrado' : '❌ Não encontrado');

// 3. Verificar se há erros no console
console.log('3. Erros no console:');
const errors = [];
const originalError = console.error;
console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
};

// 4. Verificar se os hooks estão funcionando
console.log('4. Testando hooks:');
try {
    // Simular chamada do hook
    fetch('/api/member-types')
        .then(response => console.log('   - API member-types:', response.ok ? '✅ OK' : '❌ Erro'))
        .catch(error => console.log('   - API member-types:', '❌ Erro -', error.message));
} catch (e) {
    console.log('   - Erro ao testar API:', e.message);
}

// 5. Verificar se o componente MemberTypesManagement está montado
console.log('5. Componente MemberTypesManagement:');
const memberTypesTitle = document.querySelector('h1:contains("Tipos de Membro")');
console.log('   - Título encontrado:', memberTypesTitle ? '✅ Sim' : '❌ Não');

// 6. Verificar se há elementos com classes específicas
console.log('6. Elementos específicos:');
console.log('   - Cards de estatísticas:', document.querySelectorAll('[class*="card"]').length, 'encontrados');
console.log('   - Botões:', document.querySelectorAll('button').length, 'encontrados');
console.log('   - Inputs:', document.querySelectorAll('input').length, 'encontrados');

// 7. Verificar se há modais
console.log('7. Modais:');
console.log('   - Modais abertos:', document.querySelectorAll('[class*="modal"], [class*="dialog"]').length);

console.log('=== FIM DEBUG ===');