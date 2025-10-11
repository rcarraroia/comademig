#!/usr/bin/env python3
"""
Verificar se as tabelas de suporte existem no banco de dados
"""

from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_support_system():
    """Verificar sistema de suporte"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n" + "="*80)
    print("VERIFICAÇÃO DO SISTEMA DE SUPORTE")
    print("="*80 + "\n")
    
    tables_to_check = [
        'support_categories',
        'support_tickets',
        'support_messages'
    ]
    
    results = {}
    
    for table in tables_to_check:
        print(f"🔍 Verificando tabela: {table}")
        try:
            # Tentar contar registros
            response = supabase.table(table).select('*', count='exact').limit(1).execute()
            
            results[table] = {
                'exists': True,
                'count': response.count,
                'accessible': True
            }
            
            print(f"   ✅ Tabela existe")
            print(f"   📊 Total de registros: {response.count}")
            
            # Pegar amostra
            if response.data:
                print(f"   📋 Colunas: {', '.join(response.data[0].keys())}")
            
        except Exception as e:
            error_msg = str(e)
            results[table] = {
                'exists': False,
                'error': error_msg,
                'accessible': False
            }
            
            print(f"   ❌ Erro: {error_msg}")
            
            # Verificar tipo de erro
            if 'does not exist' in error_msg or 'relation' in error_msg:
                print(f"   ⚠️  TABELA NÃO EXISTE NO BANCO DE DADOS!")
            elif 'permission' in error_msg or 'RLS' in error_msg:
                print(f"   ⚠️  PROBLEMA DE PERMISSÃO (RLS)")
        
        print()
    
    # Resumo
    print("="*80)
    print("RESUMO:")
    print("="*80)
    
    existing = [t for t, r in results.items() if r.get('exists')]
    missing = [t for t, r in results.items() if not r.get('exists')]
    
    print(f"\n✅ Tabelas existentes: {len(existing)}/{len(tables_to_check)}")
    for table in existing:
        print(f"   - {table} ({results[table]['count']} registros)")
    
    if missing:
        print(f"\n❌ Tabelas faltando: {len(missing)}")
        for table in missing:
            print(f"   - {table}")
            print(f"     Erro: {results[table].get('error', 'Desconhecido')}")
    
    print("\n" + "="*80)
    
    # Diagnóstico
    if missing:
        print("\n🔧 AÇÃO NECESSÁRIA:")
        print("-" * 80)
        print("As tabelas de suporte NÃO EXISTEM no banco de dados!")
        print("Você precisa executar a migração SQL para criar as tabelas.")
        print("\nProcure por arquivos em: supabase/migrations/")
        print("Que contenham: support_categories, support_tickets, support_messages")
        print()
    else:
        print("\n✅ SISTEMA DE SUPORTE OK!")
        print("Todas as tabelas existem e estão acessíveis.")
        print()

if __name__ == '__main__':
    check_support_system()
