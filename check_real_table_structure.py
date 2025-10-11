#!/usr/bin/env python3
"""
Verificar estrutura REAL das tabelas no Supabase
"""

from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_table_structure():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n" + "="*80)
    print("VERIFICAÇÃO DA ESTRUTURA REAL DAS TABELAS")
    print("="*80 + "\n")
    
    tables = [
        'member_types',
        'subscription_plans', 
        'member_type_subscriptions',
        'user_subscriptions',
        'profiles'
    ]
    
    for table in tables:
        print(f"\n{'='*80}")
        print(f"TABELA: {table}")
        print(f"{'='*80}")
        
        try:
            # Pegar 1 registro para ver as colunas
            response = supabase.table(table).select('*').limit(1).execute()
            
            if response.data and len(response.data) > 0:
                columns = list(response.data[0].keys())
                print(f"\n✅ Colunas encontradas ({len(columns)}):")
                for col in sorted(columns):
                    value = response.data[0][col]
                    value_type = type(value).__name__
                    print(f"  • {col:30} | Tipo: {value_type:15} | Exemplo: {str(value)[:50]}")
            else:
                print(f"\n⚠️  Tabela vazia, tentando inserir registro de teste...")
                # Não vamos inserir, apenas informar
                print(f"   Não é possível ver estrutura de tabela vazia via SELECT")
                
        except Exception as e:
            print(f"\n❌ Erro ao acessar tabela: {e}")
    
    print("\n" + "="*80)
    print("VERIFICAÇÃO CONCLUÍDA")
    print("="*80 + "\n")

if __name__ == '__main__':
    check_table_structure()
