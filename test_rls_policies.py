#!/usr/bin/env python3

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(url, key)

print("🔍 TESTANDO POLÍTICAS RLS...")
print("=" * 50)

# Primeiro, vamos ver se conseguimos ler a tabela
try:
    print("📖 TESTANDO SELECT...")
    select_response = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
    print("✅ SELECT funcionou!")
    print(f"📋 Dados: {select_response.data}")
    
    if select_response.data:
        record_id = select_response.data[0].get('id')
        print(f"🆔 ID do registro: {record_id}")
        
        # Testar UPDATE usando o ID
        print("\n🔄 TESTANDO UPDATE POR ID...")
        update_by_id = supabase.table('content_management').update({
            'content_json': {'test': 'update_by_id'},
            'last_updated_at': '2024-02-09T15:00:00Z'
        }).eq('id', record_id).execute()
        print("✅ UPDATE por ID funcionou!")
        print(f"📋 Resposta: {update_by_id.data}")
        
        # Testar UPDATE usando page_name
        print("\n🔄 TESTANDO UPDATE POR PAGE_NAME...")
        update_by_name = supabase.table('content_management').update({
            'content_json': {'test': 'update_by_name'},
            'last_updated_at': '2024-02-09T15:01:00Z'
        }).eq('page_name', 'home').execute()
        print("✅ UPDATE por page_name funcionou!")
        print(f"📋 Resposta: {update_by_name.data}")
        
except Exception as e:
    print(f"❌ ERRO: {e}")
    
    # Vamos tentar verificar as políticas
    print("\n🔍 VERIFICANDO POLÍTICAS...")
    try:
        # Tentar uma operação simples
        simple_select = supabase.table('content_management').select('page_name').limit(1).execute()
        print(f"📋 SELECT simples: {simple_select.data}")
    except Exception as policy_error:
        print(f"❌ Erro de política: {policy_error}")

print("\n" + "=" * 50)
print("✅ TESTE CONCLUÍDO")