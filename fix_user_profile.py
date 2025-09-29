#!/usr/bin/env python3
from supabase import create_client, Client

# Configurações
SUPABASE_URL = 'https://amkelczfwazutrciqtlk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print('=== CORREÇÃO DO PERFIL DE USUÁRIO ===')
print()

# ID do seu perfil admin (encontrado na análise anterior)
admin_profile_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'
admin_email = 'rcarrarocoach@gmail.com'

print(f'Atualizando perfil ID: {admin_profile_id}')
print(f'Definindo email: {admin_email}')
print()

try:
    # Atualizar o perfil para incluir o email
    response = supabase.table('profiles').update({
        'email': admin_email
    }).eq('id', admin_profile_id).execute()
    
    if response.data:
        print('✅ PERFIL ATUALIZADO COM SUCESSO!')
        print('Dados atualizados:')
        for profile in response.data:
            print(f'   - ID: {profile.get("id", "N/A")}')
            print(f'   - Nome: {profile.get("nome_completo", "N/A")}')
            print(f'   - Email: {profile.get("email", "N/A")}')
            print(f'   - Cargo: {profile.get("cargo", "N/A")}')
            print(f'   - Status: {profile.get("status", "N/A")}')
    else:
        print('❌ Nenhum dado retornado na atualização')
    
    # Verificar se a atualização funcionou
    print()
    print('Verificando atualização...')
    verify_response = supabase.table('profiles').select('*').eq('id', admin_profile_id).execute()
    
    if verify_response.data:
        profile = verify_response.data[0]
        print('✅ VERIFICAÇÃO:')
        print(f'   - Email agora: {profile.get("email", "N/A")}')
        print(f'   - Cargo: {profile.get("cargo", "N/A")}')
        
        if profile.get('email') == admin_email:
            print('✅ EMAIL DEFINIDO CORRETAMENTE!')
        else:
            print('❌ Email ainda não está correto')
    else:
        print('❌ Erro na verificação')

except Exception as e:
    print(f'❌ ERRO: {e}')

print()
print('=== CORREÇÃO CONCLUÍDA ===')