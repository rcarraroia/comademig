#!/usr/bin/env python3
"""
Verificar estrutura da tabela asaas_cobrancas
"""

from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verify_structure():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔍 VERIFICANDO ESTRUTURA: asaas_cobrancas")
    print("="*60)
    
    try:
        # Tentar buscar um registro para ver estrutura
        response = supabase.table('asaas_cobrancas').select('*').limit(1).execute()
        
        if response.data and len(response.data) > 0:
            print("✅ Tabela existe com dados")
            print("\n📋 COLUNAS:")
            for col in sorted(response.data[0].keys()):
                print(f"  - {col}")
        else:
            print("⚠️ Tabela existe mas está vazia")
            print("Não é possível determinar estrutura sem dados")
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

if __name__ == "__main__":
    verify_structure()
