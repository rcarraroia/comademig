#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=== ANÁLISE COMPLETA DO PAINEL ADMINISTRATIVO ===\n")

# 1. Verificar estrutura da tabela profiles
print("1. ESTRUTURA DA TABELA PROFILES:")
try:
    response = supabase.table('profiles').select('*').limit(5).execute()
    if response.data:
        print(f"   ✅ Tabela profiles existe")
        print(f"   📊 Colunas disponíveis: {list(response.data[0].keys())}")
        print(f"   📈 Total de registros: {len(response.data)}")
    else:
        print("   ❌ Tabela profiles vazia")
except Exception as e:
    print(f"   ❌ Erro: {e}")

print()

# 2. Buscar usuários admin
print("2. USUÁRIOS COM ROLE ADMIN:")
try:
    # Tentar buscar por 'role'
    response = supabase.table('profiles').select('id, email, role, full_name').execute()
    
    if response.data:
        admins = [p for p in response.data if p.get('role') in ['admin', 'super_admin']]
        if admins:
            print(f"   ✅ Encontrados {len(admins)} administradores:")
            for admin in admins:
                print(f"      - Email: {admin.get('email', 'N/A')}")
                print(f"        Role: {admin.get('role', 'N/A')}")
                print(f"        Nome: {admin.get('full_name', 'N/A')}")
                print(f"        ID: {admin.get('id', 'N/A')}")
                print()
        else:
            print("   ⚠️ Nenhum usuário com role 'admin' ou 'super_admin' encontrado")
            print("   📋 Roles encontrados:")
            roles = set([p.get('role') for p in response.data if p.get('role')])
            for role in roles:
                count = len([p for p in response.data if p.get('role') == role])
                print(f"      - {role}: {count} usuários")
    else:
        print("   ❌ Nenhum perfil encontrado")
        
except Exception as e:
    print(f"   ❌ Erro ao buscar admins: {e}")

print()

# 3. Verificar se coluna 'role' existe
print("3. VERIFICAÇÃO DA COLUNA 'role':")
try:
    response = supabase.table('profiles').select('*').limit(1).execute()
    if response.data and len(response.data) > 0:
        if 'role' in response.data[0]:
            print("   ✅ Coluna 'role' existe na tabela profiles")
        else:
            print("   ❌ Coluna 'role' NÃO existe na tabela profiles")
            print(f"   📋 Colunas disponíveis: {list(response.data[0].keys())}")
except Exception as e:
    print(f"   ❌ Erro: {e}")

print()

# 4. Buscar usuário específico (Renato Carraro)
print("4. BUSCAR USUÁRIO ESPECÍFICO (Renato Carraro):")
try:
    # Buscar por nome
    response = supabase.table('profiles').select('*').ilike('full_name', '%renato%').execute()
    
    if response.data:
        print(f"   ✅ Encontrados {len(response.data)} usuários com 'Renato' no nome:")
        for user in response.data:
            print(f"      - Nome: {user.get('full_name', 'N/A')}")
            print(f"        Email: {user.get('email', 'N/A')}")
            print(f"        Role: {user.get('role', 'N/A')}")
            print(f"        ID: {user.get('id', 'N/A')}")
            print()
    else:
        print("   ⚠️ Usuário não encontrado por nome")
        
    # Buscar por email
    response2 = supabase.table('profiles').select('*').ilike('email', '%carraro%').execute()
    if response2.data:
        print(f"   ✅ Encontrados {len(response2.data)} usuários com 'carraro' no email:")
        for user in response2.data:
            print(f"      - Email: {user.get('email', 'N/A')}")
            print(f"        Nome: {user.get('full_name', 'N/A')}")
            print(f"        Role: {user.get('role', 'N/A')}")
            print()
            
except Exception as e:
    print(f"   ❌ Erro: {e}")

print()

# 5. Verificar tabela auth.users (se possível)
print("5. INFORMAÇÕES ADICIONAIS:")
try:
    response = supabase.table('profiles').select('*').execute()
    total = len(response.data) if response.data else 0
    print(f"   📊 Total de perfis cadastrados: {total}")
    
    if response.data:
        with_role = len([p for p in response.data if p.get('role')])
        without_role = total - with_role
        print(f"   📊 Perfis com role definido: {with_role}")
        print(f"   📊 Perfis sem role: {without_role}")
        
except Exception as e:
    print(f"   ❌ Erro: {e}")

print("\n=== FIM DA ANÁLISE ===")
