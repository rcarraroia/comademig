#!/usr/bin/env python3

import os
from supabase import create_client, Client

# Configuração do Supabase
url = "https://amkelczfwazutrciqtlk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(url, key)

def check_users():
    print("👥 VERIFICANDO USUÁRIOS NO SISTEMA")
    print("=" * 60)
    
    try:
        # Verificar tabela profiles
        result = supabase.table('profiles').select('*').execute()
        
        if result.data:
            print(f"✅ Encontrados {len(result.data)} usuários:")
            for user in result.data:
                print(f"   ID: {user.get('id', 'N/A')}")
                print(f"   Email: {user.get('email', 'N/A')}")
                print(f"   Nome: {user.get('full_name', 'N/A')}")
                print(f"   Tipo: {user.get('user_type', 'N/A')}")
                print("   ---")
        else:
            print("❌ Nenhum usuário encontrado na tabela profiles")
            
    except Exception as e:
        print(f"❌ Erro ao verificar usuários: {e}")

def check_user_roles():
    print("\n🎭 VERIFICANDO ROLES DE USUÁRIOS")
    print("=" * 60)
    
    try:
        # Verificar tabela user_roles
        result = supabase.table('user_roles').select('*').execute()
        
        if result.data:
            print(f"✅ Encontradas {len(result.data)} roles:")
            for role in result.data:
                print(f"   User ID: {role.get('user_id', 'N/A')}")
                print(f"   Role: {role.get('role', 'N/A')}")
                print("   ---")
        else:
            print("❌ Nenhuma role encontrada")
            
    except Exception as e:
        print(f"❌ Erro ao verificar roles: {e}")

def test_anonymous_permissions():
    print("\n🔓 TESTANDO PERMISSÕES ANÔNIMAS")
    print("=" * 60)
    
    # Testar SELECT (deve funcionar)
    try:
        result = supabase.table('content_management').select('page_name').execute()
        print(f"✅ SELECT anônimo: {len(result.data)} registros")
    except Exception as e:
        print(f"❌ SELECT anônimo falhou: {e}")
    
    # Testar INSERT (provavelmente vai falhar)
    try:
        result = supabase.table('content_management').insert({
            'page_name': 'test_anon',
            'content_json': {'test': 'data'},
            'last_updated_at': '2024-01-01T00:00:00Z'
        }).execute()
        print(f"✅ INSERT anônimo funcionou: {result.data}")
    except Exception as e:
        print(f"❌ INSERT anônimo falhou: {e}")
    
    # Testar UPDATE (provavelmente vai falhar)
    try:
        result = supabase.table('content_management').update({
            'last_updated_at': '2024-01-01T00:00:00Z'
        }).eq('page_name', 'home').execute()
        print(f"✅ UPDATE anônimo funcionou: {result.data}")
    except Exception as e:
        print(f"❌ UPDATE anônimo falhou: {e}")

if __name__ == "__main__":
    check_users()
    check_user_roles()
    test_anonymous_permissions()