// Script de debug para testar a Edge Function
// Execute no console do navegador na página de filiação

console.log('=== DEBUG PAYMENT ISSUE ===');

// 1. Verificar se o usuário está logado
const checkAuth = async () => {
    const { data: { user } } = await window.supabase.auth.getUser();
    console.log('Usuário logado:', user ? 'SIM' : 'NÃO');
    console.log('User ID:', user?.id);
    return user;
};

// 2. Testar dados mínimos para pagamento
const testPaymentData = {
    customer: {
        name: "Teste Usuario",
        email: "teste@teste.com",
        cpfCnpj: "12345678901",
        phone: "31999999999",
        city: "Belo Horizonte",
        province: "MG"
    },
    billingType: "PIX",
    value: 39.90,
    dueDate: "2025-01-15",
    description: "Teste de Filiação",
    tipoCobranca: "filiacao"
};

// 3. Testar chamada da Edge Function
const testEdgeFunction = async () => {
    try {
        console.log('Testando Edge Function com dados:', testPaymentData);

        const { data, error } = await window.supabase.functions.invoke('asaas-create-payment', {
            body: testPaymentData
        });

        console.log('Resposta da Edge Function:');
        console.log('Data:', data);
        console.log('Error:', error);

        if (error) {
            console.error('Erro detalhado:', error);
        }

        return { data, error };
    } catch (err) {
        console.error('Erro na chamada:', err);
        return { error: err };
    }
};

// 4. Executar testes
const runTests = async () => {
    console.log('1. Verificando autenticação...');
    const user = await checkAuth();

    if (!user) {
        console.error('❌ Usuário não está logado!');
        return;
    }

    console.log('2. Testando Edge Function...');
    const result = await testEdgeFunction();

    if (result.error) {
        console.error('❌ Erro na Edge Function:', result.error);
    } else {
        console.log('✅ Edge Function funcionou!', result.data);
    }
};

// Executar automaticamente
runTests();

console.log('=== FIM DEBUG ===');
console.log('Para executar novamente: runTests()');