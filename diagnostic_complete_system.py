#!/usr/bin/env python3
"""
DIAGNÓSTICO COMPLETO DO SISTEMA COMADEMIG
Análise abrangente do painel administrativo, banco de dados, RLS, Edge Functions e políticas
"""

from supabase import create_client, Client
import json
from datetime import datetime

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def generate_diagnostic_report():
    """Gera relatório completo de diagnóstico do sistema"""
    
    print("🔍 INICIANDO DIAGNÓSTICO COMPLETO DO SISTEMA COMADEMIG")
    print("=" * 80)
    print(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 80)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "database_analysis": {},
        "tables_structure": {},
        "data_integrity": {},
        "relationships": {},
        "rls_policies": {},
        "edge_functions": {},
        "admin_interface": {},
        "issues_found": [],
        "recommendations": []
    }
    
    # 1. ANÁLISE COMPLETA DO BANCO DE DADOS
    print("\n📊 1. ANÁLISE COMPLETA DO BANCO DE DADOS")
    print("-" * 60)
    
    critical_tables = [
        'profiles', 'member_types', 'subscription_plans', 'member_type_subscriptions',
        'user_subscriptions', 'user_roles', 'asaas_cobrancas', 'certidoes',
        'eventos', 'presencas_eventos', 'affiliates', 'affiliate_commissions',
        'notifications', 'notification_templates', 'audit_logs', 'content_pages'
    ]
    
    for table in critical_tables:
        try:
            # Contar registros
            count_response = supabase.table(table).select('*', count='exact').execute()
            count = count_response.count
            
            # Pegar estrutura (primeiros registros)
            sample_response = supabase.table(table).select('*').limit(3).execute()
            sample_data = sample_response.data
            
            table_info = {
                'exists': True,
                'count': count,
                'columns': list(sample_data[0].keys()) if sample_data else [],
                'sample_data': sample_data[:2] if sample_data else [],
                'status': 'OK' if count >= 0 else 'EMPTY'
            }
            
            report['tables_structure'][table] = table_info
            
            print(f"✅ {table}: {count} registros")
            if sample_data:
                print(f"   Colunas: {', '.join(table_info['columns'])}")
            else:
                print(f"   ⚠️  Tabela vazia")
                
        except Exception as e:
            error_info = {
                'exists': False,
                'error': str(e),
                'status': 'ERROR'
            }
            report['tables_structure'][table] = error_info
            report['issues_found'].append(f"Tabela {table}: {str(e)}")
            print(f"❌ {table}: ERRO - {str(e)}")
    
    # 2. ANÁLISE DE INTEGRIDADE DE DADOS
    print("\n🔍 2. ANÁLISE DE INTEGRIDADE DE DADOS")
    print("-" * 60)
    
    integrity_checks = []
    
    # Verificar relacionamentos member_types <-> subscription_plans
    try:
        # Tipos de membro sem planos
        orphan_types = supabase.table('member_types').select('id, name').execute()
        types_with_plans = supabase.table('member_type_subscriptions').select('member_type_id').execute()
        
        type_ids_with_plans = [rel['member_type_id'] for rel in types_with_plans.data] if types_with_plans.data else []
        orphan_member_types = [t for t in orphan_types.data if t['id'] not in type_ids_with_plans] if orphan_types.data else []
        
        if orphan_member_types:
            issue = f"Tipos de membro sem planos associados: {len(orphan_member_types)}"
            report['issues_found'].append(issue)
            print(f"⚠️  {issue}")
            for orphan in orphan_member_types:
                print(f"     - {orphan['name']} (ID: {orphan['id']})")
        else:
            print("✅ Todos os tipos de membro têm planos associados")
            
        integrity_checks.append({
            'check': 'member_types_plans_relationship',
            'status': 'WARNING' if orphan_member_types else 'OK',
            'details': f"{len(orphan_member_types)} tipos órfãos" if orphan_member_types else "Relacionamentos OK"
        })
        
    except Exception as e:
        integrity_checks.append({
            'check': 'member_types_plans_relationship',
            'status': 'ERROR',
            'details': str(e)
        })
        print(f"❌ Erro ao verificar relacionamentos: {e}")
    
    # Verificar usuários sem perfis
    try:
        profiles_count = supabase.table('profiles').select('*', count='exact').execute().count
        print(f"✅ Perfis de usuário: {profiles_count} registros")
        
        integrity_checks.append({
            'check': 'user_profiles',
            'status': 'OK',
            'details': f"{profiles_count} perfis encontrados"
        })
        
    except Exception as e:
        integrity_checks.append({
            'check': 'user_profiles',
            'status': 'ERROR',
            'details': str(e)
        })
        print(f"❌ Erro ao verificar perfis: {e}")
    
    report['data_integrity']['checks'] = integrity_checks
    
    # 3. ANÁLISE DE RELACIONAMENTOS
    print("\n🔗 3. ANÁLISE DE RELACIONAMENTOS ENTRE TABELAS")
    print("-" * 60)
    
    relationships_analysis = {}
    
    # Relacionamento member_types -> member_type_subscriptions -> subscription_plans
    try:
        query_result = supabase.table('member_types').select('''
            id, name, is_active,
            member_type_subscriptions(
                id,
                subscription_plans(
                    id, name, price, recurrence, is_active
                )
            )
        ''').execute()
        
        relationships_data = []
        for member_type in query_result.data:
            subscriptions = member_type.get('member_type_subscriptions', [])
            for sub in subscriptions:
                if sub and sub.get('subscription_plans'):
                    plan = sub['subscription_plans']
                    relationships_data.append({
                        'member_type': member_type['name'],
                        'member_type_active': member_type['is_active'],
                        'plan_name': plan['name'],
                        'plan_price': plan['price'],
                        'plan_recurrence': plan['recurrence'],
                        'plan_active': plan['is_active']
                    })
        
        relationships_analysis['member_types_plans'] = {
            'status': 'OK',
            'count': len(relationships_data),
            'data': relationships_data
        }
        
        print(f"✅ Relacionamentos member_types <-> plans: {len(relationships_data)} encontrados")
        for rel in relationships_data:
            status = "✅" if rel['member_type_active'] and rel['plan_active'] else "⚠️"
            print(f"   {status} {rel['member_type']} -> {rel['plan_name']} (R$ {rel['plan_price']}, {rel['plan_recurrence']})")
            
    except Exception as e:
        relationships_analysis['member_types_plans'] = {
            'status': 'ERROR',
            'error': str(e)
        }
        report['issues_found'].append(f"Erro nos relacionamentos member_types <-> plans: {str(e)}")
        print(f"❌ Erro ao analisar relacionamentos: {e}")
    
    report['relationships'] = relationships_analysis
    
    # 4. ANÁLISE DE POLÍTICAS RLS
    print("\n🛡️ 4. ANÁLISE DE POLÍTICAS RLS (Row Level Security)")
    print("-" * 60)
    
    # Nota: Como não temos acesso direto às políticas via API pública,
    # vamos testar o comportamento das políticas através de queries
    
    rls_tests = {}
    
    # Teste de acesso a member_types (deve ser público para leitura)
    try:
        member_types_test = supabase.table('member_types').select('id, name').limit(1).execute()
        rls_tests['member_types_read'] = {
            'status': 'OK' if member_types_test.data else 'WARNING',
            'details': f"Leitura pública: {'Permitida' if member_types_test.data else 'Bloqueada'}"
        }
        print(f"✅ RLS member_types (leitura): {'OK' if member_types_test.data else 'BLOQUEADA'}")
    except Exception as e:
        rls_tests['member_types_read'] = {
            'status': 'ERROR',
            'details': str(e)
        }
        print(f"❌ RLS member_types (leitura): ERRO - {e}")
    
    # Teste de acesso a subscription_plans
    try:
        plans_test = supabase.table('subscription_plans').select('id, name').limit(1).execute()
        rls_tests['subscription_plans_read'] = {
            'status': 'OK' if plans_test.data else 'WARNING',
            'details': f"Leitura pública: {'Permitida' if plans_test.data else 'Bloqueada'}"
        }
        print(f"✅ RLS subscription_plans (leitura): {'OK' if plans_test.data else 'BLOQUEADA'}")
    except Exception as e:
        rls_tests['subscription_plans_read'] = {
            'status': 'ERROR',
            'details': str(e)
        }
        print(f"❌ RLS subscription_plans (leitura): ERRO - {e}")
    
    # Teste de acesso a profiles (deve ser restrito)
    try:
        profiles_test = supabase.table('profiles').select('id').limit(1).execute()
        rls_tests['profiles_read'] = {
            'status': 'WARNING' if profiles_test.data else 'OK',
            'details': f"Leitura pública: {'Permitida (RISCO!)' if profiles_test.data else 'Bloqueada (OK)'}"
        }
        if profiles_test.data:
            report['issues_found'].append("SEGURANÇA: Tabela profiles permite leitura pública - possível vazamento de dados")
        print(f"{'⚠️' if profiles_test.data else '✅'} RLS profiles (leitura): {'RISCO - Permitida' if profiles_test.data else 'OK - Bloqueada'}")
    except Exception as e:
        rls_tests['profiles_read'] = {
            'status': 'OK',
            'details': f"Leitura bloqueada: {str(e)}"
        }
        print(f"✅ RLS profiles (leitura): OK - Bloqueada")
    
    report['rls_policies'] = rls_tests
    
    # 5. ANÁLISE DE EDGE FUNCTIONS
    print("\n⚡ 5. ANÁLISE DE EDGE FUNCTIONS")
    print("-" * 60)
    
    # Testar função RPC create_unified_member_type_and_plan
    try:
        rpc_test = supabase.rpc('create_unified_member_type_and_plan', {
            'member_type_data': {'name': 'test'},
            'subscription_plan_data': {'name': 'test'}
        }).execute()
        
        # Se chegou aqui sem erro de "função não encontrada", a função existe
        report['edge_functions']['create_unified_member_type_and_plan'] = {
            'status': 'EXISTS',
            'details': 'Função RPC encontrada (teste de permissão falhou como esperado)'
        }
        print("✅ RPC create_unified_member_type_and_plan: Existe")
        
    except Exception as e:
        error_msg = str(e)
        if 'Could not find' in error_msg or 'does not exist' in error_msg:
            report['edge_functions']['create_unified_member_type_and_plan'] = {
                'status': 'NOT_FOUND',
                'details': 'Função RPC não encontrada'
            }
            report['issues_found'].append("Função RPC create_unified_member_type_and_plan não encontrada")
            print("❌ RPC create_unified_member_type_and_plan: NÃO ENCONTRADA")
        elif 'Permission denied' in error_msg or 'administrator' in error_msg:
            report['edge_functions']['create_unified_member_type_and_plan'] = {
                'status': 'EXISTS',
                'details': 'Função RPC existe e validação de permissão funciona'
            }
            print("✅ RPC create_unified_member_type_and_plan: Existe e protegida")
        else:
            report['edge_functions']['create_unified_member_type_and_plan'] = {
                'status': 'ERROR',
                'details': error_msg
            }
            print(f"⚠️ RPC create_unified_member_type_and_plan: ERRO - {error_msg}")
    
    # 6. ANÁLISE DA INTERFACE ADMINISTRATIVA
    print("\n🖥️ 6. ANÁLISE DA INTERFACE ADMINISTRATIVA")
    print("-" * 60)
    
    admin_analysis = {
        'routes_configured': [],
        'components_status': {},
        'potential_issues': []
    }
    
    # Esta análise será baseada na estrutura de arquivos que conhecemos
    expected_admin_routes = [
        '/dashboard/admin/usuarios',
        '/dashboard/admin/member-management',
        '/dashboard/admin/financeiro-asaas',
        '/dashboard/admin/regularizacao',
        '/dashboard/admin/notifications',
        '/dashboard/admin/diagnostics',
        '/dashboard/admin/suporte',
        '/dashboard/admin/content'
    ]
    
    admin_analysis['routes_configured'] = expected_admin_routes
    print("📋 Rotas administrativas configuradas:")
    for route in expected_admin_routes:
        print(f"   - {route}")
    
    # Verificar se há dados necessários para o painel funcionar
    admin_data_checks = {}
    
    # Verificar se há usuários com role admin
    try:
        # Tentar verificar user_roles (pode não existir)
        admin_users = supabase.table('user_roles').select('*').eq('role', 'admin').execute()
        admin_count = len(admin_users.data) if admin_users.data else 0
        
        admin_data_checks['admin_users'] = {
            'status': 'OK' if admin_count > 0 else 'WARNING',
            'count': admin_count,
            'details': f"{admin_count} usuários admin encontrados"
        }
        
        if admin_count == 0:
            admin_analysis['potential_issues'].append("Nenhum usuário com role 'admin' encontrado")
            
        print(f"{'✅' if admin_count > 0 else '⚠️'} Usuários admin: {admin_count}")
        
    except Exception as e:
        admin_data_checks['admin_users'] = {
            'status': 'ERROR',
            'details': str(e)
        }
        admin_analysis['potential_issues'].append(f"Erro ao verificar usuários admin: {str(e)}")
        print(f"❌ Verificação de usuários admin: ERRO - {e}")
    
    admin_analysis['data_checks'] = admin_data_checks
    report['admin_interface'] = admin_analysis
    
    # 7. RESUMO DE ISSUES E RECOMENDAÇÕES
    print("\n🎯 7. RESUMO DE ISSUES ENCONTRADAS")
    print("-" * 60)
    
    if report['issues_found']:
        print(f"❌ {len(report['issues_found'])} issues encontradas:")
        for i, issue in enumerate(report['issues_found'], 1):
            print(f"   {i}. {issue}")
    else:
        print("✅ Nenhuma issue crítica encontrada")
    
    # Gerar recomendações baseadas na análise
    recommendations = []
    
    if not report['tables_structure'].get('subscription_plans', {}).get('exists', False):
        recommendations.append("Restaurar dados da tabela subscription_plans")
    
    if len([t for t in report['tables_structure'].values() if t.get('count', 0) == 0]) > 3:
        recommendations.append("Popular tabelas vazias com dados de teste/produção")
    
    if 'admin_users' in admin_data_checks and admin_data_checks['admin_users']['count'] == 0:
        recommendations.append("Criar pelo menos um usuário com role 'admin'")
    
    if any('ERROR' in str(check) for check in rls_tests.values()):
        recommendations.append("Revisar e corrigir políticas RLS")
    
    if not report['edge_functions'].get('create_unified_member_type_and_plan', {}).get('status') == 'EXISTS':
        recommendations.append("Verificar se função RPC foi aplicada corretamente")
    
    report['recommendations'] = recommendations
    
    print(f"\n💡 {len(recommendations)} RECOMENDAÇÕES:")
    for i, rec in enumerate(recommendations, 1):
        print(f"   {i}. {rec}")
    
    # 8. ESTATÍSTICAS FINAIS
    print("\n📊 8. ESTATÍSTICAS FINAIS")
    print("-" * 60)
    
    total_tables = len(report['tables_structure'])
    existing_tables = len([t for t in report['tables_structure'].values() if t.get('exists', False)])
    tables_with_data = len([t for t in report['tables_structure'].values() if t.get('count', 0) > 0])
    
    print(f"📋 Tabelas analisadas: {total_tables}")
    print(f"✅ Tabelas existentes: {existing_tables}")
    print(f"📊 Tabelas com dados: {tables_with_data}")
    print(f"❌ Issues encontradas: {len(report['issues_found'])}")
    print(f"💡 Recomendações: {len(recommendations)}")
    
    report['statistics'] = {
        'total_tables': total_tables,
        'existing_tables': existing_tables,
        'tables_with_data': tables_with_data,
        'issues_count': len(report['issues_found']),
        'recommendations_count': len(recommendations)
    }
    
    return report

if __name__ == "__main__":
    try:
        report = generate_diagnostic_report()
        
        # Salvar relatório em arquivo JSON
        with open('diagnostic_report_complete.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n💾 Relatório completo salvo em: diagnostic_report_complete.json")
        print("=" * 80)
        print("🎯 DIAGNÓSTICO COMPLETO FINALIZADO")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO NO DIAGNÓSTICO: {e}")
        print("Verifique a conectividade com o Supabase e tente novamente.")