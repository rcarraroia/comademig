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

USER_ID = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a'

def test_policies():
    """Testar se as políticas corrigidas funcionam"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("🧪 TESTANDO POLÍTICAS CORRIGIDAS")
    print("=" * 50)
    
    try:
        # Simular acesso como usuário autenticado
        cursor.execute("SET ROLE authenticated")
        cursor.execute("SELECT set_config('request.jwt.claims', %s, true)", (f'{{"sub": "{USER_ID}"}}',))
        
        # 1. Testar acesso ao próprio perfil
        print("\n1️⃣ TESTANDO ACESSO AO PRÓPRIO PERFIL:")
        cursor.execute("""
            SELECT id, nome_completo, tipo_membro, status, cargo
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
        else:
            print("   ❌ Não conseguiu acessar o próprio perfil!")
        
        # 2. Testar acesso às próprias roles
        print("\n2️⃣ TESTANDO ACESSO ÀS PRÓPRIAS ROLES:")
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
            print("   ❌ Não conseguiu acessar as próprias roles!")
        
        # 3. Testar acesso admin a outros perfis (se for admin)
        print("\n3️⃣ TESTANDO ACESSO ADMIN A OUTROS PERFIS:")
        cursor.execute("SELECT COUNT(*) FROM public.profiles")
        count = cursor.fetchone()[0]
        print(f"   ✅ Total de perfis acessíveis: {count}")
        
        # 4. Testar acesso admin a todas as roles (se for admin)
        print("\n4️⃣ TESTANDO ACESSO ADMIN A TODAS AS ROLES:")
        cursor.execute("SELECT COUNT(*) FROM public.user_roles")
        count = cursor.fetchone()[0]
        print(f"   ✅ Total de roles acessíveis: {count}")
        
    except Exception as e:
        print(f"❌ Erro durante teste: {e}")
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    test_policies()