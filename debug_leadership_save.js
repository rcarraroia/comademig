// Script de diagnóstico para debug do problema de salvamento
// Execute no console do navegador na página de edição de liderança

console.log('🔍 DIAGNÓSTICO: Problema de salvamento da liderança');

// 1. Verificar se o formulário está funcionando
const form = document.querySelector('form');
console.log('📝 Formulário encontrado:', !!form);

// 2. Verificar botões de salvar
const saveButtons = document.querySelectorAll('button[type="submit"], button:contains("Salvar")');
console.log('💾 Botões de salvar encontrados:', saveButtons.length);
saveButtons.forEach((btn, i) => {
  console.log(`Botão ${i + 1}:`, {
    text: btn.textContent,
    disabled: btn.disabled,
    type: btn.type
  });
});

// 3. Verificar se há erros de validação
const errors = document.querySelectorAll('[class*="text-red"], [class*="error"]');
console.log('❌ Erros de validação encontrados:', errors.length);
errors.forEach((error, i) => {
  console.log(`Erro ${i + 1}:`, error.textContent);
});

// 4. Verificar dados do formulário
const inputs = document.querySelectorAll('input, textarea, select');
console.log('📋 Total de campos:', inputs.length);

// 5. Verificar se há uploads de imagem
const imageUploads = document.querySelectorAll('[class*="upload"], input[type="file"]');
console.log('🖼️ Componentes de upload encontrados:', imageUploads.length);

// 6. Verificar estado do React (se possível)
if (window.React) {
  console.log('⚛️ React detectado');
}

// 7. Verificar se há erros no console
console.log('🚨 Verifique se há erros vermelhos no console acima desta mensagem');

// 8. Verificar network requests
console.log('🌐 Monitore a aba Network para ver se requests estão sendo feitos ao clicar em Salvar');

console.log('✅ Diagnóstico concluído. Agora tente salvar e observe os logs.');