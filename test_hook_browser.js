// Script para testar o hook no console do navegador
// Abra o DevTools na página /filiacao e cole este código no Console

console.log('🧪 TESTANDO HOOK useMemberTypeWithPlan NO NAVEGADOR');
console.log('=' .repeat(60));

// 1. Verificar se o Supabase está disponível
if (window.supabase) {
    console.log('✅ Supabase client encontrado');
    
    // 2. Testar query direta
    console.log('\n📋 TESTANDO QUERY DIRETA:');
    window.supabase
        .from('member_types')
        .select(`
            id, name, description, sort_order, is_active,
            member_type_subscriptions(
                subscription_plans(
                    id, plan_title, price, recurrence
                )
            )
        `)
        .eq('is_active', true)
        .order('sort_order')
        .then(response => {
            console.log('📊 Resposta da query:', response);
            
            if (response.error) {
                console.error('❌ Erro na query:', response.error);
            } else {
                console.log(`✅ Query retornou ${response.data.length} registros`);
                
                response.data.forEach(item => {
                    const name = item.name;
                    const subs = item.member_type_subscriptions || [];
                    
                    console.log(`   • ${name}:`);
                    if (subs.length > 0) {
                        subs.forEach(sub => {
                            const plan = sub.subscription_plans;
                            if (plan) {
                                console.log(`     - ${plan.plan_title}: R$ ${plan.price}`);
                            }
                        });
                    } else {
                        console.log('     - Nenhum plano associado');
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Erro na promise:', error);
        });
    
    // 3. Testar query simples
    console.log('\n📋 TESTANDO QUERY SIMPLES:');
    window.supabase
        .from('subscription_plans')
        .select('*')
        .then(response => {
            console.log('📊 Planos encontrados:', response.data?.length || 0);
            if (response.data) {
                response.data.forEach(plan => {
                    console.log(`   • ${plan.plan_title}: R$ ${plan.price} (${plan.is_active ? 'ATIVO' : 'INATIVO'})`);
                });
            }
        });
        
} else {
    console.error('❌ Supabase client não encontrado');
    console.log('💡 Certifique-se de estar na página do site');
}

// 4. Verificar se há erros no React Query
console.log('\n📋 VERIFICANDO REACT QUERY:');
if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React Query DevTools disponível');
    console.log('💡 Abra as DevTools do React Query para ver o cache');
} else {
    console.log('⚠️  React Query DevTools não disponível');
}

// 5. Verificar localStorage/cache
console.log('\n📋 VERIFICANDO CACHE:');
const keys = Object.keys(localStorage).filter(key => key.includes('query') || key.includes('member'));
if (keys.length > 0) {
    console.log('🗂️  Chaves relacionadas no localStorage:');
    keys.forEach(key => console.log(`   • ${key}`));
} else {
    console.log('📭 Nenhuma chave relacionada no localStorage');
}

console.log('\n' + '=' .repeat(60));
console.log('✅ TESTE CONCLUÍDO');
console.log('💡 Verifique os resultados acima para identificar o problema');