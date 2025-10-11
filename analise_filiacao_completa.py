#!/usr/bin/env python3
"""
ANÁLISE COMPLETA DO MÓDULO DE FILIAÇÃO - COMADEMIG
Verifica: Tabelas, RLS, Funções, Dados e Integridade
"""

from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def print_subsection(title):
    print("\n" + "-"*80)
    print(f"  {title}")
    print("-"*80)

def analyze_filiacao_system():
    """Análise completa do sistema de filiação"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print_section("ANÁLISE COMPLETA DO MÓDULO DE FILIAÇÃO - COMADEMIG")
    
    # ========================================================================
    # 1. VERIFICAR TABELAS PRINCIPAIS
    # ========================================================================
    print_subsection("1. TABELAS PRINCIPAIS DO SISTEMA")
    
    tables_to_check = {
        'member_types': 'Tipos de Membro (Pastor, Diácono, etc)',
        'subscription_plans': 'Planos de Assinatura',
        'member_type_subscriptions': 'Relacionamento Tipo↔Plano',
        'user_subscriptions': 'Assinaturas dos Usuários',
        'profiles': 'Perfis dos Usuários',
        'asaas_customers': 'Clientes no Asaas',
        'asaas_cobrancas': 'Cobranças do Asaas',
    }
    
    table_status = {}
    
    for table, description in tables_to_check.items():
        try:
            response = supabase.table(table).select('*', count='exact').limit(1).execute()
            table_status[table] = {
                'exists': True,
                'count': response.count,
                'accessible': True,
                'description': description
            }
            print(f"✅ {table:35} | {response.count:5} registros | {description}")
            
        except Exception as e:
            error_msg = str(e)
            table_status[table] = {
                'exists': False,
                'error': error_msg,
                'accessible': False,
                'description': description
            }
            print(f"❌ {table:35} | ERRO: {error_msg[:50]}")
    
    # ========================================================================
    # 2. ANALISAR MEMBER_TYPES
    # ========================================================================
    print_subsection("2. TIPOS DE MEMBRO (member_types)")
    
    try:
        response = supabase.table('member_types').select('*').eq('is_active', True).order('sort_order').execute()
        member_types = response.data
        
        print(f"📊 Total de tipos ativos: {len(member_types)}\n")
        
        if member_types:
            for mt in member_types:
                print(f"  • {mt['name']}")
                print(f"    ID: {mt['id']}")
                print(f"    Descrição: {mt.get('description', 'N/A')}")
                print(f"    Ordem: {mt.get('sort_order', 'N/A')}")
                print(f"    Ativo: {mt.get('is_active', False)}")
                print()
        else:
            print("⚠️  NENHUM TIPO DE MEMBRO CADASTRADO!")
            print("   PROBLEMA CRÍTICO: Usuários não podem se filiar sem tipos de membro.")
            
    except Exception as e:
        print(f"❌ Erro ao buscar tipos de membro: {e}")
    
    # ========================================================================
    # 3. ANALISAR SUBSCRIPTION_PLANS
    # ========================================================================
    print_subsection("3. PLANOS DE ASSINATURA (subscription_plans)")
    
    try:
        response = supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
        plans = response.data
        
        print(f"📊 Total de planos ativos: {len(plans)}\n")
        
        if plans:
            for plan in plans:
                print(f"  • {plan['name']}")
                print(f"    ID: {plan['id']}")
                print(f"    Preço: R$ {plan.get('price', 0):.2f}")
                print(f"    Recorrência: {plan.get('recurrence', 'N/A')}")
                print(f"    ID Gateway: {plan.get('plan_id_gateway', 'N/A')}")
                print(f"    Descrição: {plan.get('description', 'N/A')}")
                print()
        else:
            print("⚠️  NENHUM PLANO DE ASSINATURA CADASTRADO!")
            print("   PROBLEMA CRÍTICO: Usuários não podem se filiar sem planos.")
            
    except Exception as e:
        print(f"❌ Erro ao buscar planos: {e}")
    
    # ========================================================================
    # 4. ANALISAR RELACIONAMENTO TIPO ↔ PLANO
    # ========================================================================
    print_subsection("4. RELACIONAMENTO TIPO DE MEMBRO ↔ PLANO")
    
    try:
        response = supabase.table('member_type_subscriptions').select('*').execute()
        relationships = response.data
        
        print(f"📊 Total de relacionamentos: {len(relationships)}\n")
        
        if relationships:
            # Buscar detalhes
            for rel in relationships:
                # Buscar tipo de membro
                mt_response = supabase.table('member_types').select('name').eq('id', rel['member_type_id']).single().execute()
                mt_name = mt_response.data['name'] if mt_response.data else 'Desconhecido'
                
                # Buscar plano
                plan_response = supabase.table('subscription_plans').select('name, price').eq('id', rel['subscription_plan_id']).single().execute()
                plan_name = plan_response.data['name'] if plan_response.data else 'Desconhecido'
                plan_price = plan_response.data['price'] if plan_response.data else 0
                
                print(f"  • {mt_name} → {plan_name} (R$ {plan_price:.2f})")
        else:
            print("⚠️  NENHUM RELACIONAMENTO CONFIGURADO!")
            print("   PROBLEMA CRÍTICO: Tipos de membro não têm planos associados.")
            print("   Usuários não saberão quanto pagar ao se filiar.")
            
    except Exception as e:
        print(f"❌ Erro ao buscar relacionamentos: {e}")
    
    # ========================================================================
    # 5. VERIFICAR QUERY UNIFICADA (usada no frontend)
    # ========================================================================
    print_subsection("5. TESTE DA QUERY UNIFICADA (Frontend)")
    
    try:
        response = supabase.table('member_types').select('''
            id,
            name,
            description,
            sort_order,
            is_active,
            created_at,
            updated_at,
            member_type_subscriptions(
                subscription_plans(
                    id,
                    name,
                    price,
                    recurrence,
                    plan_id_gateway,
                    description
                )
            )
        ''').eq('is_active', True).order('sort_order').execute()
        
        unified_data = response.data
        
        print(f"📊 Tipos retornados: {len(unified_data)}\n")
        
        if unified_data:
            for item in unified_data:
                print(f"  • {item['name']}")
                
                # Verificar se tem planos associados
                subscriptions = item.get('member_type_subscriptions', [])
                valid_subs = [s for s in subscriptions if s.get('subscription_plans')]
                
                if valid_subs:
                    for sub in valid_subs:
                        plan = sub['subscription_plans']
                        print(f"    ✅ Plano: {plan['name']} - R$ {plan['price']:.2f} ({plan['recurrence']})")
                else:
                    print(f"    ❌ SEM PLANO ASSOCIADO - PROBLEMA!")
                print()
        else:
            print("❌ QUERY UNIFICADA NÃO RETORNOU DADOS!")
            
    except Exception as e:
        print(f"❌ Erro na query unificada: {e}")
        print(f"   Detalhes: {str(e)}")
    
    # ========================================================================
    # 6. VERIFICAR ASSINATURAS DE USUÁRIOS
    # ========================================================================
    print_subsection("6. ASSINATURAS DE USUÁRIOS (user_subscriptions)")
    
    try:
        response = supabase.table('user_subscriptions').select('*', count='exact').execute()
        
        print(f"📊 Total de assinaturas: {response.count}")
        
        if response.count > 0:
            # Contar por status
            status_count = {}
            for sub in response.data:
                status = sub.get('status', 'unknown')
                status_count[status] = status_count.get(status, 0) + 1
            
            print("\nDistribuição por status:")
            for status, count in status_count.items():
                print(f"  • {status}: {count}")
        else:
            print("ℹ️  Nenhuma assinatura ainda (normal se sistema novo)")
            
    except Exception as e:
        print(f"❌ Erro ao buscar assinaturas: {e}")
    
    # ========================================================================
    # 7. VERIFICAR PROFILES
    # ========================================================================
    print_subsection("7. PERFIS DE USUÁRIOS (profiles)")
    
    try:
        response = supabase.table('profiles').select('id, nome_completo, member_type_id, cargo', count='exact').limit(5).execute()
        
        print(f"📊 Total de perfis: {response.count}")
        
        if response.count > 0:
            # Contar quantos têm member_type_id
            with_type = sum(1 for p in response.data if p.get('member_type_id'))
            print(f"   Com tipo de membro: {with_type}")
            print(f"   Sem tipo de membro: {response.count - with_type}")
            
            print("\nExemplos (primeiros 5):")
            for profile in response.data[:5]:
                print(f"  • {profile.get('nome_completo', 'Sem nome')}")
                print(f"    Tipo: {profile.get('member_type_id', 'Não definido')}")
                print(f"    Cargo: {profile.get('cargo', 'Não definido')}")
        else:
            print("ℹ️  Nenhum perfil cadastrado")
            
    except Exception as e:
        print(f"❌ Erro ao buscar perfis: {e}")
    
    # ========================================================================
    # 8. VERIFICAR INTEGRAÇÃO ASAAS
    # ========================================================================
    print_subsection("8. INTEGRAÇÃO COM ASAAS")
    
    # Clientes
    try:
        response = supabase.table('asaas_customers').select('*', count='exact').execute()
        print(f"📊 Clientes Asaas cadastrados: {response.count}")
    except Exception as e:
        print(f"❌ Erro ao buscar clientes Asaas: {e}")
    
    # Cobranças
    try:
        response = supabase.table('asaas_cobrancas').select('*', count='exact').execute()
        print(f"📊 Cobranças Asaas registradas: {response.count}")
        
        if response.count > 0:
            # Contar por status
            status_count = {}
            for cob in response.data:
                status = cob.get('status', 'unknown')
                status_count[status] = status_count.get(status, 0) + 1
            
            print("\nDistribuição por status:")
            for status, count in status_count.items():
                print(f"  • {status}: {count}")
    except Exception as e:
        print(f"❌ Erro ao buscar cobranças Asaas: {e}")
    
    # ========================================================================
    # 9. DIAGNÓSTICO FINAL
    # ========================================================================
    print_section("DIAGNÓSTICO FINAL")
    
    issues = []
    warnings = []
    
    # Verificar problemas críticos
    if not table_status.get('member_types', {}).get('exists'):
        issues.append("❌ CRÍTICO: Tabela member_types não existe ou não acessível")
    elif table_status.get('member_types', {}).get('count', 0) == 0:
        issues.append("❌ CRÍTICO: Nenhum tipo de membro cadastrado")
    
    if not table_status.get('subscription_plans', {}).get('exists'):
        issues.append("❌ CRÍTICO: Tabela subscription_plans não existe ou não acessível")
    elif table_status.get('subscription_plans', {}).get('count', 0) == 0:
        issues.append("❌ CRÍTICO: Nenhum plano de assinatura cadastrado")
    
    if not table_status.get('member_type_subscriptions', {}).get('exists'):
        issues.append("❌ CRÍTICO: Tabela member_type_subscriptions não existe")
    elif table_status.get('member_type_subscriptions', {}).get('count', 0) == 0:
        warnings.append("⚠️  AVISO: Nenhum relacionamento tipo↔plano configurado")
    
    if not table_status.get('profiles', {}).get('exists'):
        issues.append("❌ CRÍTICO: Tabela profiles não existe ou não acessível")
    
    if not table_status.get('user_subscriptions', {}).get('exists'):
        issues.append("❌ CRÍTICO: Tabela user_subscriptions não existe")
    
    # Exibir resultados
    if issues:
        print("🔴 PROBLEMAS CRÍTICOS ENCONTRADOS:")
        for issue in issues:
            print(f"   {issue}")
        print()
    
    if warnings:
        print("🟡 AVISOS:")
        for warning in warnings:
            print(f"   {warning}")
        print()
    
    if not issues and not warnings:
        print("✅ SISTEMA APARENTEMENTE OK!")
        print("   Todas as tabelas existem e têm dados.")
        print()
    
    # Recomendações
    print("📋 PRÓXIMOS PASSOS RECOMENDADOS:")
    print()
    
    if issues or warnings:
        print("1. Corrigir problemas críticos listados acima")
        print("2. Verificar políticas RLS (Row Level Security)")
        print("3. Testar fluxo completo de filiação")
    else:
        print("1. Verificar políticas RLS (Row Level Security)")
        print("2. Testar fluxo completo de filiação no frontend")
        print("3. Verificar logs de erro no console do navegador")
    
    print()
    print("="*80)
    
    # Salvar relatório em JSON
    report = {
        'timestamp': str(supabase.table('member_types').select('created_at').limit(1).execute().data[0]['created_at'] if table_status.get('member_types', {}).get('exists') else 'N/A'),
        'tables': table_status,
        'issues': issues,
        'warnings': warnings
    }
    
    with open('relatorio_filiacao.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Relatório salvo em: relatorio_filiacao.json")
    print()

if __name__ == '__main__':
    analyze_filiacao_system()
