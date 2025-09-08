#!/usr/bin/env python3
"""
Teste da Edge Function com Autenticação
Simula uma chamada autenticada para diagnosticar problemas
"""
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Configurações
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_payment_function():
    """Testa a edge function de pagamento com autenticação simulada"""
    
    print("🔍 TESTE DA EDGE FUNCTION COM AUTENTICAÇÃO")
    print("=" * 60)
    
    # Criar cliente Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Dados de teste
    test_payment_data = {
        "customer": {
            "name": "João Silva Teste",
            "email": "joao.teste@email.com",
            "cpfCnpj": "12345678901",
            "phone": "31999999999",
            "city": "Belo Horizonte",
            "province": "MG"
        },
        "billingType": "PIX",
        "value": 50.00,
        "dueDate": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "description": "Teste de Filiação COMADEMIG",
        "tipoCobranca": "filiacao"
    }
    
    print("📋 Dados de teste:")
    print(json.dumps(test_payment_data, indent=2, ensure_ascii=False))
    print()
    
    try:
        print("🚀 Chamando edge function via Supabase client...")
        
        # Tentar chamar a edge function
        response = supabase.functions.invoke('asaas-create-payment', {
            'body': test_payment_data
        })
        
        print(f"📊 Resposta recebida")
        print(f"📄 Data: {response.data}")
        print(f"📄 Error: {response.error}")
        
        if response.error:
            print("❌ ERRO NA EDGE FUNCTION!")
            print(f"   Código: {response.error}")
            
            # Verificar se é erro de configuração
            if 'ASAAS_API_KEY' in str(response.error):
                print("🔑 PROBLEMA: API Key do Asaas não configurada")
            elif 'Não autorizado' in str(response.error):
                print("🔐 PROBLEMA: Erro de autenticação")
            elif 'timeout' in str(response.error).lower():
                print("⏰ PROBLEMA: Timeout na requisição")
            else:
                print("❓ PROBLEMA: Erro desconhecido")
                
        elif response.data:
            if response.data.get('success'):
                print("✅ SUCESSO!")
                cobranca = response.data.get('cobranca', {})
                print(f"💰 Cobrança criada: {cobranca.get('asaas_id')}")
            else:
                print("❌ FALHA!")
                print(f"   Erro: {response.data.get('error')}")
        
    except Exception as e:
        print(f"💥 EXCEÇÃO: {str(e)}")
        
        # Verificar se é problema de conectividade
        if 'connection' in str(e).lower():
            print("🔌 PROBLEMA: Erro de conexão")
        elif 'timeout' in str(e).lower():
            print("⏰ PROBLEMA: Timeout")
        else:
            print("❓ PROBLEMA: Erro inesperado")
    
    # Verificar se a tabela asaas_cobrancas existe
    print("\n🔍 Verificando estrutura do banco...")
    try:
        cobrancas = supabase.table('asaas_cobrancas').select('*', count='exact').limit(1).execute()
        print(f"✅ Tabela 'asaas_cobrancas' existe: {cobrancas.count} registros")
    except Exception as e:
        print(f"❌ Problema com tabela 'asaas_cobrancas': {e}")
    
    print("\n" + "=" * 60)
    print("📋 DIAGNÓSTICO CONCLUÍDO")

if __name__ == "__main__":
    test_payment_function()