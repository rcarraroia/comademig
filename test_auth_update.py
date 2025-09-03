#!/usr/bin/env python3

import os
from supabase import create_client, Client
from datetime import datetime

# Configuração do Supabase
url = "https://amkelczfwazutrciqtlk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(url, key)

def test_with_auth():
    print("🔐 TESTANDO UPDATE COM AUTENTICAÇÃO")
    print("=" * 60)
    
    # Primeiro, vamos tentar fazer login como admin
    try:
        # Tentar login com credenciais de admin (você pode precisar ajustar)
        auth_result = supabase.auth.sign_in_with_password({
            "email": "admin@comademig.org.br",  # Ajuste conforme necessário
            "password": "admin123"  # Ajuste conforme necessário
        })
        
        if auth_result.user:
            print(f"✅ Login realizado com sucesso: {auth_result.user.email}")
            
            # Agora tentar o UPDATE
            test_data = {
                "titulo": "Nossa Liderança - Teste com Auth",
                "descricao": "Teste com usuário autenticado",
                "lideres": [
                    {
                        "id": "leader-auth-test",
                        "nome": "Pastor Teste Auth",
                        "cargo": "Presidente Teste",
                        "bio": "Teste com autenticação",
                        "ordem": 1,
                        "categoria": "presidencia"
                    }
                ]
            }
            
            result = supabase.table('content_management').update({
                'content_json': test_data,
                'last_updated_at': datetime.now().isoformat()
            }).eq('page_name', 'lideranca').execute()
            
            if result.data:
                print("✅ UPDATE com auth realizado com sucesso!")
                print(f"   Registros atualizados: {len(result.data)}")
            else:
                print("❌ UPDATE com auth falhou")
                print(f"   Resposta: {result}")
        else:
            print("❌ Falha no login")
            
    except Exception as e:
        print(f"❌ Erro durante teste com auth: {e}")

def test_policies():
    print("\n🛡️ VERIFICANDO POLÍTICAS RLS")
    print("=" * 60)
    
    try:
        # Verificar se conseguimos ler as políticas
        result = supabase.rpc('get_policies_info').execute()
        print(f"Políticas: {result.data}")
    except Exception as e:
        print(f"Não foi possível verificar políticas: {e}")
    
    # Tentar UPDATE simples sem dados complexos
    try:
        print("\n🧪 Testando UPDATE simples...")
        result = supabase.table('content_management').update({
            'last_updated_at': datetime.now().isoformat()
        }).eq('page_name', 'lideranca').execute()
        
        if result.data:
            print("✅ UPDATE simples funcionou!")
        else:
            print("❌ UPDATE simples falhou")
            print(f"   Resposta: {result}")
            
    except Exception as e:
        print(f"❌ Erro no UPDATE simples: {e}")

if __name__ == "__main__":
    test_policies()
    test_with_auth()