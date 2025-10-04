#!/usr/bin/env python3
"""
Verificar dados de recurrence na tabela subscription_plans
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_recurrence_values():
    """Verificar valores de recurrence na tabela"""
    print("🔍 VERIFICANDO VALORES DE RECURRENCE")
    print("=" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Buscar todos os planos com valores de recurrence
        response = supabase.table('subscription_plans').select('id, plan_title, recurrence').execute()
        data = response.data
        
        if data:
            print("📋 Valores atuais de recurrence:")
            for plan in data:
                print(f"   ID: {plan['id']}")
                print(f"   Nome: {plan['plan_title']}")
                print(f"   Recurrence: '{plan['recurrence']}'")
                print()
            
            # Verificar valores únicos
            unique_values = set(plan['recurrence'] for plan in data)
            print("🎯 Valores únicos de recurrence encontrados:")
            for value in unique_values:
                print(f"   - '{value}'")
            
            print("\n✅ Valores esperados pela constraint:")
            print("   - 'monthly'")
            print("   - 'semestral'") 
            print("   - 'annual'")
            
            print("\n❌ Valores que causam erro:")
            expected = {'monthly', 'semestral', 'annual'}
            for value in unique_values:
                if value not in expected:
                    print(f"   - '{value}' (INVÁLIDO)")
                    
        else:
            print("⚠️  Nenhum plano encontrado")
            
    except Exception as e:
        print(f"❌ Erro ao verificar dados: {e}")

if __name__ == "__main__":
    check_recurrence_values()