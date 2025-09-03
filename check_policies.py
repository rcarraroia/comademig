#!/usr/bin/env python3

import os
import requests

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_rls_policies():
    print("🔍 VERIFICANDO POLÍTICAS RLS...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Tentar SELECT (deve funcionar - política pública)
    print("📖 TESTANDO SELECT (deve funcionar)...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SELECT funcionou!")
        else:
            print(f"❌ SELECT falhou: {response.text}")
    except Exception as e:
        print(f"❌ Erro no SELECT: {e}")
    
    # Tentar UPDATE (pode falhar - precisa ser admin)
    print("\n🔄 TESTANDO UPDATE (pode falhar se não for admin)...")
    try:
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home",
            headers=headers,
            json={"content_json": {"test": "policy_test"}}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ UPDATE funcionou!")
            print(f"Resposta: {response.text}")
        else:
            print(f"❌ UPDATE falhou: {response.text}")
            if "policy" in response.text.lower():
                print("🔒 PROBLEMA: Política RLS está bloqueando o update!")
                print("💡 SOLUÇÃO: O usuário precisa ter role 'admin' na tabela user_roles")
    except Exception as e:
        print(f"❌ Erro no UPDATE: {e}")
    
    # Verificar se existe tabela user_roles
    print("\n👥 VERIFICANDO TABELA USER_ROLES...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_roles?select=*&limit=5",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Tabela user_roles existe! Registros: {len(data)}")
            if data:
                print("📋 Exemplos de roles:")
                for role in data[:3]:
                    print(f"  • User: {role.get('user_id', 'N/A')[:8]}... Role: {role.get('role', 'N/A')}")
        else:
            print(f"❌ Erro ao acessar user_roles: {response.text}")
    except Exception as e:
        print(f"❌ Erro ao verificar user_roles: {e}")

if __name__ == "__main__":
    check_rls_policies()