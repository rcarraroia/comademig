#!/usr/bin/env python3
"""
Script para verificar quais migrações do Asaas ainda faltam
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE4NDEyNiwiZXhwIjoyMDY4NzYwMTI2fQ._dh56wT2LwNTyh9UlfidztkYnJUGaYV9cr5giOOsA44"

def check_table_exists(supabase: Client, table_name: str) -> dict:
    """Verifica se uma tabela existe e retorna informações sobre ela"""
    try:
        # Tentar fazer uma query simples na tabela
        response = supabase.table(table_name).select('*').limit(1).execute()
        
        # Se chegou até aqui, a tabela existe
        count_response = supabase.table(table_name).select('*', count='exact').execute()
        
        return {
            'exists': True,
            'count': count_response.count,
            'error': None
        }
    except Exception as e:
        return {
            'exists': False,
            'count': 0,
            'error': str(e)
        }

def main():
    """Função principal"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Tabelas necessárias para integração Asaas
    required_tables = {
        'asaas_customers': 'Clientes Asaas',
        'asaas_cobrancas': 'Cobranças/Pagamentos',
        'asaas_splits': 'Splits de Pagamento',
        'asaas_webhooks': 'Log de Webhooks'
    }
    
    print("🔍 VERIFICANDO MIGRAÇÕES DO ASAAS")
    print("=" * 50)
    
    existing_tables = []
    missing_tables = []
    
    for table_name, description in required_tables.items():
        result = check_table_exists(supabase, table_name)
        
        if result['exists']:
            print(f"✅ {table_name} ({description})")
            print(f"   📊 Registros: {result['count']}")
            existing_tables.append(table_name)
        else:
            print(f"❌ {table_name} ({description})")
            print(f"   🚨 Erro: {result['error']}")
            missing_tables.append(table_name)
        print()
    
    print("📋 RESUMO:")
    print(f"✅ Tabelas existentes: {len(existing_tables)}/4")
    print(f"❌ Tabelas faltando: {len(missing_tables)}/4")
    print()
    
    if missing_tables:
        print("🚨 MIGRAÇÕES PENDENTES:")
        for i, table in enumerate(missing_tables, 1):
            description = required_tables[table]
            print(f"{i}. {table} - {description}")
        print()
        print("📝 Execute as migrações SQL no Supabase para criar as tabelas faltantes.")
    else:
        print("🎉 TODAS AS MIGRAÇÕES FORAM EXECUTADAS!")
        print("✅ Sistema pronto para integração com Asaas!")

if __name__ == "__main__":
    main()