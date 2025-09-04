#!/usr/bin/env python3

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def get_db_connection():
    """Conectar diretamente ao PostgreSQL do Supabase"""
    try:
        # Construir connection string do Supabase
        supabase_url = os.getenv("VITE_SUPABASE_URL")
        if not supabase_url:
            raise Exception("VITE_SUPABASE_URL não encontrada")
        
        # Extrair host do URL do Supabase
        # URL format: https://project.supabase.co
        host = supabase_url.replace("https://", "").replace("http://", "")
        
        # Usar a chave de serviço se disponível, senão usar a pública
        password = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
        
        if not password:
            raise Exception("Chave do Supabase não encontrada")
        
        # Conectar ao banco
        conn = psycopg2.connect(
            host=host,
            port=5432,
            database="postgres",
            user="postgres",
            password=password,
            cursor_factory=RealDictCursor
        )
        
        return conn
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return None

def inspect_storage_structure():
    """Inspecionar estrutura completa do storage"""
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        print("🔍 INSPEÇÃO DIRETA DO BANCO SUPABASE")
        print("=" * 70)
        
        # 1. Verificar buckets existentes
        print("\n1️⃣ BUCKETS EXISTENTES:")
        cursor.execute("""
            SELECT id, name, public, created_at, updated_at 
            FROM storage.buckets 
            ORDER BY created_at;
        """)
        
        buckets = cursor.fetchall()
        if buckets:
            print(f"✅ Total de buckets: {len(buckets)}")
            for bucket in buckets:
                print(f"   - {bucket['name']}: público={bucket['public']}, criado={bucket['created_at']}")
        else:
            print("❌ Nenhum bucket encontrado")
        
        # 2. Verificar bucket content-images especificamente
        print("\n2️⃣ VERIFICAÇÃO ESPECÍFICA DO BUCKET content-images:")
        cursor.execute("""
            SELECT * FROM storage.buckets 
            WHERE name = 'content-images';
        """)
        
        content_bucket = cursor.fetchone()
        if content_bucket:
            print("✅ Bucket content-images EXISTE:")
            print(f"   - ID: {content_bucket['id']}")
            print(f"   - Público: {content_bucket['public']}")
            print(f"   - Criado: {content_bucket['created_at']}")
            print(f"   - Atualizado: {content_bucket['updated_at']}")
        else:
            print("❌ Bucket content-images NÃO ENCONTRADO")
        
        # 3. Verificar políticas RLS para storage.objects
        print("\n3️⃣ POLÍTICAS RLS PARA storage.objects:")
        cursor.execute("""
            SELECT 
                policyname, 
                cmd, 
                roles,
                qual,
                with_check
            FROM pg_policies 
            WHERE schemaname = 'storage' AND tablename = 'objects'
            ORDER BY policyname;
        """)
        
        policies = cursor.fetchall()
        if policies:
            print(f"✅ Total de políticas: {len(policies)}")
            for policy in policies:
                print(f"\n   📋 Política: {policy['policyname']}")
                print(f"      Comando: {policy['cmd']}")
                print(f"      Roles: {policy['roles']}")
                if policy['qual']:
                    print(f"      Condição: {policy['qual']}")
                if policy['with_check']:
                    print(f"      With Check: {policy['with_check']}")
        else:
            print("❌ Nenhuma política RLS encontrada")
        
        # 4. Verificar políticas específicas para content-images
        print("\n4️⃣ POLÍTICAS ESPECÍFICAS PARA content-images:")
        cursor.execute("""
            SELECT 
                policyname, 
                cmd, 
                roles,
                qual,
                with_check
            FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND (qual LIKE '%content-images%' OR with_check LIKE '%content-images%')
            ORDER BY policyname;
        """)
        
        content_policies = cursor.fetchall()
        if content_policies:
            print(f"✅ Políticas para content-images: {len(content_policies)}")
            for policy in content_policies:
                print(f"\n   🎯 {policy['policyname']} ({policy['cmd']})")
                print(f"      Roles: {policy['roles']}")
                print(f"      Condição: {policy['qual']}")
                if policy['with_check']:
                    print(f"      With Check: {policy['with_check']}")
        else:
            print("❌ Nenhuma política específica para content-images")
        
        # 5. Verificar status do RLS na tabela storage.objects
        print("\n5️⃣ STATUS DO RLS:")
        cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                rowsecurity,
                forcerowsecurity
            FROM pg_tables 
            WHERE schemaname = 'storage' AND tablename = 'objects';
        """)
        
        rls_status = cursor.fetchone()
        if rls_status:
            print("✅ Status RLS da tabela storage.objects:")
            print(f"   - RLS Ativado: {rls_status['rowsecurity']}")
            print(f"   - RLS Forçado: {rls_status['forcerowsecurity']}")
        else:
            print("❌ Não foi possível verificar status RLS")
        
        # 6. Verificar objetos no bucket content-images
        print("\n6️⃣ OBJETOS NO BUCKET content-images:")
        cursor.execute("""
            SELECT name, bucket_id, created_at, updated_at, last_accessed_at
            FROM storage.objects 
            WHERE bucket_id = 'content-images'
            ORDER BY created_at DESC
            LIMIT 10;
        """)
        
        objects = cursor.fetchall()
        if objects:
            print(f"✅ Objetos encontrados: {len(objects)}")
            for obj in objects:
                print(f"   - {obj['name']} (criado: {obj['created_at']})")
        else:
            print("❌ Nenhum objeto no bucket content-images")
        
        # 7. Verificar todas as tabelas do schema storage
        print("\n7️⃣ TABELAS DO SCHEMA STORAGE:")
        cursor.execute("""
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'storage'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        if tables:
            print(f"✅ Tabelas no schema storage: {len(tables)}")
            for table in tables:
                print(f"   - {table['table_name']} ({table['table_type']})")
        else:
            print("❌ Schema storage não encontrado")
        
        print("\n" + "=" * 70)
        print("✅ INSPEÇÃO COMPLETA CONCLUÍDA")
        
    except Exception as e:
        print(f"❌ Erro durante inspeção: {e}")
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    inspect_storage_structure()