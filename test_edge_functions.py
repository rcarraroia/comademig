#!/usr/bin/env python3
"""
TESTE DAS EDGE FUNCTIONS DO SUPABASE
Verificar se as funções de pagamento estão funcionando
"""

import json
import requests
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_edge_functions():
    """Testa se as Edge Functions estão disponíveis"""
    print("🔍 TESTE DAS EDGE FUNCTIONS")
    print("-" * 40)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Lista de funções para testar
    functions_to_test = [
        'asaas-create-payment',
        'asaas-create-payment-with-split',
        'asaas-check-payment',
        'asaas-webhook',
        'affiliates-management'
    ]
    
    for function_name in functions_to_test:
        try:
            print(f"📋 Testando função: {function_name}")
            
            # Fazer uma chamada de teste (sem dados válidos, só para ver se responde)
            response = supabase.functions.invoke(function_name, {
                'body': {'test': True}
            })
            
            if response.data:
                print(f"   ✅ Função responde: {function_name}")
                if 'error' in str(response.data):
                    print(f"   ⚠️ Resposta com erro (esperado): {str(response.data)[:100]}...")
                else:
                    print(f"   ✅ Resposta OK: {str(response.data)[:100]}...")
            else:
                print(f"   ❌ Função não responde: {function_name}")
                
        except Exception as e:
            print(f"   ❌ Erro ao chamar {function_name}: {str(e)}")

def test_payment_creation():
    """Testa criação de pagamento com dados válidos"""
    print("\n🔍 TESTE DE CRIAÇÃO DE PAGAMENTO")
    print("-" * 40)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Dados de teste para pagamento
    payment_data = {
        "customer": {
            "name": "Teste Usuario",
            "email": "teste@teste.com",
            "cpfCnpj": "12345678901",
            "phone": "31999999999"
        },
        "billingType": "PIX",
        "value": 39.90,
        "dueDate": "2025-01-15",
        "description": "Teste de Filiação",
        "tipoCobranca": "filiacao"
    }
    
    try:
        print("📋 Chamando asaas-create-payment...")
        response = supabase.functions.invoke('asaas-create-payment', {
            'body': payment_data
        })
        
        print(f"📋 Resposta recebida:")
        if response.data:
            print(f"   Data: {json.dumps(response.data, indent=2)}")
        if response.error:
            print(f"   Error: {response.error}")
            
        # Verificar se foi salvo no banco
        print("\n📋 Verificando se foi salvo no banco...")
        cobrancas = supabase.table('asaas_cobrancas').select('*').execute().data
        print(f"   Total de cobranças após teste: {len(cobrancas)}")
        
        if cobrancas:
            ultima_cobranca = cobrancas[-1]
            print(f"   Última cobrança: {ultima_cobranca['descricao']} - R$ {ultima_cobranca['valor']}")
            
    except Exception as e:
        print(f"❌ Erro no teste: {str(e)}")

def check_asaas_configuration():
    """Verifica se a configuração do Asaas está correta"""
    print("\n🔍 VERIFICAÇÃO DA CONFIGURAÇÃO ASAAS")
    print("-" * 40)
    
    # Verificar se as variáveis de ambiente estão configuradas
    # (não podemos acessar diretamente, mas podemos testar indiretamente)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Tentar uma chamada simples para ver se retorna erro de configuração
    try:
        response = supabase.functions.invoke('asaas-create-payment', {
            'body': {
                "customer": {"name": "Test", "email": "test@test.com", "cpfCnpj": "123"},
                "billingType": "PIX",
                "value": 1,
                "dueDate": "2025-01-15",
                "description": "Test",
                "tipoCobranca": "test"
            }
        })
        
        if response.data:
            if 'ASAAS_API_KEY não configurada' in str(response.data):
                print("❌ ASAAS_API_KEY não está configurada")
            elif 'error' in str(response.data):
                print(f"⚠️ Erro na configuração: {str(response.data)}")
            else:
                print("✅ Configuração parece OK")
        
    except Exception as e:
        print(f"❌ Erro ao verificar configuração: {str(e)}")

def main():
    """Função principal"""
    print("🚀 TESTE COMPLETO DAS EDGE FUNCTIONS")
    print("=" * 50)
    
    # Testes
    test_edge_functions()
    check_asaas_configuration()
    
    # Pergunta se deve fazer teste real
    print("\n" + "="*50)
    print("⚠️ ATENÇÃO: O próximo teste criará uma cobrança real no Asaas!")
    print("Deseja continuar? (Pressione Ctrl+C para cancelar)")
    
    try:
        input("Pressione Enter para continuar ou Ctrl+C para cancelar...")
        test_payment_creation()
    except KeyboardInterrupt:
        print("\n❌ Teste cancelado pelo usuário")

if __name__ == "__main__":
    main()