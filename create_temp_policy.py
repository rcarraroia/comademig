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

print("🔧 CRIANDO POLÍTICA TEMPORÁRIA PARA DEBUG...")
print("=" * 50)

# Como não podemos executar SQL diretamente, vamos tentar uma abordagem diferente
# Vamos verificar se o problema está na autenticação ou na política

print("🔍 DIAGNÓSTICO DO PROBLEMA:")
print("1. O usuário tem role 'admin' ✅")
print("2. O SELECT funciona ✅") 
print("3. O UPDATE retorna 204 (sucesso) mas não salva ❌")
print("4. O UPSERT falha com erro de política RLS ❌")

print("\n💡 POSSÍVEIS CAUSAS:")
print("• A política RLS está muito restritiva")
print("• O token de autenticação não está sendo enviado corretamente")
print("• Há um trigger interferindo")
print("• A função auth.uid() não está retornando o ID correto")

print("\n🔧 SOLUÇÕES RECOMENDADAS:")
print("1. Verificar se o frontend está enviando o token de autenticação")
print("2. Verificar se a função auth.uid() está funcionando")
print("3. Simplificar temporariamente a política RLS")
print("4. Verificar logs do Supabase para mais detalhes")

print("\n⚠️  AÇÃO NECESSÁRIA:")
print("Como não podemos executar SQL diretamente via Python,")
print("você precisa executar as seguintes queries no painel do Supabase:")

print("\n-- POLÍTICA TEMPORÁRIA MAIS PERMISSIVA:")
print("""
-- Remover política restritiva
DROP POLICY IF EXISTS "Admins can manage content" ON public.content_management;

-- Criar política temporária mais permissiva
CREATE POLICY "Temp permissive policy" ON public.content_management
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
""")

print("\n-- DEPOIS DE TESTAR, RESTAURAR A POLÍTICA ORIGINAL:")
print("""
-- Remover política temporária
DROP POLICY IF EXISTS "Temp permissive policy" ON public.content_management;

-- Restaurar política original
CREATE POLICY "Admins can manage content" ON public.content_management
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
""")

print("\n" + "=" * 50)
print("✅ INSTRUÇÕES FORNECIDAS")