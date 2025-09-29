#!/usr/bin/env python3
from supabase import create_client, Client

# Configurações
SUPABASE_URL = 'https://amkelczfwazutrciqtlk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print('=== VERIFICAÇÃO DE PERMISSÕES ===')
print()

# Seu email de usuário (baseado no que vi nos logs)
user_email = 'rcarrarocoach@gmail.com'

print(f'Verificando permissões para: {user_email}')
print()

try:
    # 1. Buscar o perfil do usuário
    response = supabase.table('profiles').select('*').eq('email', user_email).execute()
    
    if response.data:
        profile = response.data[0]
        print('1. PERFIL ENCONTRADO:')
        print(f'   - ID: {profile.get("id", "N/A")}')
        print(f'   - Nome: {profile.get("nome_completo", "N/A")}')
        print(f'   - Email: {profile.get("email", "N/A")}')
        print(f'   - Cargo: {profile.get("cargo", "N/A")}')
        print(f'   - Status: {profile.get("status", "N/A")}')
        
        user_id = profile.get('id')
        
        # 2. Verificar se é admin
        print()
        print('2. VERIFICAÇÃO DE ADMIN:')
        if profile.get('cargo') == 'admin':
            print('   ✅ USUÁRIO É ADMIN')
        else:
            print(f'   ❌ Usuário não é admin (cargo: {profile.get("cargo", "N/A")})')
        
        # 3. Verificar user_roles se existir
        print()
        print('3. VERIFICAÇÃO DE ROLES:')
        try:
            roles_response = supabase.table('user_roles').select('*').eq('user_id', user_id).execute()
            if roles_response.data:
                for role in roles_response.data:
                    print(f'   - Role: {role.get("role", "N/A")}')
            else:
                print('   - Nenhuma role específica encontrada')
        except Exception as e:
            print(f'   - Tabela user_roles não existe ou erro: {e}')
        
        # 4. Verificar assinaturas ativas
        print()
        print('4. ASSINATURAS ATIVAS:')
        try:
            subs_response = supabase.table('user_subscriptions').select('*').eq('user_id', user_id).eq('status', 'active').execute()
            if subs_response.data:
                for sub in subs_response.data:
                    print(f'   - Assinatura: {sub.get("subscription_plan_id", "N/A")} (Status: {sub.get("status", "N/A")})')
            else:
                print('   - Nenhuma assinatura ativa encontrada')
        except Exception as e:
            print(f'   - Erro ao verificar assinaturas: {e}')
            
    else:
        print('❌ PERFIL NÃO ENCONTRADO')
        print('Tentando buscar por ID...')
        
        # Tentar buscar todos os perfis para debug
        all_profiles = supabase.table('profiles').select('id, email, nome_completo, cargo').limit(5).execute()
        print('Perfis encontrados:')
        for p in all_profiles.data:
            print(f'   - {p.get("email", "N/A")}: {p.get("cargo", "N/A")}')

except Exception as e:
    print(f'❌ ERRO: {e}')

print()
print('=== VERIFICAÇÃO CONCLUÍDA ===')