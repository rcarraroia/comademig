#!/usr/bin/env python3
"""
Script para diagnosticar e mostrar exatamente o que precisa ser feito
USANDO APENAS LEITURA conforme regras do Supabase
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def diagnose_system():
    """Diagnóstica o estado atual do sistema"""
    print("🔍 DIAGNÓSTICO COMPLETO DO SISTEMA")
    print("=" * 60)
    print("⚠️  USANDO APENAS LEITURA - NÃO EXECUTANDO OPERAÇÕES DE ESCRITA")
    print()
    
    supabase = get_supabase_client()
    
    print("📋 1. VERIFICANDO SUBSCRIPTION_PLANS:")
    print("-" * 50)
    
    try:
        # Todos os planos
        all_plans = supabase.table('subscription_plans').select('*').execute()
        print(f"Total de planos: {len(all_plans.data) if all_plans.data else 0}")
        
        if all_plans.data:
            for plan in all_plans.data:
                status = "✅ ATIVO" if plan.get('is_active') else "❌ INATIVO"
                print(f"   • {plan.get('plan_title', 'N/A')} - {status}")
                print(f"     ID: {plan.get('id', 'N/A')}")
                print(f"     Preço: R$ {plan.get('price', 'N/A')}")
                print(f"     Recorrência: {plan.get('recurrence', 'N/A')}")
                print()
        
        # Planos ativos
        active_plans = supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
        print(f"Planos ATIVOS: {len(active_plans.data) if active_plans.data else 0}")
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print("\n📋 2. VERIFICANDO MEMBER_TYPES:")
    print("-" * 50)
    
    try:
        active_types = supabase.table('member_types').select('*').eq('is_active', True).execute()
        print(f"Tipos ativos: {len(active_types.data) if active_types.data else 0}")
        
        if active_types.data:
            for mtype in active_types.data:
                print(f"   • {mtype.get('name', 'N/A')} (ID: {mtype.get('id', 'N/A')[:8]}...)")
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print("\n📋 3. VERIFICANDO RELACIONAMENTOS:")
    print("-" * 50)
    
    try:
        relationships = supabase.table('member_type_subscriptions').select('*').execute()
        print(f"Total de relacionamentos: {len(relationships.data) if relationships.data else 0}")
        
        if relationships.data:
            for rel in relationships.data:
                print(f"   • Member: {rel.get('member_type_id', 'N/A')[:8]}...")
                print(f"     Plan: {rel.get('subscription_plan_id', 'N/A')[:8]}...")
                print()
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
    
    print("\n🎯 DIAGNÓSTICO:")
    print("-" * 50)
    
    # Verificar se planos estão ativos
    try:
        active_plans = supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
        active_count = len(active_plans.data) if active_plans.data else 0
        
        if active_count == 0:
            print("❌ PROBLEMA PRINCIPAL: Nenhum plano está ativo!")
            print("💡 SOLUÇÃO: Execute o script SQL para ativar os planos:")
            print("   UPDATE subscription_plans SET is_active = true;")
        else:
            print(f"✅ {active_count} planos estão ativos")
            
    except Exception as e:
        print(f"❌ Erro ao verificar planos ativos: {str(e)}")
    
    # Verificar relacionamentos
    try:
        relationships = supabase.table('member_type_subscriptions').select('*').execute()
        rel_count = len(relationships.data) if relationships.data else 0
        
        if rel_count == 0:
            print("❌ PROBLEMA SECUNDÁRIO: Nenhum relacionamento existe!")
            print("💡 SOLUÇÃO: Criar relacionamentos entre tipos e planos")
        else:
            print(f"✅ {rel_count} relacionamentos existem")
            
    except Exception as e:
        print(f"❌ Erro ao verificar relacionamentos: {str(e)}")
    
    print("\n📝 SCRIPT SQL NECESSÁRIO:")
    print("-" * 50)
    print("-- Execute este comando no Editor SQL do Supabase:")
    print("UPDATE subscription_plans SET is_active = true;")
    print()
    print("-- Depois execute este para verificar:")
    print("SELECT plan_title, is_active FROM subscription_plans;")
    
    print("\n" + "=" * 60)
    print("✅ DIAGNÓSTICO CONCLUÍDO")

if __name__ == "__main__":
    diagnose_system()