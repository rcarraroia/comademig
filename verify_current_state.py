#!/usr/bin/env python3
"""
Script para verificar o estado atual do sistema de tipos de membro e assinaturas
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    # Extrair configurações do arquivo client.ts
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def check_table_exists(supabase: Client, table_name: str):
    """Verifica se uma tabela existe e retorna informações básicas"""
    try:
        response = supabase.table(table_name).select('*').limit(1).execute()
        return {
            'exists': True,
            'count': len(response.data) if response.data else 0,
            'sample': response.data[0] if response.data else None
        }
    except Exception as e:
        return {
            'exists': False,
            'error': str(e)
        }

def get_table_count(supabase: Client, table_name: str):
    """Obtém contagem total de registros em uma tabela"""
    try:
        response = supabase.table(table_name).select('*', count='exact').execute()
        return response.count
    except Exception as e:
        return f"Erro: {str(e)}"

def analyze_member_types_system():
    """Análise completa do sistema de tipos de membro"""
    print("🔍 ANÁLISE DO SISTEMA DE TIPOS DE MEMBRO E ASSINATURAS")
    print("=" * 60)
    
    supabase = get_supabase_client()
    
    # Tabelas principais para verificar
    tables_to_check = [
        'member_types',
        'subscription_plans', 
        'member_type_subscriptions',
        'user_subscriptions',
        'profiles'
    ]
    
    print("\n📊 VERIFICAÇÃO DE TABELAS:")
    print("-" * 40)
    
    table_status = {}
    for table in tables_to_check:
        status = check_table_exists(supabase, table)
        table_status[table] = status
        
        if status['exists']:
            count = get_table_count(supabase, table)
            print(f"✅ {table}: {count} registros")
            if status['sample']:
                print(f"   Exemplo: {list(status['sample'].keys())}")
        else:
            print(f"❌ {table}: {status['error']}")
    
    print("\n🔗 VERIFICAÇÃO DE RELACIONAMENTOS:")
    print("-" * 40)
    
    # Verificar relacionamentos entre tabelas
    if table_status['member_types']['exists'] and table_status['subscription_plans']['exists']:
        try:
            # Verificar se existem relacionamentos
            response = supabase.table('member_type_subscriptions').select('*').execute()
            relationships_count = len(response.data) if response.data else 0
            print(f"🔗 Relacionamentos member_type ↔ subscription: {relationships_count}")
            
            if relationships_count > 0:
                print(f"   Exemplo: {response.data[0] if response.data else 'Nenhum'}")
        except Exception as e:
            print(f"❌ Erro ao verificar relacionamentos: {str(e)}")
    
    print("\n👥 VERIFICAÇÃO DE DADOS DE USUÁRIOS:")
    print("-" * 40)
    
    # Verificar profiles com member_type_id
    if table_status['profiles']['exists']:
        try:
            # Contar profiles com member_type_id preenchido
            response = supabase.table('profiles').select('member_type_id').not_.is_('member_type_id', 'null').execute()
            profiles_with_type = len(response.data) if response.data else 0
            
            # Contar total de profiles
            total_profiles = get_table_count(supabase, 'profiles')
            
            print(f"👤 Total de profiles: {total_profiles}")
            print(f"🏷️  Profiles com member_type_id: {profiles_with_type}")
            print(f"📊 Percentual com tipo definido: {(profiles_with_type/total_profiles*100):.1f}%" if total_profiles > 0 else "N/A")
            
        except Exception as e:
            print(f"❌ Erro ao verificar profiles: {str(e)}")
    
    print("\n💰 VERIFICAÇÃO DE ASSINATURAS ATIVAS:")
    print("-" * 40)
    
    if table_status['user_subscriptions']['exists']:
        try:
            # Contar assinaturas por status
            response = supabase.table('user_subscriptions').select('status').execute()
            if response.data:
                status_counts = {}
                for sub in response.data:
                    status = sub.get('status', 'unknown')
                    status_counts[status] = status_counts.get(status, 0) + 1
                
                for status, count in status_counts.items():
                    print(f"📋 Assinaturas {status}: {count}")
            else:
                print("📋 Nenhuma assinatura encontrada")
                
        except Exception as e:
            print(f"❌ Erro ao verificar assinaturas: {str(e)}")
    
    print("\n🎯 VERIFICAÇÃO DE DADOS UNIFICADOS:")
    print("-" * 40)
    
    # Tentar buscar dados unificados (como seria usado no hook)
    if table_status['member_types']['exists'] and table_status['subscription_plans']['exists']:
        try:
            # Simular query do useMemberTypeWithPlan
            response = supabase.table('member_types').select('''
                id,
                name,
                description,
                order_of_exhibition,
                is_active,
                member_type_subscriptions!inner(
                    subscription_plans(
                        id,
                        plan_title,
                        price,
                        recurrence,
                        plan_id_gateway
                    )
                )
            ''').eq('is_active', True).execute()
            
            unified_data = response.data if response.data else []
            print(f"🔄 Tipos de membro com planos unificados: {len(unified_data)}")
            
            if unified_data:
                for item in unified_data[:3]:  # Mostrar apenas 3 exemplos
                    name = item.get('name', 'N/A')
                    plans = item.get('member_type_subscriptions', [])
                    plan_count = len(plans)
                    print(f"   • {name}: {plan_count} plano(s) associado(s)")
            
        except Exception as e:
            print(f"❌ Erro ao buscar dados unificados: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ ANÁLISE CONCLUÍDA")
    
    return table_status

if __name__ == "__main__":
    analyze_member_types_system()