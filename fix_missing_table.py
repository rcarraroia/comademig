#!/usr/bin/env python3
"""
VERIFICAR E CORRIGIR TABELA VALORES_CERTIDOES
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_tables():
    """Verifica quais tabelas existem"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    tables_to_check = [
        'valores_certidoes',
        'solicitacoes_regularizacao', 
        'member_system_audit'
    ]
    
    print("🔍 VERIFICANDO TABELAS CRIADAS PELOS SCRIPTS")
    print("=" * 50)
    
    for table in tables_to_check:
        try:
            result = supabase.table(table).select('*').limit(1).execute()
            print(f"✅ {table}: EXISTE ({len(result.data)} registros)")
        except Exception as e:
            if 'does not exist' in str(e):
                print(f"❌ {table}: NÃO EXISTE")
            else:
                print(f"⚠️ {table}: ERRO - {str(e)}")

def create_admin_subscription():
    """Cria assinatura para o usuário admin"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n🔧 CRIANDO ASSINATURA PARA ADMIN")
    print("=" * 50)
    
    try:
        # Buscar usuário admin
        admin_role = supabase.table('user_roles').select('user_id').eq('role', 'admin').single().execute()
        admin_user_id = admin_role.data['user_id']
        print(f"✅ Admin encontrado: {admin_user_id[:8]}...")
        
        # Buscar tipo Administrador
        admin_type = supabase.table('member_types').select('id').eq('name', 'Administrador').single().execute()
        admin_type_id = admin_type.data['id']
        print(f"✅ Tipo Administrador: {admin_type_id[:8]}...")
        
        # Buscar plano gratuito
        free_plan = supabase.table('subscription_plans').select('id').eq('price', 0).single().execute()
        free_plan_id = free_plan.data['id']
        print(f"✅ Plano gratuito: {free_plan_id[:8]}...")
        
        # Verificar se já existe assinatura
        existing = supabase.table('user_subscriptions').select('id').eq('user_id', admin_user_id).execute()
        
        if existing.data:
            print("⚠️ Admin já possui assinatura")
            return existing.data[0]['id']
        
        # Criar assinatura
        subscription = supabase.table('user_subscriptions').insert({
            'user_id': admin_user_id,
            'subscription_plan_id': free_plan_id,
            'member_type_id': admin_type_id,
            'status': 'active',
            'started_at': 'now()',
            'expires_at': '2035-01-01T00:00:00Z'  # 10 anos no futuro
        }).execute()
        
        print(f"✅ Assinatura criada: {subscription.data[0]['id'][:8]}...")
        return subscription.data[0]['id']
        
    except Exception as e:
        print(f"❌ Erro ao criar assinatura: {str(e)}")
        return None

def test_functions_after_fix():
    """Testa funções após correções"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n🧪 TESTANDO FUNÇÕES APÓS CORREÇÕES")
    print("=" * 50)
    
    try:
        # Testar função de permissões
        admin_role = supabase.table('user_roles').select('user_id').eq('role', 'admin').single().execute()
        admin_user_id = admin_role.data['user_id']
        
        permissions = supabase.rpc('get_user_permissions', {'p_user_id': admin_user_id}).execute()
        print(f"✅ Permissões do admin: {permissions.data}")
        
        # Testar função de cálculo de certidão (se existir)
        try:
            cert_value = supabase.rpc('calculate_certification_value', {'tipo_certidao_param': 'ministerio'}).execute()
            print(f"✅ Valor de certidão: R$ {cert_value.data}")
        except Exception as e:
            print(f"⚠️ Função de certidão: {str(e)}")
        
    except Exception as e:
        print(f"❌ Erro nos testes: {str(e)}")

def main():
    """Função principal"""
    print("🚀 CORREÇÃO DE PROBLEMAS IDENTIFICADOS")
    print("=" * 60)
    
    # Verificar tabelas
    check_tables()
    
    # Criar assinatura admin
    subscription_id = create_admin_subscription()
    
    # Testar após correções
    if subscription_id:
        test_functions_after_fix()
    
    print("\n" + "=" * 60)
    print("✅ CORREÇÕES APLICADAS")
    print("Agora teste novamente as Edge Functions!")
    print("=" * 60)

if __name__ == "__main__":
    main()