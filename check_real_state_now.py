#!/usr/bin/env python3
"""
Script para verificar o ESTADO REAL ATUAL do banco
Sem suposições - apenas fatos
"""

from supabase import create_client, Client

def get_supabase_client():
    SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def check_current_state():
    print("🔍 VERIFICAÇÃO DO ESTADO REAL ATUAL")
    print("=" * 60)
    
    supabase = get_supabase_client()
    
    print("📋 SUBSCRIPTION_PLANS:")
    print("-" * 40)
    try:
        response = supabase.table('subscription_plans').select('*').execute()
        if response.data:
            print(f"✅ TOTAL: {len(response.data)} planos encontrados")
            for plan in response.data:
                status = "ATIVO" if plan.get('is_active') else "INATIVO"
                print(f"   • {plan.get('plan_title', 'N/A')} - {status}")
                print(f"     Preço: R$ {plan.get('price', 'N/A')}")
                print(f"     ID: {plan.get('id', 'N/A')}")
        else:
            print("❌ NENHUM plano encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print(f"\n📋 MEMBER_TYPES:")
    print("-" * 40)
    try:
        response = supabase.table('member_types').select('*').eq('is_active', True).execute()
        if response.data:
            print(f"✅ TOTAL: {len(response.data)} tipos ativos")
            for mtype in response.data:
                print(f"   • {mtype.get('name', 'N/A')} (ID: {mtype.get('id', 'N/A')[:8]}...)")
        else:
            print("❌ NENHUM tipo ativo")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print(f"\n📋 RELACIONAMENTOS:")
    print("-" * 40)
    try:
        response = supabase.table('member_type_subscriptions').select('*').execute()
        if response.data:
            print(f"✅ TOTAL: {len(response.data)} relacionamentos")
            for rel in response.data:
                print(f"   • Member: {rel.get('member_type_id', 'N/A')[:8]}...")
                print(f"     Plan: {rel.get('subscription_plan_id', 'N/A')[:8]}...")
        else:
            print("❌ NENHUM relacionamento")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print(f"\n🧪 TESTANDO QUERY DO HOOK:")
    print("-" * 40)
    try:
        response = supabase.table('member_types').select('''
          id, name, description, sort_order, is_active,
          member_type_subscriptions!inner(
            subscription_plans!inner(
              id, plan_title, price, recurrence
            )
          )
        ''').eq('is_active', True).order('sort_order').execute()
        
        if response.data:
            print(f"✅ HOOK RETORNARIA: {len(response.data)} registros")
            for item in response.data:
                name = item.get('name', 'N/A')
                subs = item.get('member_type_subscriptions', [])
                if subs:
                    plan = subs[0].get('subscription_plans', {})
                    plan_title = plan.get('plan_title', 'N/A')
                    price = plan.get('price', 'N/A')
                    print(f"   • {name}: {plan_title} - R$ {price}")
        else:
            print("❌ HOOK RETORNARIA: 0 registros (array vazio)")
            print("   Isso explica por que o formulário não funciona!")
            
    except Exception as e:
        print(f"❌ Erro na query do hook: {str(e)}")
    
    print(f"\n💡 DIAGNÓSTICO:")
    print("-" * 40)
    
    # Verificar se planos existem mas estão inativos
    try:
        all_plans = supabase.table('subscription_plans').select('*').execute()
        active_plans = supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
        
        total_plans = len(all_plans.data) if all_plans.data else 0
        active_count = len(active_plans.data) if active_plans.data else 0
        
        print(f"Total de planos: {total_plans}")
        print(f"Planos ativos: {active_count}")
        
        if total_plans > 0 and active_count == 0:
            print("🎯 PROBLEMA: Planos existem mas estão INATIVOS")
            print("💡 SOLUÇÃO: UPDATE subscription_plans SET is_active = true;")
        elif total_plans == 0:
            print("🎯 PROBLEMA: Nenhum plano existe")
            print("💡 SOLUÇÃO: Criar planos básicos")
        else:
            print("✅ Planos existem e estão ativos")
            
    except Exception as e:
        print(f"❌ Erro no diagnóstico: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ VERIFICAÇÃO CONCLUÍDA")

if __name__ == "__main__":
    check_current_state()