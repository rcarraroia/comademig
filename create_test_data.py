#!/usr/bin/env python3
"""
Script para criar dados de teste e verificar o funcionamento do sistema
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def test_system_functionality():
    """Testa a funcionalidade do sistema atual"""
    print("🔍 TESTE DE FUNCIONALIDADE DO SISTEMA")
    print("=" * 60)
    
    supabase = get_supabase_client()
    
    # 1. Verificar se podemos criar um subscription_plan
    print("\n📋 TESTE 1: Criar Subscription Plan")
    print("-" * 40)
    try:
        response = supabase.table('subscription_plans').insert({
            'plan_title': 'Teste Plan Pastor',
            'price': 50.00,
            'recurrence': 'Anual',
            'description': 'Plano de teste para pastores'
        }).execute()
        
        if response.data:
            plan_id = response.data[0]['id']
            print(f"✅ Subscription plan criado: {plan_id}")
            
            # 2. Criar relacionamento com member_type existente
            print("\n📋 TESTE 2: Criar Relacionamento")
            print("-" * 40)
            
            # Pegar um member_type existente
            member_types = supabase.table('member_types').select('id, name').limit(1).execute()
            if member_types.data:
                member_type_id = member_types.data[0]['id']
                member_type_name = member_types.data[0]['name']
                
                relationship_response = supabase.table('member_type_subscriptions').insert({
                    'member_type_id': member_type_id,
                    'subscription_plan_id': plan_id
                }).execute()
                
                if relationship_response.data:
                    print(f"✅ Relacionamento criado entre '{member_type_name}' e 'Teste Plan Pastor'")
                    
                    # 3. Testar query unificada
                    print("\n📋 TESTE 3: Query Unificada")
                    print("-" * 40)
                    
                    unified_query = supabase.table('member_types').select('''
                        id,
                        name,
                        description,
                        sort_order,
                        is_active,
                        member_type_subscriptions!inner(
                            subscription_plans!inner(
                                id,
                                plan_title,
                                price,
                                recurrence,
                                description
                            )
                        )
                    ''').eq('is_active', True).execute()
                    
                    if unified_query.data:
                        print(f"✅ Query unificada funcionando: {len(unified_query.data)} registros")
                        for item in unified_query.data:
                            name = item.get('name', 'N/A')
                            plans = item.get('member_type_subscriptions', [])
                            if plans:
                                plan = plans[0].get('subscription_plans', {})
                                plan_title = plan.get('plan_title', 'N/A')
                                price = plan.get('price', 0)
                                print(f"   • {name}: {plan_title} - R$ {price}")
                    else:
                        print("❌ Query unificada não retornou dados")
                        
                    # 4. Limpar dados de teste
                    print("\n📋 LIMPEZA: Removendo dados de teste")
                    print("-" * 40)
                    
                    # Remover relacionamento
                    supabase.table('member_type_subscriptions').delete().eq('subscription_plan_id', plan_id).execute()
                    print("✅ Relacionamento removido")
                    
                    # Remover plano
                    supabase.table('subscription_plans').delete().eq('id', plan_id).execute()
                    print("✅ Subscription plan removido")
                    
                else:
                    print("❌ Erro ao criar relacionamento")
            else:
                print("❌ Nenhum member_type encontrado")
        else:
            print("❌ Erro ao criar subscription plan")
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ TESTE CONCLUÍDO")

if __name__ == "__main__":
    test_system_functionality()