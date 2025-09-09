#!/usr/bin/env python3
"""
Script para testar conexão direta com Supabase
e verificar se a cobrança realmente existe
"""

from supabase import create_client, Client
import json

# Configurações extraídas do código
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_database_connection():
    """Testa conexão e busca dados reais"""
    try:
        print("🔄 Conectando ao Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Testar conexão básica
        print("✅ Conexão estabelecida!")
        
        # Verificar tabela asaas_cobrancas
        print("\n📋 Verificando tabela asaas_cobrancas...")
        
        # Contar total de registros
        count_response = supabase.table('asaas_cobrancas').select('*', count='exact').execute()
        total_count = count_response.count
        print(f"📊 Total de cobranças: {total_count}")
        
        # Buscar últimas 5 cobranças
        recent_response = supabase.table('asaas_cobrancas').select('*').order('created_at', desc=True).limit(5).execute()
        recent_cobrancas = recent_response.data
        
        print(f"\n🔍 Últimas {len(recent_cobrancas)} cobranças:")
        for i, cobranca in enumerate(recent_cobrancas, 1):
            print(f"  {i}. ID: {cobranca.get('id', 'N/A')}")
            print(f"     Status: {cobranca.get('status', 'N/A')}")
            print(f"     Valor: R$ {cobranca.get('valor', 'N/A')}")
            print(f"     Tipo: {cobranca.get('tipo_cobranca', 'N/A')}")
            print(f"     Criado: {cobranca.get('created_at', 'N/A')}")
            print()
        
        # Buscar cobrança específica do último teste
        test_id = "4f8e2d1c-9b7a-4e3f-8c5d-1a2b3c4d5e6f"
        print(f"🎯 Buscando cobrança específica: {test_id}")
        
        specific_response = supabase.table('asaas_cobrancas').select('*').eq('id', test_id).execute()
        
        if specific_response.data:
            print("✅ Cobrança encontrada!")
            print(json.dumps(specific_response.data[0], indent=2, default=str))
        else:
            print("❌ Cobrança não encontrada!")
            print("🔍 Possíveis causas:")
            print("  - ID não existe na tabela")
            print("  - Problema de RLS (Row Level Security)")
            print("  - Delay na inserção")
        
        # Verificar RLS policies
        print("\n🔒 Verificando políticas RLS...")
        try:
            # Tentar buscar sem filtros (teste de RLS)
            all_response = supabase.table('asaas_cobrancas').select('id').limit(1).execute()
            if all_response.data:
                print("✅ RLS permite leitura")
            else:
                print("⚠️ RLS pode estar bloqueando")
        except Exception as rls_error:
            print(f"❌ Erro de RLS: {rls_error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

if __name__ == "__main__":
    print("🧪 TESTE DE CONEXÃO COM BANCO DE DADOS")
    print("=" * 50)
    test_database_connection()