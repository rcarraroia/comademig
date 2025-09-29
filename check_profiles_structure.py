#!/usr/bin/env python3
from supabase import create_client, Client

# Configurações
SUPABASE_URL = 'https://amkelczfwazutrciqtlk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print('=== ANÁLISE COMPLETA DA TABELA PROFILES ===')
print()

try:
    # 1. Verificar estrutura da tabela
    response = supabase.table('profiles').select('*').limit(10).execute()
    
    if response.data:
        print('1. ESTRUTURA DA TABELA:')
        first_profile = response.data[0]
        print(f'   Campos disponíveis: {list(first_profile.keys())}')
        print()
        
        print('2. TODOS OS PERFIS:')
        for i, profile in enumerate(response.data):
            print(f'   Perfil {i+1}:')
            print(f'     - ID: {profile.get("id", "N/A")}')
            print(f'     - Email: {profile.get("email", "N/A")}')
            print(f'     - Nome: {profile.get("nome_completo", "N/A")}')
            print(f'     - Cargo: {profile.get("cargo", "N/A")}')
            print(f'     - Status: {profile.get("status", "N/A")}')
            print()
        
        # 2. Procurar por admin
        print('3. PROCURANDO ADMIN:')
        admin_profiles = [p for p in response.data if p.get('cargo') == 'admin' or p.get('cargo') == 'Administrador']
        
        if admin_profiles:
            print('   ✅ PERFIS ADMIN ENCONTRADOS:')
            for admin in admin_profiles:
                print(f'     - ID: {admin.get("id", "N/A")}')
                print(f'     - Email: {admin.get("email", "N/A")}')
                print(f'     - Nome: {admin.get("nome_completo", "N/A")}')
                print(f'     - Cargo: {admin.get("cargo", "N/A")}')
        else:
            print('   ❌ Nenhum perfil admin encontrado')
        
        # 3. Verificar se há algum perfil com seu email
        print()
        print('4. PROCURANDO SEU EMAIL:')
        your_profiles = [p for p in response.data if 'rcarraro' in str(p.get('email', '')).lower()]
        
        if your_profiles:
            print('   ✅ SEU PERFIL ENCONTRADO:')
            for profile in your_profiles:
                print(f'     - ID: {profile.get("id", "N/A")}')
                print(f'     - Email: {profile.get("email", "N/A")}')
                print(f'     - Cargo: {profile.get("cargo", "N/A")}')
        else:
            print('   ❌ Seu perfil não encontrado')
            print('   Tentando buscar por qualquer email com "gmail"...')
            gmail_profiles = [p for p in response.data if 'gmail' in str(p.get('email', '')).lower()]
            for profile in gmail_profiles:
                print(f'     - {profile.get("email", "N/A")}: {profile.get("cargo", "N/A")}')
    
    else:
        print('❌ Nenhum perfil encontrado na tabela')

except Exception as e:
    print(f'❌ ERRO: {e}')

print()
print('=== ANÁLISE CONCLUÍDA ===')