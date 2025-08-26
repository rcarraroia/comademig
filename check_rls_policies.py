#!/usr/bin/env python3
import psycopg2

# Configurações do Supabase
DB_CONFIG = {
    'host': 'db.amkelczfwazutrciqtlk.supabase.co',
    'port': '5432',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'QAx3OoSZdWRfUBmR'
}

def check_rls_policies():
    """Verificar políticas RLS"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("🔍 VERIFICANDO POLÍTICAS RLS")
    print("=" * 50)
    
    try:
        # 1. Verificar se RLS está habilitado
        print("\n1️⃣ STATUS RLS DAS TABELAS:")
        cursor.execute("""
            SELECT schemaname, tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('profiles', 'user_roles')
            ORDER BY tablename
        """)
        
        tables = cursor.fetchall()
        for table in tables:
            rls_status = "✅ HABILITADO" if table[2] else "❌ DESABILITADO"
            print(f"   📋 {table[1]}: {rls_status}")
        
        # 2. Verificar políticas da tabela profiles
        print("\n2️⃣ POLÍTICAS DA TABELA profiles:")
        cursor.execute("""
            SELECT policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'profiles'
            ORDER BY policyname
        """)
        
        policies = cursor.fetchall()
        if policies:
            for policy in policies:
                print(f"   📋 Nome: {policy[0]}")
                print(f"      Tipo: {policy[1]}")
                print(f"      Roles: {policy[2]}")
                print(f"      Comando: {policy[3]}")
                print(f"      Condição: {policy[4]}")
                print(f"      With Check: {policy[5]}")
                print()
        else:
            print("   ❌ Nenhuma política encontrada!")
        
        # 3. Verificar políticas da tabela user_roles
        print("\n3️⃣ POLÍTICAS DA TABELA user_roles:")
        cursor.execute("""
            SELECT policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'user_roles'
            ORDER BY policyname
        """)
        
        policies = cursor.fetchall()
        if policies:
            for policy in policies:
                print(f"   📋 Nome: {policy[0]}")
                print(f"      Tipo: {policy[1]}")
                print(f"      Roles: {policy[2]}")
                print(f"      Comando: {policy[3]}")
                print(f"      Condição: {policy[4]}")
                print(f"      With Check: {policy[5]}")
                print()
        else:
            print("   ❌ Nenhuma política encontrada!")
            
        # 4. Testar acesso direto como authenticated user
        print("\n4️⃣ TESTANDO ACESSO COMO AUTHENTICATED:")
        cursor.execute("SET ROLE authenticated")
        cursor.execute("SET request.jwt.claims TO '{\"sub\": \"c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a\"}'")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM public.profiles WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'")
            count = cursor.fetchone()[0]
            print(f"   ✅ Acesso ao profiles: {count} registro(s)")
        except Exception as e:
            print(f"   ❌ Erro ao acessar profiles: {e}")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM public.user_roles WHERE user_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'")
            count = cursor.fetchone()[0]
            print(f"   ✅ Acesso ao user_roles: {count} registro(s)")
        except Exception as e:
            print(f"   ❌ Erro ao acessar user_roles: {e}")
            
    except Exception as e:
        print(f"❌ Erro durante verificação: {e}")
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    check_rls_policies()