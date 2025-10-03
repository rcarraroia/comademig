#!/usr/bin/env python3
"""
Script para verificar estrutura detalhada das tabelas Asaas
"""

from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
# Usando service role para bypass RLS durante teste
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE4NDEyNiwiZXhwIjoyMDY4NzYwMTI2fQ._dh56wT2LwNTyh9UlfidztkYnJUGaYV9cr5giOOsA44"

def check_table_structure():
    """Verifica estrutura das tabelas criadas"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔍 VERIFICAÇÃO DA ESTRUTURA DAS TABELAS")
    print("=" * 50)
    
    # Tentar inserir um registro de teste para ver a estrutura
    try:
        # Teste com dados mínimos para ver quais campos são obrigatórios
        test_data = {
            'user_id': '00000000-0000-0000-0000-000000000000',  # UUID fictício para teste
            'asaas_id': 'test_123',
            'customer_id': 'cus_test',
            'valor': 100.00,
            'descricao': 'Teste de estrutura',
            'data_vencimento': '2025-03-15',
            'service_type': 'filiacao'
        }
        
        print("📝 Testando inserção na tabela asaas_cobrancas...")
        response = supabase.table('asaas_cobrancas').insert(test_data).execute()
        
        if response.data:
            print("✅ Inserção bem-sucedida!")
            print("🔧 Estrutura da tabela:")
            for key, value in response.data[0].items():
                print(f"   {key}: {type(value).__name__} = {value}")
            
            # Limpar o teste
            test_id = response.data[0]['id']
            supabase.table('asaas_cobrancas').delete().eq('id', test_id).execute()
            print("🧹 Registro de teste removido")
        
    except Exception as e:
        print(f"❌ Erro durante teste: {e}")
        print("ℹ️  Isso pode indicar campos obrigatórios faltantes ou problemas de RLS")

if __name__ == "__main__":
    check_table_structure()