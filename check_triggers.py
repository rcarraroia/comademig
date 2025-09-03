#!/usr/bin/env python3

import os
import requests

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_triggers():
    print("🔍 INVESTIGANDO TRIGGERS E FUNÇÕES...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("❌ ERRO IDENTIFICADO:")
    print('record "new" has no field "updated_at"')
    print("\n💡 ISSO INDICA QUE HÁ UM TRIGGER OU FUNÇÃO TENTANDO ACESSAR 'updated_at'")
    
    print("\n🔧 SOLUÇÃO NECESSÁRIA:")
    print("Execute estas queries no painel do Supabase para corrigir o trigger:")
    
    print("\n-- 1. REMOVER TRIGGER PROBLEMÁTICO:")
    print("DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;")
    print("DROP FUNCTION IF EXISTS update_content_timestamp();")
    print("DROP FUNCTION IF EXISTS update_content_management_timestamp();")
    
    print("\n-- 2. CRIAR FUNÇÃO CORRIGIDA:")
    print("""CREATE OR REPLACE FUNCTION update_content_management_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Usar o campo correto: last_updated_at (não updated_at)
  NEW.last_updated_at = now();
  
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NOT NULL THEN
    NEW.last_updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;""")
    
    print("\n-- 3. CRIAR TRIGGER CORRIGIDO:")
    print("""CREATE TRIGGER update_content_management_timestamp
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE FUNCTION update_content_management_timestamp();""")
    
    print("\n-- 4. TESTAR O TRIGGER:")
    print("UPDATE public.content_management SET content_json = '{\"test\": \"trigger_test\"}' WHERE page_name = 'home';")
    
    print("\n🎯 CAUSA RAIZ:")
    print("O trigger original foi criado com referência ao campo 'updated_at'")
    print("mas a tabela usa 'last_updated_at'. Isso causa o erro quando o trigger executa.")
    
    print("\n⚠️  IMPORTANTE:")
    print("Após executar essas queries, o gerenciador de conteúdo deve funcionar!")

if __name__ == "__main__":
    check_triggers()