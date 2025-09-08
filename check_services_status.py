#!/usr/bin/env python3
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 VERIFICAÇÃO RÁPIDA DOS SERVIÇOS")
print("=" * 50)

# Filiação
try:
    member_types = supabase.table('member_types').select('*').execute()
    plans = supabase.table('subscription_plans').select('*').execute()
    subscriptions = supabase.table('user_subscriptions').select('*', count='exact').execute()
    
    print(f"👥 FILIAÇÃO:")
    print(f"   - Tipos de membro: {len(member_types.data)}")
    print(f"   - Planos: {len(plans.data)}")
    print(f"   - Assinaturas: {subscriptions.count}")
except Exception as e:
    print(f"❌ Erro filiação: {e}")

# Pagamentos
try:
    cobrancas = supabase.table('asaas_cobrancas').select('*', count='exact').execute()
    print(f"💳 PAGAMENTOS:")
    print(f"   - Cobranças: {cobrancas.count}")
    if cobrancas.data:
        tipos = set([r.get('tipo_cobranca') for r in cobrancas.data if r.get('tipo_cobranca')])
        print(f"   - Tipos: {tipos}")
except Exception as e:
    print(f"❌ Erro pagamentos: {e}")

print("\n📋 ANÁLISE CONCLUÍDA")