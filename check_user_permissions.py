#!/usr/bin/env python3

import os
import requests

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_user_permissions():
    print("🔍 VERIFICANDO PERMISSÕES DO USUÁRIO...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Verificar usuários e suas roles
    print("👥 VERIFICANDO USER_ROLES...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_roles?select=*",
            headers=headers
        )
        
        if response.status_code == 200:
            roles = response.json()
            print(f"✅ Encontradas {len(roles)} roles:")
            for role in roles:
                user_id = role.get('user_id', 'N/A')
                user_role = role.get('role', 'N/A')
                print(f"  • {user_id[:8]}... → {user_role}")
                
                # Verificar se é o usuário do erro
                if user_id == 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a':
                    print(f"    🎯 ESTE É O USUÁRIO DO ERRO! Role: {user_role}")
        else:
            print(f"❌ Erro ao buscar roles: {response.text}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Verificar perfil do usuário
    print("\n👤 VERIFICANDO PERFIL DO USUÁRIO...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a&select=id,nome_completo,email",
            headers=headers
        )
        
        if response.status_code == 200:
            profiles = response.json()
            if profiles:
                profile = profiles[0]
                print(f"✅ Usuário encontrado:")
                print(f"  • ID: {profile.get('id', 'N/A')}")
                print(f"  • Nome: {profile.get('nome_completo', 'N/A')}")
                print(f"  • Email: {profile.get('email', 'N/A')}")
            else:
                print("❌ Perfil não encontrado")
        else:
            print(f"❌ Erro ao buscar perfil: {response.text}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Testar se a política está funcionando corretamente
    print("\n🔒 TESTANDO POLÍTICA RLS...")
    
    # Simular um token JWT com o usuário admin
    # Nota: Isso é apenas para teste - em produção o token viria da autenticação
    print("⚠️  NOTA: Testando com token anônimo (pode falhar se precisar de autenticação)")
    
    try:
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home",
            headers=headers,
            json={
                "content_json": {"test": "policy_test"},
                "last_updated_at": "2024-02-09T15:00:00Z"
            }
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 204]:
            print("✅ Update com token anônimo funcionou!")
            print("💡 Isso significa que a política permite updates anônimos")
        else:
            print(f"❌ Update falhou: {response.text}")
            if "policy" in response.text.lower():
                print("🔒 A política RLS está bloqueando updates anônimos")
                print("💡 O frontend precisa estar autenticado como admin")
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    check_user_permissions()