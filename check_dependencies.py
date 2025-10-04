#!/usr/bin/env python3
"""
Verificar dependências que referenciam plan_title
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_functions_and_triggers():
    """Verificar funções e triggers que podem referenciar plan_title"""
    print("🔍 VERIFICANDO DEPENDÊNCIAS DE plan_title")
    print("=" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Tentar buscar informações sobre funções
        # Como não temos acesso direto ao pg_proc, vamos tentar uma abordagem diferente
        
        # Verificar se a coluna ainda existe
        response = supabase.rpc('execute_sql', {
            'query': '''
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'subscription_plans'
            ORDER BY column_name;
            '''
        }).execute()
        
        print("📋 Colunas atuais da tabela subscription_plans:")
        if response.data:
            for row in response.data:
                print(f"   - {row}")
        
    except Exception as e:
        print(f"❌ Erro ao verificar via RPC: {e}")
        
        # Método alternativo - verificar diretamente
        try:
            response = supabase.table('subscription_plans').select('*').limit(1).execute()
            if response.data:
                columns = list(response.data[0].keys())
                print("📋 Colunas detectadas via query direta:")
                for col in sorted(columns):
                    print(f"   - {col}")
                    
                if 'plan_title' in columns:
                    print("\n⚠️  ATENÇÃO: Coluna 'plan_title' ainda existe!")
                    print("   A renomeação não foi aplicada ainda.")
                elif 'name' in columns:
                    print("\n✅ Coluna 'name' encontrada!")
                    print("   A renomeação foi aplicada com sucesso.")
                    
        except Exception as e2:
            print(f"❌ Erro na verificação alternativa: {e2}")

if __name__ == "__main__":
    check_functions_and_triggers()