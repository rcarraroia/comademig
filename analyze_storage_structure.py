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

print("🔍 ANÁLISE COMPLETA DA ESTRUTURA DE STORAGE DO SUPABASE")
print("=" * 70)

# 1. Verificar buckets existentes
print("\n1️⃣ BUCKETS EXISTENTES:")
try:
    buckets_response = supabase.storage.list_buckets()
    if buckets_response:
        print(f"✅ Total de buckets: {len(buckets_response)}")
        for bucket in buckets_response:
            print(f"   - {bucket.name}: público={bucket.public}, criado={bucket.created_at}")
    else:
        print("❌ Nenhum bucket encontrado")
except Exception as e:
    print(f"❌ Erro ao listar buckets: {e}")

# 2. Verificar estrutura das tabelas de storage
print("\n2️⃣ ESTRUTURA DAS TABELAS DE STORAGE:")

# Verificar tabela storage.buckets
print("\n🔍 Tabela storage.buckets:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'storage' AND table_name = 'buckets'
        ORDER BY ordinal_position;
        '''
    }).execute()
    
    if result.data:
        print("✅ Estrutura da tabela storage.buckets:")
        for col in result.data:
            print(f"   - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
    else:
        print("❌ Tabela storage.buckets não encontrada ou sem acesso")
except Exception as e:
    print(f"❌ Erro ao verificar storage.buckets: {e}")

# Verificar se existe tabela de políticas
print("\n🔍 Tabelas relacionadas a políticas:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_schema IN ('storage', 'auth') 
        AND table_name LIKE '%polic%'
        ORDER BY table_schema, table_name;
        '''
    }).execute()
    
    if result.data:
        print("✅ Tabelas de políticas encontradas:")
        for table in result.data:
            print(f"   - {table['table_schema']}.{table['table_name']}")
    else:
        print("❌ Nenhuma tabela de políticas encontrada")
except Exception as e:
    print(f"❌ Erro ao verificar tabelas de políticas: {e}")

# 3. Verificar políticas RLS existentes para storage
print("\n3️⃣ POLÍTICAS RLS PARA STORAGE:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE schemaname = 'storage'
        ORDER BY tablename, policyname;
        '''
    }).execute()
    
    if result.data:
        print("✅ Políticas RLS encontradas:")
        for policy in result.data:
            print(f"   - {policy['tablename']}.{policy['policyname']}: {policy['cmd']} para {policy['roles']}")
    else:
        print("❌ Nenhuma política RLS encontrada para storage")
except Exception as e:
    print(f"❌ Erro ao verificar políticas RLS: {e}")

# 4. Verificar estrutura completa do schema storage
print("\n4️⃣ TODAS AS TABELAS DO SCHEMA STORAGE:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'storage'
        ORDER BY table_name;
        '''
    }).execute()
    
    if result.data:
        print("✅ Tabelas no schema storage:")
        for table in result.data:
            print(f"   - {table['table_name']} ({table['table_type']})")
    else:
        print("❌ Schema storage não encontrado ou sem acesso")
except Exception as e:
    print(f"❌ Erro ao verificar schema storage: {e}")

# 5. Verificar permissões do usuário atual
print("\n5️⃣ PERMISSÕES DO USUÁRIO ATUAL:")
try:
    # Verificar se consegue acessar storage.buckets diretamente
    result = supabase.rpc('execute_sql', {
        'query': 'SELECT COUNT(*) as total FROM storage.buckets;'
    }).execute()
    
    if result.data:
        print(f"✅ Acesso direto a storage.buckets: {result.data[0]['total']} buckets")
    else:
        print("❌ Sem acesso direto a storage.buckets")
except Exception as e:
    print(f"❌ Erro ao verificar acesso direto: {e}")

# 6. Verificar se existe bucket content-images
print("\n6️⃣ VERIFICAÇÃO ESPECÍFICA DO BUCKET content-images:")
try:
    buckets = supabase.storage.list_buckets()
    content_bucket = None
    
    if buckets:
        content_bucket = next((b for b in buckets if b.name == 'content-images'), None)
    
    if content_bucket:
        print(f"✅ Bucket content-images EXISTE:")
        print(f"   - ID: {content_bucket.id}")
        print(f"   - Público: {content_bucket.public}")
        print(f"   - Criado: {content_bucket.created_at}")
        
        # Tentar listar arquivos no bucket
        try:
            files = supabase.storage.from_('content-images').list()
            print(f"   - Arquivos: {len(files) if files else 0}")
        except Exception as e:
            print(f"   - Erro ao listar arquivos: {e}")
            
    else:
        print("❌ Bucket content-images NÃO EXISTE")
        
except Exception as e:
    print(f"❌ Erro ao verificar bucket content-images: {e}")

# 7. VERIFICAÇÃO DETALHADA DE RLS PARA content-images
print("\n7️⃣ ANÁLISE ESPECÍFICA DE RLS PARA content-images:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (qual LIKE '%content-images%' OR with_check LIKE '%content-images%')
        ORDER BY policyname;
        '''
    }).execute()
    
    if result.data:
        print("✅ Políticas RLS específicas para content-images:")
        for policy in result.data:
            print(f"   - Nome: {policy['policyname']}")
            print(f"     Comando: {policy['cmd']}")
            print(f"     Roles: {policy['roles']}")
            print(f"     Condição: {policy['qual']}")
            print(f"     With Check: {policy['with_check']}")
            print()
    else:
        print("❌ Nenhuma política RLS específica para content-images encontrada")
except Exception as e:
    print(f"❌ Erro ao verificar políticas específicas: {e}")

# 8. VERIFICAR STATUS DO RLS NA TABELA storage.objects
print("\n8️⃣ STATUS DO RLS NA TABELA storage.objects:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT 
            schemaname,
            tablename,
            rowsecurity,
            forcerowsecurity
        FROM pg_tables 
        WHERE schemaname = 'storage' AND tablename = 'objects';
        '''
    }).execute()
    
    if result.data:
        table_info = result.data[0]
        print(f"✅ Status RLS da tabela storage.objects:")
        print(f"   - RLS Ativado: {table_info['rowsecurity']}")
        print(f"   - RLS Forçado: {table_info['forcerowsecurity']}")
    else:
        print("❌ Não foi possível verificar status RLS")
except Exception as e:
    print(f"❌ Erro ao verificar status RLS: {e}")

# 9. VERIFICAR TODAS AS POLÍTICAS DE STORAGE.OBJECTS
print("\n9️⃣ TODAS AS POLÍTICAS DA TABELA storage.objects:")
try:
    result = supabase.rpc('execute_sql', {
        'query': '''
        SELECT 
            policyname, 
            cmd, 
            roles,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
        ORDER BY policyname;
        '''
    }).execute()
    
    if result.data:
        print(f"✅ Total de políticas em storage.objects: {len(result.data)}")
        for policy in result.data:
            print(f"   - {policy['policyname']} ({policy['cmd']})")
            print(f"     Roles: {policy['roles']}")
            if policy['qual']:
                print(f"     Condição: {policy['qual']}")
            print()
    else:
        print("❌ Nenhuma política encontrada em storage.objects")
except Exception as e:
    print(f"❌ Erro ao verificar todas as políticas: {e}")

# 10. TESTE DE CONECTIVIDADE E AUTENTICAÇÃO
print("\n🔟 TESTE DE CONECTIVIDADE E AUTENTICAÇÃO:")
try:
    # Verificar se consegue acessar informações do usuário atual
    user = supabase.auth.get_user()
    if user and user.user:
        print(f"✅ Usuário autenticado: {user.user.email}")
        print(f"   - ID: {user.user.id}")
        print(f"   - Role: {user.user.role if hasattr(user.user, 'role') else 'N/A'}")
    else:
        print("❌ Usuário não autenticado ou erro na autenticação")
        
    # Testar acesso básico ao storage
    try:
        buckets_test = supabase.storage.list_buckets()
        print(f"✅ Acesso ao storage funcionando: {len(buckets_test)} buckets acessíveis")
    except Exception as e:
        print(f"❌ Erro no acesso ao storage: {e}")
        
except Exception as e:
    print(f"❌ Erro no teste de conectividade: {e}")

print("\n" + "=" * 70)
print("✅ ANÁLISE COMPLETA E DETALHADA CONCLUÍDA")
print("\n🎯 PRÓXIMOS PASSOS:")
print("1. Analisar os resultados acima")
print("2. Identificar conflitos de políticas RLS")
print("3. Criar solução específica sem quebrar funcionalidades existentes")
print("4. Aplicar correções de forma segura e controlada")