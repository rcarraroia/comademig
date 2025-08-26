#!/usr/bin/env python3
import psycopg2
import json
from datetime import datetime

# Configurações do Supabase
DB_CONFIG = {
    'host': 'db.amkelczfwazutrciqtlk.supabase.co',
    'port': '5432',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'QAx3OoSZdWRfUBmR'
}

USER_ID = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'

def connect_db():
    """Conecta ao banco de dados"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return None

def debug_admin_access():
    """Debugar acesso de admin"""
    conn = connect_db()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("🔍 DEBUGGING ADMIN ACCESS")
    print("=" * 50)
    
    try:
        # 1. Verificar dados do usuário na tabela profiles
        print("\n1️⃣ DADOS DO PERFIL:")
        cursor.execute("""
            SELECT id, nome_completo, tipo_membro, status, cargo, igreja, cidade, estado
            FROM public.profiles 
            WHERE id = %s
        """, (USER_ID,))
        
        profile = cursor.fetchone()
        if profile:
            print(f"   ✅ ID: {profile[0]}")
            print(f"   ✅ Nome: {profile[1]}")
            print(f"   ✅ Tipo Membro: {profile[2]}")
            print(f"   ✅ Status: {profile[3]}")
            print(f"   ✅ Cargo: {profile[4]}")
            print(f"   ✅ Igreja: {profile[5]}")
            print(f"   ✅ Cidade: {profile[6]}")
            print(f"   ✅ Estado: {profile[7]}")
        else:
            print("   ❌ Perfil não encontrado!")
        
        # 2. Verificar roles na tabela user_roles
        print("\n2️⃣ ROLES DO USUÁRIO:")
        cursor.execute("""
            SELECT id, user_id, role, created_at
            FROM public.user_roles 
            WHERE user_id = %s
        """, (USER_ID,))
        
        roles = cursor.fetchall()
        if roles:
            for role in roles:
                print(f"   ✅ Role ID: {role[0]}")
                print(f"   ✅ User ID: {role[1]}")
                print(f"   ✅ Role: {role[2]}")
                print(f"   ✅ Criado em: {role[3]}")
        else:
            print("   ❌ Nenhuma role encontrada!")
        
        # 3. Verificar estrutura da tabela user_roles
        print("\n3️⃣ ESTRUTURA DA TABELA user_roles:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_roles' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        for col in columns:
            print(f"   📋 {col[0]} ({col[1]}) - Nullable: {col[2]}")
        
        # 4. Verificar estrutura da tabela profiles
        print("\n4️⃣ ESTRUTURA DA TABELA profiles:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        for col in columns:
            print(f"   📋 {col[0]} ({col[1]}) - Nullable: {col[2]}")
        
        # 5. Verificar se existem outras tabelas relacionadas a permissões
        print("\n5️⃣ TABELAS RELACIONADAS A PERMISSÕES:")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%role%' OR table_name LIKE '%permission%' OR table_name LIKE '%admin%')
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        for table in tables:
            print(f"   📋 {table[0]}")
        
        # 6. Verificar dados do auth.users
        print("\n6️⃣ DADOS DO AUTH.USERS:")
        cursor.execute("""
            SELECT id, email, raw_user_meta_data, created_at, last_sign_in_at
            FROM auth.users 
            WHERE id = %s
        """, (USER_ID,))
        
        auth_user = cursor.fetchone()
        if auth_user:
            print(f"   ✅ ID: {auth_user[0]}")
            print(f"   ✅ Email: {auth_user[1]}")
            print(f"   ✅ Meta Data: {auth_user[2]}")
            print(f"   ✅ Criado em: {auth_user[3]}")
            print(f"   ✅ Último login: {auth_user[4]}")
        else:
            print("   ❌ Usuário não encontrado no auth.users!")
            
    except Exception as e:
        print(f"❌ Erro durante debug: {e}")
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🚀 Iniciando debug do acesso admin...")
    debug_admin_access()
    print("\n✅ Debug concluído!")