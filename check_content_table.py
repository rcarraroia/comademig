#!/usr/bin/env python3

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

if not url or not key:
    print("❌ Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas")
    exit(1)

supabase: Client = create_client(url, key)

print("🔍 VERIFICANDO TABELA content_management...")
print("=" * 50)

try:
    # Verificar se a tabela existe e sua estrutura
    response = supabase.table('content_management').select('*').limit(1).execute()
    print("✅ Tabela content_management existe")
    print(f"📋 Dados existentes: {response.data}")
    
    # Tentar inserir um registro de teste SEM updated_at
    test_data = {
        'page_name': 'test_page',
        'content_json': {'test': 'data'}
    }
    
    print("\n🧪 TESTANDO INSERÇÃO SEM updated_at...")
    insert_response = supabase.table('content_management').upsert(test_data).execute()
    print("✅ Inserção funcionou!")
    print(f"📋 Dados inseridos: {insert_response.data}")
    
    # Limpar o registro de teste
    supabase.table('content_management').delete().eq('page_name', 'test_page').execute()
    print("🧹 Registro de teste removido")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    print("\n🔧 POSSÍVEIS SOLUÇÕES:")
    print("1. Verificar se a tabela content_management existe")
    print("2. Verificar se as colunas estão corretas:")
    print("   - page_name (text, primary key)")
    print("   - content_json (jsonb)")
    print("   - updated_at (timestamp)")
    print("3. Verificar políticas RLS (Row Level Security)")

print("\n" + "=" * 50)
print("✅ VERIFICAÇÃO CONCLUÍDA")