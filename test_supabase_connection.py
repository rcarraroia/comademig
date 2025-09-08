#!/usr/bin/env python3
"""
Teste de conexão com Supabase
"""

import os
import sys

# Tentar importar supabase
try:
    from supabase import create_client, Client
    print("✅ Biblioteca supabase-py disponível")
except ImportError:
    print("❌ Biblioteca supabase-py não disponível")
    print("Para instalar: pip install supabase")
    sys.exit(1)

# Configurações do Supabase (do arquivo client.ts)
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_connection():
    """Testa conexão com Supabase"""
    try:
        # Criar cliente
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Cliente Supabase criado")
        
        # Testar conexão básica - listar tabelas
        response = supabase.table('member_types').select('*').limit(1).execute()
        
        if response.data is not None:
            print(f"✅ Conexão bem-sucedida! Tabela member_types acessível")
            print(f"📊 Dados encontrados: {len(response.data)} registro(s)")
            if response.data:
                print(f"📋 Primeiro registro: {response.data[0]}")
            return True
        else:
            print("❌ Conexão falhou - sem dados retornados")
            return False
            
    except Exception as e:
        print(f"❌ Erro na conexão: {str(e)}")
        return False

def list_tables():
    """Lista todas as tabelas disponíveis"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Tentar acessar algumas tabelas conhecidas
        tables_to_test = [
            'member_types',
            'subscription_plans', 
            'user_subscriptions',
            'member_type_subscriptions',
            'profiles',
            'asaas_cobrancas',
            'solicitacoes_certidoes'
        ]
        
        print("\n🔍 Testando acesso às tabelas:")
        accessible_tables = []
        
        for table in tables_to_test:
            try:
                response = supabase.table(table).select('*').limit(1).execute()
                count_response = supabase.table(table).select('*', count='exact').execute()
                count = count_response.count if hasattr(count_response, 'count') else 'N/A'
                
                print(f"✅ {table}: {count} registros")
                accessible_tables.append(table)
            except Exception as e:
                print(f"❌ {table}: Erro - {str(e)}")
        
        return accessible_tables
        
    except Exception as e:
        print(f"❌ Erro geral ao listar tabelas: {str(e)}")
        return []

if __name__ == "__main__":
    print("🚀 Iniciando teste de conexão com Supabase...")
    print(f"🔗 URL: {SUPABASE_URL}")
    print(f"🔑 Key: {SUPABASE_KEY[:20]}...")
    
    # Teste básico de conexão
    if test_connection():
        print("\n" + "="*50)
        # Listar tabelas se conexão funcionou
        accessible_tables = list_tables()
        
        print(f"\n📊 Resumo: {len(accessible_tables)} tabelas acessíveis")
        print("✅ Conexão com Supabase FUNCIONANDO!")
    else:
        print("\n❌ Conexão com Supabase FALHOU!")