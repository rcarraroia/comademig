#!/usr/bin/env python3
"""
Script para testar se o hook useMemberTypeWithPlan está funcionando
USANDO APENAS LEITURA conforme regras do Supabase
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def test_unified_query():
    """Testa a query exata do hook useMemberTypeWithPlan"""
    print("🧪 TESTANDO HOOK useMemberTypeWithPlan")
    print("=" * 60)
    print("⚠️  USANDO APENAS LEITURA - NÃO EXECUTANDO OPERAÇÕES DE ESCRITA")
    print()
    
    supabase = get_supabase_client()
    
    print("📋 TESTANDO QUERY UNIFICADA:")
    print("-" * 50)
    
    try:
        # Query exata do hook
        response = supabase.table('member_types').select('''
          id,
          name,
          description,
          sort_order,
          is_active,
          created_at,
          updated_at,
          member_type_subscriptions!inner(
            subscription_plans!inner(
              id,
              plan_title,
              price,
              recurrence,
              plan_id_gateway,
              description
            )
          )
        ''').eq('is_active', True).order('sort_order', ascending=True).execute()
        
        if response.data:
            print(f"✅ Query funcionou! Retornou {len(response.data)} registros")
            print("\n📊 DADOS RETORNADOS:")
            
            for item in response.data:
                name = item.get('name', 'N/A')
                subscriptions = item.get('member_type_subscriptions', [])
                
                print(f"\n   • TIPO: {name}")
                print(f"     ID: {item.get('id', 'N/A')}")
                print(f"     Descrição: {item.get('description', 'N/A')}")
                print(f"     Sort Order: {item.get('sort_order', 'N/A')}")
                
                if subscriptions:
                    for sub in subscriptions:
                        plan = sub.get('subscription_plans', {})
                        print(f"     PLANO: {plan.get('plan_title', 'N/A')}")
                        print(f"     Preço: R$ {plan.get('price', 'N/A')}")
                        print(f"     Recorrência: {plan.get('recurrence', 'N/A')}")
                else:
                    print("     ❌ NENHUM PLANO ASSOCIADO")
        else:
            print("❌ Query não retornou dados")
            print("🔍 Possíveis causas:")
            print("   1. Nenhum member_type tem is_active = true")
            print("   2. Nenhum relacionamento em member_type_subscriptions")
            print("   3. Nenhum subscription_plan associado")
            
    except Exception as e:
        print(f"❌ Erro na query: {str(e)}")
    
    print("\n📋 TESTANDO COMPONENTES SEPARADAMENTE:")
    print("-" * 50)
    
    # Testar member_types
    try:
        response = supabase.table('member_types').select('*').eq('is_active', True).execute()
        print(f"✅ member_types ativos: {len(response.data) if response.data else 0}")
    except Exception as e:
        print(f"❌ Erro em member_types: {str(e)}")
    
    # Testar subscription_plans
    try:
        response = supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
        print(f"✅ subscription_plans ativos: {len(response.data) if response.data else 0}")
    except Exception as e:
        print(f"❌ Erro em subscription_plans: {str(e)}")
    
    # Testar relacionamentos
    try:
        response = supabase.table('member_type_subscriptions').select('*').execute()
        print(f"✅ relacionamentos: {len(response.data) if response.data else 0}")
        
        if response.data:
            print("📋 RELACIONAMENTOS EXISTENTES:")
            for rel in response.data:
                print(f"   • Member Type: {rel.get('member_type_id', 'N/A')[:8]}...")
                print(f"     Subscription: {rel.get('subscription_plan_id', 'N/A')[:8]}...")
                
    except Exception as e:
        print(f"❌ Erro em relacionamentos: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ TESTE CONCLUÍDO")

if __name__ == "__main__":
    test_unified_query()