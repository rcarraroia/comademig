#!/usr/bin/env python3
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*70)
print("VERIFICANDO USUÁRIO E ASSINATURA")
print("="*70 + "\n")

# Verificar usuário
user_id = "0443cc65-2b33-4b0c-9443-14a5e7140dbd"

try:
    # Buscar perfil
    profile = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
    print("✅ Perfil encontrado:")
    print(f"   Nome: {profile.data.get('nome_completo')}")
    print(f"   Email: {profile.data.get('email')}")
    print(f"   Member Type ID: {profile.data.get('member_type_id')}")
    print(f"\n📋 Colunas disponíveis no perfil:")
    for col in profile.data.keys():
        print(f"   - {col}")
except Exception as e:
    print(f"❌ Erro ao buscar perfil: {e}")

print("\n" + "-"*70 + "\n")

try:
    # Buscar assinaturas
    subscriptions = supabase.table('user_subscriptions').select('*').eq('user_id', user_id).execute()
    print(f"📊 Assinaturas encontradas: {len(subscriptions.data)}")
    for sub in subscriptions.data:
        print(f"\n   ID: {sub.get('id')}")
        print(f"   Status: {sub.get('status')}")
        print(f"   Asaas ID: {sub.get('asaas_subscription_id')}")
        print(f"   Criada em: {sub.get('created_at')}")
except Exception as e:
    print(f"❌ Erro ao buscar assinaturas: {e}")
