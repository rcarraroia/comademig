#!/usr/bin/env python3
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("🔍 VERIFICANDO RELACIONAMENTOS NO BANCO")
print("=" * 80)

# 1. Verificar estrutura de user_subscriptions
print("\n1. Estrutura de user_subscriptions:")
try:
    result = supabase.table('user_subscriptions').select('*').limit(1).execute()
    if result.data:
        print(f"✅ Tabela existe. Colunas: {list(result.data[0].keys())}")
    else:
        print("⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# 2. Verificar estrutura de subscription_plans
print("\n2. Estrutura de subscription_plans:")
try:
    result = supabase.table('subscription_plans').select('*').limit(1).execute()
    if result.data:
        print(f"✅ Tabela existe. Colunas: {list(result.data[0].keys())}")
    else:
        print("⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# 3. Testar relacionamento
print("\n3. Testando relacionamento user_subscriptions -> subscription_plans:")
try:
    result = supabase.table('user_subscriptions').select('*, subscription_plans(*)').limit(1).execute()
    print(f"✅ Relacionamento funciona! Dados: {result.data}")
except Exception as e:
    print(f"❌ Relacionamento FALHOU: {e}")

print("\n" + "=" * 80)
