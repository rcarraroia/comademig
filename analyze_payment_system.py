#!/usr/bin/env python3
"""
ANÁLISE COMPLETA DO SISTEMA DE PAGAMENTOS COMADEMIG
Usando dados reais do Supabase
"""

import json
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_complete_system():
    """Análise completa do sistema de pagamentos"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔍 ANÁLISE COMPLETA DO SISTEMA DE PAGAMENTOS COMADEMIG")
    print("=" * 60)
    
    # Tabelas relacionadas a pagamentos e assinaturas
    payment_tables = {
        # Sistema de Assinaturas
        'member_types': 'Tipos de membro',
        'subscription_plans': 'Planos de assinatura', 
        'user_subscriptions': 'Assinaturas dos usuários',
        'member_type_subscriptions': 'Relacionamentos tipo-plano',
        
        # Sistema de Pagamentos
        'asaas_cobrancas': 'Cobranças do Asaas',
        'asaas_webhooks': 'Webhooks do Asaas',
        'transactions': 'Transações de split',
        'referrals': 'Sistema de indicações',
        'affiliates': 'Sistema de afiliados',
        
        # Sistema de Certidões
        'solicitacoes_certidoes': 'Solicitações de certidões',
        'certidoes': 'Certidões emitidas',
        
        # Sistema Base
        'profiles': 'Perfis de usuários',
        'user_roles': 'Roles/permissões',
        'financeiro': 'Controle financeiro',
        
        # Outros
        'webhook_events': 'Eventos de webhook',
        'audit_logs': 'Logs de auditoria'
    }
    
    results = {}
    
    print("\n📊 VERIFICAÇÃO DE TABELAS E DADOS:")
    print("-" * 40)
    
    for table, description in payment_tables.items():
        try:
            # Contar registros
            count_response = supabase.table(table).select('*', count='exact').execute()
            count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
            
            # Pegar amostra de dados
            sample_response = supabase.table(table).select('*').limit(2).execute()
            sample = sample_response.data
            
            # Pegar estrutura (colunas)
            if sample:
                columns = list(sample[0].keys())
            else:
                columns = []
            
            results[table] = {
                'exists': True,
                'description': description,
                'count': count,
                'columns': columns,
                'sample': sample
            }
            
            status = "✅" if count > 0 else "⚠️"
            print(f"{status} {table}: {count} registros - {description}")
            
        except Exception as e:
            results[table] = {
                'exists': False,
                'description': description,
                'error': str(e)
            }
            print(f"❌ {table}: ERRO - {str(e)}")
    
    return results

def analyze_subscription_system(results):
    """Análise específica do sistema de assinaturas"""
    print("\n🎯 ANÁLISE DO SISTEMA DE ASSINATURAS:")
    print("-" * 40)
    
    subscription_tables = ['member_types', 'subscription_plans', 'user_subscriptions', 'member_type_subscriptions']
    
    all_exist = True
    for table in subscription_tables:
        if not results.get(table, {}).get('exists', False):
            all_exist = False
            break
    
    if all_exist:
        print("✅ SISTEMA DE ASSINATURAS: Todas as tabelas existem")
        
        # Análise detalhada dos dados
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Member Types
        member_types = supabase.table('member_types').select('*').execute().data
        print(f"📋 Tipos de Membro ({len(member_types)}):")
        for mt in member_types:
            print(f"   - {mt['name']}: {mt['description']} (ativo: {mt['is_active']})")
        
        # Subscription Plans
        plans = supabase.table('subscription_plans').select('*').execute().data
        print(f"📋 Planos de Assinatura ({len(plans)}):")
        for plan in plans:
            print(f"   - {plan['name']}: R$ {plan['price']} ({plan['recurrence']}) - ativo: {plan['is_active']}")
        
        # User Subscriptions
        user_subs = supabase.table('user_subscriptions').select('*').execute().data
        print(f"📋 Assinaturas Ativas: {len(user_subs)}")
        
        # Relacionamentos
        relationships = supabase.table('member_type_subscriptions').select('*').execute().data
        print(f"📋 Relacionamentos Tipo-Plano: {len(relationships)}")
        
    else:
        print("❌ SISTEMA DE ASSINATURAS: Tabelas ausentes")

def analyze_payment_system(results):
    """Análise específica do sistema de pagamentos"""
    print("\n💳 ANÁLISE DO SISTEMA DE PAGAMENTOS:")
    print("-" * 40)
    
    payment_tables = ['asaas_cobrancas', 'asaas_webhooks', 'transactions', 'affiliates']
    
    for table in payment_tables:
        if results.get(table, {}).get('exists', False):
            count = results[table]['count']
            print(f"✅ {table}: {count} registros")
        else:
            print(f"❌ {table}: Não existe ou erro")

def analyze_certification_system(results):
    """Análise específica do sistema de certidões"""
    print("\n📜 ANÁLISE DO SISTEMA DE CERTIDÕES:")
    print("-" * 40)
    
    cert_tables = ['solicitacoes_certidoes', 'certidoes']
    
    for table in cert_tables:
        if results.get(table, {}).get('exists', False):
            count = results[table]['count']
            print(f"✅ {table}: {count} registros")
            
            # Se há dados, mostrar estrutura
            if count > 0 and results[table]['sample']:
                sample = results[table]['sample'][0]
                print(f"   Estrutura: {list(sample.keys())}")
        else:
            print(f"❌ {table}: Não existe ou erro")

def identify_missing_tables():
    """Identifica tabelas que podem estar faltando"""
    print("\n🔍 VERIFICAÇÃO DE TABELAS AUSENTES:")
    print("-" * 40)
    
    # Tabelas que podem estar faltando baseado no código
    potential_missing = [
        'solicitacoes_regularizacao',  # Para sistema de regularização
        'member_system_audit',         # Auditoria específica do sistema
        'notification_templates',      # Templates de notificação
    ]
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    for table in potential_missing:
        try:
            response = supabase.table(table).select('*').limit(1).execute()
            print(f"✅ {table}: Existe")
        except Exception:
            print(f"❌ {table}: Não existe - pode precisar ser criada")

def generate_implementation_plan(results):
    """Gera plano de implementação baseado na análise"""
    print("\n🛠️ PLANO DE IMPLEMENTAÇÃO:")
    print("-" * 40)
    
    issues = []
    
    # Verificar sistema de assinaturas
    subscription_tables = ['member_types', 'subscription_plans', 'user_subscriptions', 'member_type_subscriptions']
    subscription_ok = all(results.get(table, {}).get('exists', False) for table in subscription_tables)
    
    if subscription_ok:
        print("✅ Sistema de Assinaturas: Funcionando")
        # Verificar se há assinaturas ativas
        if results.get('user_subscriptions', {}).get('count', 0) == 0:
            issues.append("⚠️ Nenhuma assinatura ativa - verificar fluxo de filiação")
    else:
        issues.append("🚨 Sistema de Assinaturas: Tabelas ausentes")
    
    # Verificar sistema de pagamentos
    if results.get('asaas_cobrancas', {}).get('count', 0) == 0:
        issues.append("⚠️ Nenhuma cobrança registrada - verificar integração Asaas")
    
    # Verificar sistema de certidões
    if results.get('solicitacoes_certidoes', {}).get('count', 0) == 0:
        issues.append("⚠️ Nenhuma solicitação de certidão - verificar se sistema está sendo usado")
    
    # Verificar sistema de regularização
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.table('solicitacoes_regularizacao').select('*').limit(1).execute()
    except Exception:
        issues.append("🚨 Sistema de Regularização: Tabela não existe")
    
    print("\n📋 PROBLEMAS IDENTIFICADOS:")
    for issue in issues:
        print(f"   {issue}")
    
    return issues

def main():
    """Função principal"""
    try:
        # Análise completa
        results = analyze_complete_system()
        
        # Análises específicas
        analyze_subscription_system(results)
        analyze_payment_system(results)
        analyze_certification_system(results)
        identify_missing_tables()
        
        # Plano de implementação
        issues = generate_implementation_plan(results)
        
        print("\n" + "=" * 60)
        print("📊 RESUMO DA ANÁLISE:")
        print(f"✅ Tabelas funcionais: {sum(1 for r in results.values() if r.get('exists', False))}")
        print(f"❌ Problemas identificados: {len(issues)}")
        print("=" * 60)
        
        return results, issues
        
    except Exception as e:
        print(f"❌ Erro na análise: {str(e)}")
        return None, None

if __name__ == "__main__":
    main()