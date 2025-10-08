#!/usr/bin/env python3
"""
Script para verificar dados do usuário admin no Supabase
"""
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verificar_usuario_admin():
    """Verifica dados do usuário admin específico"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("=" * 60)
        print("🔍 VERIFICAÇÃO DE USUÁRIO ADMIN")
        print("=" * 60)
        
        # Buscar usuário pelo email
        email_admin = "rcarrarocoach@gmail.com"
        
        print(f"\n📧 Buscando usuário: {email_admin}")
        
        # Buscar todos os admins diretamente
        print("\n🔐 Buscando todos os usuários com tipo_membro = 'admin':")
        admins = supabase.table('profiles').select('*').eq('tipo_membro', 'admin').execute()
        
        if admins.data:
            print(f"\n✅ Encontrados {len(admins.data)} administradores:")
            for admin in admins.data:
                print(f"\n  ID: {admin.get('id')}")
                print(f"  Nome: {admin.get('nome_completo')}")
                print(f"  Email: {admin.get('email', 'N/A')}")
                print(f"  Tipo Membro: {admin.get('tipo_membro')}")
                print(f"  Cargo: {admin.get('cargo', 'N/A')}")
                print(f"  Status: {admin.get('status')}")
        else:
            print("\n❌ Nenhum administrador encontrado!")
            
        # Verificar se existe algum usuário com cargo contendo 'admin'
        print("\n🔍 Buscando usuários com cargo contendo 'admin':")
        cargo_admins = supabase.table('profiles').select('*').ilike('cargo', '%admin%').execute()
        
        if cargo_admins.data:
            print(f"\n✅ Encontrados {len(cargo_admins.data)} usuários com cargo admin:")
            for user in cargo_admins.data:
                print(f"\n  ID: {user.get('id')}")
                print(f"  Nome: {user.get('nome_completo')}")
                print(f"  Tipo Membro: {user.get('tipo_membro')}")
                print(f"  Cargo: {user.get('cargo')}")
        
        # Listar TODOS os usuários para encontrar o admin
        print("\n📋 TODOS os usuários cadastrados:")
        usuarios = supabase.table('profiles').select('id, nome_completo, tipo_membro, cargo, status, created_at').order('created_at').execute()
        
        print(f"\n✅ Total de usuários: {len(usuarios.data) if usuarios.data else 0}")
        
        if usuarios.data:
            for idx, user in enumerate(usuarios.data, 1):
                print(f"\n  [{idx}] Nome: {user.get('nome_completo')}")
                print(f"      ID: {user.get('id')}")
                print(f"      Tipo: {user.get('tipo_membro')}")
                print(f"      Cargo: {user.get('cargo', 'N/A')}")
                print(f"      Status: {user.get('status')}")
                print(f"      Criado: {user.get('created_at', 'N/A')[:10]}")
        else:
            print("\n❌ Nenhum usuário encontrado no banco!")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erro ao verificar usuário: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verificar_usuario_admin()
