#!/usr/bin/env python3

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(url, key)

print("🔍 DIAGNÓSTICO PROFUNDO - GERENCIADOR DE CONTEÚDO")
print("=" * 60)

# 1. Verificar estrutura da tabela
print("\n1️⃣ ESTRUTURA DA TABELA content_management:")
try:
    # Verificar se a tabela existe e sua estrutura
    result = supabase.rpc('get_table_info', {'table_name': 'content_management'}).execute()
    print("✅ Tabela existe")
except Exception as e:
    print(f"❌ Erro ao verificar tabela: {e}")

# 2. Verificar dados existentes
print("\n2️⃣ DADOS EXISTENTES:")
try:
    result = supabase.table('content_management').select('page_name, created_at, last_updated_at').execute()
    print(f"📊 Total de registros: {len(result.data)}")
    for row in result.data:
        print(f"   - {row['page_name']}: criado em {row['created_at']}")
except Exception as e:
    print(f"❌ Erro ao buscar dados: {e}")

# 3. Verificar políticas RLS
print("\n3️⃣ POLÍTICAS RLS ATIVAS:")
try:
    policies_query = """
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'content_management'
    ORDER BY policyname;
    """
    result = supabase.rpc('execute_sql', {'query': policies_query}).execute()
    print("✅ Políticas encontradas:")
    for policy in result.data:
        print(f"   - {policy['policyname']}: {policy['cmd']} para {policy['roles']}")
except Exception as e:
    print(f"❌ Erro ao verificar políticas: {e}")

# 4. Verificar triggers
print("\n4️⃣ TRIGGERS ATIVOS:")
try:
    triggers_query = """
    SELECT trigger_name, event_manipulation, action_timing, action_statement
    FROM information_schema.triggers 
    WHERE event_object_table = 'content_management'
    ORDER BY trigger_name;
    """
    result = supabase.rpc('execute_sql', {'query': triggers_query}).execute()
    print("✅ Triggers encontrados:")
    for trigger in result.data:
        print(f"   - {trigger['trigger_name']}: {trigger['event_manipulation']} {trigger['action_timing']}")
except Exception as e:
    print(f"❌ Erro ao verificar triggers: {e}")

# 5. Testar operações específicas
print("\n5️⃣ TESTE DE OPERAÇÕES:")

# Teste SELECT
print("\n🔍 Testando SELECT...")
try:
    result = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
    print(f"✅ SELECT funcionou: {len(result.data)} registros")
except Exception as e:
    print(f"❌ SELECT falhou: {e}")

# Teste UPDATE
print("\n🔍 Testando UPDATE...")
try:
    test_content = {
        'banner_principal': {
            'titulo_principal': 'TESTE DIAGNÓSTICO',
            'subtitulo': 'Teste de atualização',
            'texto_botao': 'Teste',
            'link_botao': '/teste'
        }
    }
    
    result = supabase.table('content_management').update({
        'content_json': test_content,
        'last_updated_at': 'now()'
    }).eq('page_name', 'home').execute()
    
    print(f"✅ UPDATE funcionou: {result.data}")
except Exception as e:
    print(f"❌ UPDATE falhou: {e}")

# Teste INSERT (se não existir registro)
print("\n🔍 Testando INSERT...")
try:
    test_insert = {
        'page_name': 'teste_diagnostico',
        'content_json': {'teste': 'diagnóstico'},
        'last_updated_at': 'now()'
    }
    
    result = supabase.table('content_management').insert(test_insert).execute()
    print(f"✅ INSERT funcionou: {result.data}")
    
    # Limpar teste
    supabase.table('content_management').delete().eq('page_name', 'teste_diagnostico').execute()
    print("🧹 Registro de teste removido")
    
except Exception as e:
    print(f"❌ INSERT falhou: {e}")

# 6. Verificar autenticação atual
print("\n6️⃣ VERIFICAÇÃO DE AUTENTICAÇÃO:")
try:
    # Tentar obter usuário atual (isso só funciona se estivermos autenticados)
    user = supabase.auth.get_user()
    if user:
        print(f"✅ Usuário autenticado: {user.user.email if user.user else 'Sem email'}")
    else:
        print("❌ Nenhum usuário autenticado")
except Exception as e:
    print(f"⚠️ Não foi possível verificar autenticação: {e}")

print("\n" + "=" * 60)
print("✅ DIAGNÓSTICO CONCLUÍDO")
print("\nPróximos passos baseados nos resultados acima...")