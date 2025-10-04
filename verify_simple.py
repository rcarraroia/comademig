#!/usr/bin/env python3
"""
Verificação simples se a correção funcionou
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verify_fix():
    print("🔍 VERIFICAÇÃO RÁPIDA DA CORREÇÃO")
    print("=" * 50)
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar estrutura
    print("\n1️⃣ Verificando estrutura da tabela...")
    response = supabase.table('subscription_plans').select('*').limit(1).execute()
    
    if response.data:
        columns = list(response.data[0].keys())
        print("✅ Colunas encontradas:")
        for col in sorted(columns):
            print(f"   - {col}")
        
        if 'name' in columns and 'plan_title' not in columns:
            print("✅ SUCESSO: Coluna renomeada corretamente!")
        else:
            print("❌ PROBLEMA: Coluna não foi renomeada")
            return False
    
    # 2. Verificar dados
    print("\n2️⃣ Verificando dados...")
    response = supabase.table('subscription_plans').select('name, recurrence, price').execute()
    
    if response.data:
        print(f"✅ {len(response.data)} planos encontrados:")
        for plan in response.data:
            print(f"   - {plan['name']}: {plan['recurrence']} (R$ {plan['price']})")
        
        # Verificar se recurrence está padronizada
        valid_values = {'monthly', 'semestral', 'annual'}
        all_valid = all(plan['recurrence'] in valid_values for plan in response.data)
        
        if all_valid:
            print("✅ SUCESSO: Valores de recurrence padronizados!")
        else:
            print("❌ PROBLEMA: Alguns valores de recurrence ainda incorretos")
            return False
    
    # 3. Testar hook básico
    print("\n3️⃣ Testando compatibilidade com hooks...")
    try:
        response = supabase.from('member_types').select('id,name,member_type_subscriptions(subscription_plans(id,name,price,recurrence))').limit(1).execute()
        print("✅ SUCESSO: Query do hook funciona!")
    except Exception as e:
        print(f"❌ PROBLEMA: Query do hook falhou - {e}")
        return False
    
    print("\n🎉 TODAS AS VERIFICAÇÕES PASSARAM!")
    print("✅ Schema corrigido com sucesso!")
    print("🚀 PRONTO PARA CONTINUAR COM A FASE 2!")
    return True

if __name__ == "__main__":
    verify_fix()