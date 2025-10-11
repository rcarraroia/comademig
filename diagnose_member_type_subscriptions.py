#!/usr/bin/env python3
"""
Diagnóstico detalhado da tabela member_type_subscriptions
"""

from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def diagnose():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n" + "="*80)
    print("DIAGNÓSTICO DETALHADO: member_type_subscriptions")
    print("="*80 + "\n")
    
    # 1. Ver TODOS os registros
    print("1. TODOS OS REGISTROS:")
    print("-"*80)
    response = supabase.table('member_type_subscriptions').select('*').execute()
    
    print(f"Total de registros: {len(response.data)}\n")
    
    for i, record in enumerate(response.data, 1):
        print(f"Registro {i}:")
        print(f"  ID: {record['id']}")
        print(f"  member_type_id: {record['member_type_id']}")
        print(f"  subscription_plan_id: {record['subscription_plan_id']}")
        print(f"  created_at: {record['created_at']}")
        print(f"  created_by: {record['created_by']}")
        
        # Verificar se IDs são válidos
        if record['member_type_id']:
            try:
                mt = supabase.table('member_types').select('name').eq('id', record['member_type_id']).single().execute()
                print(f"  ✅ Tipo encontrado: {mt.data['name']}")
            except:
                print(f"  ❌ Tipo NÃO encontrado!")
        else:
            print(f"  ❌ member_type_id é NULL!")
        
        if record['subscription_plan_id']:
            try:
                sp = supabase.table('subscription_plans').select('name, price').eq('id', record['subscription_plan_id']).single().execute()
                print(f"  ✅ Plano encontrado: {sp.data['name']} (R$ {sp.data['price']})")
            except:
                print(f"  ❌ Plano NÃO encontrado!")
        else:
            print(f"  ❌ subscription_plan_id é NULL!")
        
        print()
    
    # 2. Contar problemas
    print("\n" + "="*80)
    print("2. RESUMO DE PROBLEMAS:")
    print("-"*80)
    
    null_member_type = sum(1 for r in response.data if not r['member_type_id'])
    null_plan = sum(1 for r in response.data if not r['subscription_plan_id'])
    
    print(f"Registros com member_type_id NULL: {null_member_type}")
    print(f"Registros com subscription_plan_id NULL: {null_plan}")
    
    if null_member_type > 0 or null_plan > 0:
        print("\n❌ PROBLEMA CRÍTICO: Há registros com IDs NULL!")
        print("   Esses registros precisam ser deletados ou corrigidos.")
    
    # 3. Buscar tipos e planos disponíveis
    print("\n" + "="*80)
    print("3. TIPOS DE MEMBRO DISPONÍVEIS:")
    print("-"*80)
    
    types_response = supabase.table('member_types').select('id, name').eq('is_active', True).order('sort_order').execute()
    for mt in types_response.data:
        print(f"  • {mt['name']}: {mt['id']}")
    
    print("\n" + "="*80)
    print("4. PLANOS MENSAIS DISPONÍVEIS:")
    print("-"*80)
    
    plans_response = supabase.table('subscription_plans').select('id, name, price, member_type_id').eq('is_active', True).eq('recurrence', 'monthly').order('price').execute()
    for sp in plans_response.data:
        print(f"  • {sp['name']}: R$ {sp['price']} - ID: {sp['id']}")
        if sp['member_type_id']:
            print(f"    (Já associado ao tipo: {sp['member_type_id']})")
    
    # 5. Sugestão de correção
    print("\n" + "="*80)
    print("5. SUGESTÃO DE CORREÇÃO:")
    print("-"*80)
    
    print("\nDELETAR registros inválidos:")
    for i, record in enumerate(response.data, 1):
        if not record['member_type_id'] or not record['subscription_plan_id']:
            print(f"DELETE FROM member_type_subscriptions WHERE id = '{record['id']}';")
    
    print("\n\nCRIAR relacionamentos corretos:")
    print("-- Baseado nos tipos ativos e planos mensais disponíveis")
    
    for mt in types_response.data:
        # Procurar plano correspondente
        matching_plan = None
        for sp in plans_response.data:
            if mt['name'].lower() in sp['name'].lower() and 'mensal' in sp['name'].lower():
                matching_plan = sp
                break
        
        if matching_plan:
            print(f"\n-- {mt['name']} → {matching_plan['name']}")
            print(f"INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)")
            print(f"VALUES ('{mt['id']}', '{matching_plan['id']}');")
    
    print("\n" + "="*80)

if __name__ == '__main__':
    diagnose()
