#!/usr/bin/env python3
"""
Script para verificar a estrutura real das tabelas
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def check_table_structure():
    """Verifica a estrutura real das tabelas"""
    print("🔍 VERIFICAÇÃO DA ESTRUTURA DAS TABELAS")
    print("=" * 60)
    
    supabase = get_supabase_client()
    
    # Verificar member_types
    print("\n📋 TABELA: member_types")
    print("-" * 40)
    try:
        response = supabase.table('member_types').select('*').limit(5).execute()
        if response.data:
            print(f"✅ Registros encontrados: {len(response.data)}")
            print("📊 Estrutura dos dados:")
            for record in response.data:
                print(f"   • ID: {record.get('id', 'N/A')}")
                print(f"     Nome: {record.get('name', 'N/A')}")
                print(f"     Descrição: {record.get('description', 'N/A')}")
                print(f"     Ativo: {record.get('is_active', 'N/A')}")
                print(f"     Sort Order: {record.get('sort_order', 'N/A')}")
                print(f"     Created At: {record.get('created_at', 'N/A')}")
                print()
        else:
            print("❌ Nenhum registro encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    # Verificar subscription_plans
    print("\n📋 TABELA: subscription_plans")
    print("-" * 40)
    try:
        response = supabase.table('subscription_plans').select('*').limit(5).execute()
        if response.data:
            print(f"✅ Registros encontrados: {len(response.data)}")
            print("📊 Estrutura dos dados:")
            for record in response.data:
                print(f"   • ID: {record.get('id', 'N/A')}")
                print(f"     Título: {record.get('plan_title', 'N/A')}")
                print(f"     Preço: {record.get('price', 'N/A')}")
                print(f"     Recorrência: {record.get('recurrence', 'N/A')}")
                print(f"     Gateway ID: {record.get('plan_id_gateway', 'N/A')}")
                print()
        else:
            print("❌ Nenhum registro encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    # Verificar member_type_subscriptions
    print("\n📋 TABELA: member_type_subscriptions")
    print("-" * 40)
    try:
        response = supabase.table('member_type_subscriptions').select('*').limit(5).execute()
        if response.data:
            print(f"✅ Registros encontrados: {len(response.data)}")
            print("📊 Estrutura dos dados:")
            for record in response.data:
                print(f"   • ID: {record.get('id', 'N/A')}")
                print(f"     Member Type ID: {record.get('member_type_id', 'N/A')}")
                print(f"     Subscription Plan ID: {record.get('subscription_plan_id', 'N/A')}")
                print()
        else:
            print("❌ Nenhum registro encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    # Verificar user_subscriptions
    print("\n📋 TABELA: user_subscriptions")
    print("-" * 40)
    try:
        response = supabase.table('user_subscriptions').select('*').limit(3).execute()
        if response.data:
            print(f"✅ Registros encontrados: {len(response.data)}")
            print("📊 Estrutura dos dados:")
            for record in response.data:
                print(f"   • ID: {record.get('id', 'N/A')}")
                print(f"     User ID: {record.get('user_id', 'N/A')}")
                print(f"     Subscription Plan ID: {record.get('subscription_plan_id', 'N/A')}")
                print(f"     Member Type ID: {record.get('member_type_id', 'N/A')}")
                print(f"     Status: {record.get('status', 'N/A')}")
                print(f"     Payment Ref: {record.get('payment_reference', 'N/A')}")
                print()
        else:
            print("❌ Nenhum registro encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    # Verificar profiles com member_type_id
    print("\n📋 TABELA: profiles (com member_type_id)")
    print("-" * 40)
    try:
        response = supabase.table('profiles').select('id, nome_completo, cargo, member_type_id').not_.is_('member_type_id', 'null').execute()
        if response.data:
            print(f"✅ Profiles com member_type_id: {len(response.data)}")
            print("📊 Dados:")
            for record in response.data:
                print(f"   • Nome: {record.get('nome_completo', 'N/A')}")
                print(f"     Cargo: {record.get('cargo', 'N/A')}")
                print(f"     Member Type ID: {record.get('member_type_id', 'N/A')}")
                print()
        else:
            print("❌ Nenhum profile com member_type_id encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ VERIFICAÇÃO CONCLUÍDA")

if __name__ == "__main__":
    check_table_structure()