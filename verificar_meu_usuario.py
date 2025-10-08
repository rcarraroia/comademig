#!/usr/bin/env python3
"""
Script para verificar o usuário Renato Carraro especificamente
"""
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verificar_usuario():
    """Verifica o usuário Renato Carraro"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("=" * 60)
        print("🔍 VERIFICANDO USUÁRIO: Renato Carraro")
        print("=" * 60)
        
        # Buscar pelo nome
        response = supabase.table('profiles').select('*').ilike('nome_completo', '%Renato%Carraro%').execute()
        
        if response.data:
            for user in response.data:
                print(f"\n✅ USUÁRIO ENCONTRADO:")
                print(f"  ID: {user.get('id')}")
                print(f"  Nome: {user.get('nome_completo')}")
                print(f"  CPF: {user.get('cpf', 'N/A')}")
                print(f"  Email: {user.get('email', 'N/A')}")
                print(f"  Tipo Membro: '{user.get('tipo_membro')}'")  # ⚠️ CAMPO CRÍTICO
                print(f"  Cargo: {user.get('cargo', 'N/A')}")
                print(f"  Status: {user.get('status')}")
                print(f"  Igreja: {user.get('igreja', 'N/A')}")
                print(f"  Cidade: {user.get('cidade', 'N/A')}")
                print(f"  Estado: {user.get('estado', 'N/A')}")
                
                # Verificação específica
                tipo = user.get('tipo_membro')
                print(f"\n🔍 ANÁLISE:")
                print(f"  tipo_membro === 'admin': {tipo == 'admin'}")
                print(f"  tipo_membro === 'membro': {tipo == 'membro'}")
                print(f"  Valor exato: '{tipo}' (tipo: {type(tipo).__name__})")
                
                if tipo != 'admin':
                    print(f"\n❌ PROBLEMA IDENTIFICADO!")
                    print(f"  Esperado: 'admin'")
                    print(f"  Atual: '{tipo}'")
                    print(f"  Por isso redireciona para /dashboard")
                else:
                    print(f"\n✅ Tipo está correto como 'admin'")
        else:
            print("\n❌ Usuário Renato Carraro não encontrado!")
            print("\nBuscando todos os usuários:")
            all_users = supabase.table('profiles').select('id, nome_completo, tipo_membro').execute()
            if all_users.data:
                for u in all_users.data:
                    print(f"  - {u.get('nome_completo')}: {u.get('tipo_membro')}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verificar_usuario()
