#!/usr/bin/env python3
"""
Script para verificar estrutura real das tabelas no Supabase
e comparar com o código
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verify_table_structure(supabase: Client, table_name: str):
    """Verifica estrutura de uma tabela"""
    print(f"\n{'='*60}")
    print(f"TABELA: {table_name}")
    print(f"{'='*60}")
    
    try:
        # Buscar um registro para ver os campos
        response = supabase.table(table_name).select('*').limit(1).execute()
        
        if response.data and len(response.data) > 0:
            columns = list(response.data[0].keys())
            print(f"✅ Tabela existe")
            print(f"📊 Total de colunas: {len(columns)}")
            print(f"\n📋 COLUNAS DISPONÍVEIS:")
            for col in sorted(columns):
                value = response.data[0][col]
                value_type = type(value).__name__
                print(f"  - {col:30} (tipo: {value_type})")
        else:
            print(f"⚠️ Tabela existe mas está vazia")
            print(f"Tentando inserir registro de teste para ver estrutura...")
            
    except Exception as e:
        print(f"❌ Erro ao acessar tabela: {str(e)}")

def main():
    print("🔍 VERIFICANDO ESTRUTURA DO BANCO DE DADOS")
    print("="*60)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Tabelas críticas para filiação
    tables = [
        'profiles',
        'subscription_plans',
        'user_subscriptions',
        'member_types'
    ]
    
    for table in tables:
        verify_table_structure(supabase, table)
    
    print(f"\n{'='*60}")
    print("✅ VERIFICAÇÃO CONCLUÍDA")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
