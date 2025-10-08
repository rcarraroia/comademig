#!/usr/bin/env python3
from supabase import create_client, Client

# Extrair configurações de src/integrations/supabase/client.ts
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_database():
    """Análise completa do banco de dados"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("=" * 70)
    print("ANÁLISE REAL DO BANCO DE DADOS - TABELA PROFILES")
    print("=" * 70)
    
    # Buscar TODOS os profiles
    response = supabase.table('profiles').select('*').execute()
    
    print(f"\nTotal de registros: {len(response.data)}")
    
    if response.data:
        for idx, profile in enumerate(response.data, 1):
            print(f"\n{'='*70}")
            print(f"REGISTRO {idx}:")
            print(f"{'='*70}")
            print(f"ID: {profile.get('id')}")
            print(f"Nome Completo: {profile.get('nome_completo')}")
            print(f"CPF: {profile.get('cpf')}")
            print(f"Email: {profile.get('email')}")
            print(f"TIPO_MEMBRO: '{profile.get('tipo_membro')}'")  # ⚠️ CAMPO CRÍTICO
            print(f"Cargo: {profile.get('cargo')}")
            print(f"Status: {profile.get('status')}")
            print(f"Igreja: {profile.get('igreja')}")
            print(f"Cidade: {profile.get('cidade')}")
            print(f"Estado: {profile.get('estado')}")
            print(f"Telefone: {profile.get('telefone')}")
            print(f"Data Nascimento: {profile.get('data_nascimento')}")
            print(f"Data Ordenação: {profile.get('data_ordenacao')}")
            
            # Análise do tipo_membro
            tipo = profile.get('tipo_membro')
            print(f"\n🔍 ANÁLISE DO TIPO_MEMBRO:")
            print(f"   Valor: '{tipo}'")
            print(f"   Tipo Python: {type(tipo).__name__}")
            print(f"   É 'admin'? {tipo == 'admin'}")
            print(f"   É 'membro'? {tipo == 'membro'}")
            
            if tipo == 'admin':
                print(f"   ✅ Este usuário DEVERIA ir para /admin/usuarios")
            else:
                print(f"   ❌ Este usuário vai para /dashboard (tipo: '{tipo}')")
    else:
        print("\n❌ Nenhum registro encontrado!")
    
    print(f"\n{'='*70}")

if __name__ == "__main__":
    analyze_database()
