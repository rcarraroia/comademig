// ============================================================================
// DIAGNÓSTICO RÁPIDO VIA CONSOLE
// Execute no console do navegador: window.runQuickDiagnostic()
// ============================================================================

import { diagnosticService } from './diagnostics';

// Função global para diagnóstico rápido
(window as any).runQuickDiagnostic = async () => {
  console.log('🔍 Executando diagnóstico rápido...');
  
  try {
    const report = await diagnosticService.runAllTests();
    
    console.log('📊 RELATÓRIO DE DIAGNÓSTICO');
    console.log('═══════════════════════════');
    console.log(`Status Geral: ${report.overall.toUpperCase()}`);
    console.log(`Total: ${report.summary.total} | Sucessos: ${report.summary.success} | Avisos: ${report.summary.warning} | Erros: ${report.summary.error}`);
    console.log('');
    
    report.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.message}`);
      
      if (result.details && result.status !== 'success') {
        console.log('   Detalhes:', result.details);
      }
    });
    
    console.log('');
    console.log('💡 Para relatório completo, acesse: /dashboard/admin/diagnostics');
    
    return report;
  } catch (error) {
    console.error('❌ Erro ao executar diagnóstico:', error);
    return null;
  }
};

// Função para testar apenas tipos de membro
(window as any).testMemberTypes = async () => {
  console.log('🔍 Testando tipos de membro...');
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('member_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('📋 Tipos de membro encontrados:');
    data?.forEach(type => {
      const status = type.is_active ? '✅ Ativo' : '❌ Inativo';
      console.log(`  ${status} - ${type.name} (${type.description || 'Sem descrição'})`);
    });
    
    const activeTypes = data?.filter(t => t.is_active) || [];
    const hasMinisterial = activeTypes.some(t => ['Pastor', 'Diácono'].includes(t.name));
    
    console.log('');
    console.log(`📊 Resumo: ${activeTypes.length} tipos ativos de ${data?.length || 0} total`);
    console.log(`🎯 Tipos ministeriais (Pastor/Diácono): ${hasMinisterial ? '✅ Encontrados' : '❌ Não encontrados'}`);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao testar tipos de membro:', error);
    return null;
  }
};

// Função para testar conectividade
(window as any).testConnection = async () => {
  console.log('🔍 Testando conectividade...');
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro de conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando');
    console.log(`📊 Total de perfis: ${data?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão:', error);
    return false;
  }
};

console.log('🔧 Funções de diagnóstico carregadas!');
console.log('📋 Comandos disponíveis:');
console.log('  • window.runQuickDiagnostic() - Diagnóstico completo');
console.log('  • window.testMemberTypes() - Testar tipos de membro');
console.log('  • window.testConnection() - Testar conectividade');