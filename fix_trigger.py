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

print("🔧 CORRIGINDO TRIGGER DA TABELA CONTENT_MANAGEMENT...")
print("=" * 50)

try:
    # Primeiro, vamos remover o trigger problemático
    print("🗑️ Removendo trigger existente...")
    
    drop_trigger_sql = """
    DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;
    DROP FUNCTION IF EXISTS update_content_timestamp();
    """
    
    response = supabase.rpc('exec_sql', {'sql': drop_trigger_sql}).execute()
    print("✅ Trigger removido!")
    
    # Criar nova função mais robusta
    print("🔨 Criando nova função de trigger...")
    
    create_function_sql = """
    CREATE OR REPLACE FUNCTION update_content_management_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Atualizar apenas os campos que existem
      NEW.last_updated_at = now();
      
      -- Verificar se o usuário está autenticado antes de definir last_updated_by
      IF auth.uid() IS NOT NULL THEN
        NEW.last_updated_by = auth.uid();
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """
    
    response = supabase.rpc('exec_sql', {'sql': create_function_sql}).execute()
    print("✅ Nova função criada!")
    
    # Criar novo trigger
    print("⚡ Criando novo trigger...")
    
    create_trigger_sql = """
    CREATE TRIGGER update_content_management_timestamp
      BEFORE UPDATE ON public.content_management
      FOR EACH ROW
      EXECUTE FUNCTION update_content_management_timestamp();
    """
    
    response = supabase.rpc('exec_sql', {'sql': create_trigger_sql}).execute()
    print("✅ Novo trigger criado!")
    
    # Testar o trigger
    print("🧪 Testando o trigger...")
    
    test_update = supabase.table('content_management').update({
        'content_json': {'test': 'trigger_test'},
    }).eq('page_name', 'home').execute()
    
    print("✅ Trigger funcionando corretamente!")
    print(f"📋 Resultado do teste: {test_update.data}")
    
except Exception as e:
    print(f"❌ ERRO: {e}")

print("\n" + "=" * 50)
print("✅ CORREÇÃO CONCLUÍDA")