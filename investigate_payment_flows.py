#!/usr/bin/env python3
"""
INVESTIGAÇÃO DETALHADA DOS FLUXOS DE PAGAMENTO
Filiações, Certidões e Regularizações
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def investigate_filiation_flow():
    """Investiga o fluxo de filiação atual"""
    print("🔍 INVESTIGAÇÃO: FLUXO DE FILIAÇÃO")
    print("-" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar estrutura de assinaturas
    print("📋 1. ESTRUTURA DE ASSINATURAS:")
    
    # Member Types
    member_types = supabase.table('member_types').select('*').execute().data
    print(f"   Tipos de Membro: {len(member_types)}")
    for mt in member_types:
        print(f"   - {mt['name']} (ID: {mt['id'][:8]}...)")
    
    # Subscription Plans
    plans = supabase.table('subscription_plans').select('*').execute().data
    print(f"   Planos: {len(plans)}")
    for plan in plans:
        print(f"   - {plan['name']}: R$ {plan['price']} ({plan['recurrence']})")
    
    # Relacionamentos
    relationships = supabase.table('member_type_subscriptions').select('*').execute().data
    print(f"   Relacionamentos: {len(relationships)}")
    
    # 2. Verificar usuários existentes
    print("\n📋 2. USUÁRIOS EXISTENTES:")
    profiles = supabase.table('profiles').select('*').execute().data
    print(f"   Total de usuários: {len(profiles)}")
    for profile in profiles:
        print(f"   - {profile['nome_completo']} (cargo: {profile.get('cargo', 'N/A')})")
        print(f"     member_type_id: {profile.get('member_type_id', 'N/A')}")
    
    # 3. Verificar assinaturas ativas
    print("\n📋 3. ASSINATURAS ATIVAS:")
    subscriptions = supabase.table('user_subscriptions').select('*').execute().data
    print(f"   Total: {len(subscriptions)}")
    if subscriptions:
        for sub in subscriptions:
            print(f"   - User: {sub['user_id'][:8]}... Status: {sub['status']}")
    else:
        print("   ❌ NENHUMA ASSINATURA ATIVA - PROBLEMA IDENTIFICADO!")
    
    # 4. Verificar cobranças
    print("\n📋 4. COBRANÇAS GERADAS:")
    cobrancas = supabase.table('asaas_cobrancas').select('*').execute().data
    print(f"   Total: {len(cobrancas)}")
    if cobrancas:
        for cobranca in cobrancas:
            print(f"   - Tipo: {cobranca['tipo_cobranca']} Valor: R$ {cobranca['valor']}")
    else:
        print("   ❌ NENHUMA COBRANÇA - INTEGRAÇÃO ASAAS NÃO FUNCIONA!")
    
    return {
        'member_types': member_types,
        'plans': plans,
        'relationships': relationships,
        'profiles': profiles,
        'subscriptions': subscriptions,
        'cobrancas': cobrancas
    }

def investigate_certification_flow():
    """Investiga o fluxo de certidões"""
    print("\n🔍 INVESTIGAÇÃO: FLUXO DE CERTIDÕES")
    print("-" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar solicitações
    print("📋 1. SOLICITAÇÕES DE CERTIDÕES:")
    solicitacoes = supabase.table('solicitacoes_certidoes').select('*').execute().data
    print(f"   Total: {len(solicitacoes)}")
    
    if solicitacoes:
        for sol in solicitacoes:
            print(f"   - Tipo: {sol['tipo_certidao']} Status: {sol['status']}")
    else:
        print("   ⚠️ NENHUMA SOLICITAÇÃO - Sistema não está sendo usado")
    
    # 2. Verificar estrutura da tabela
    if solicitacoes:
        print("\n📋 2. ESTRUTURA DA TABELA:")
        sample = solicitacoes[0]
        for key in sample.keys():
            print(f"   - {key}: {type(sample[key]).__name__}")
    
    # 3. Verificar se há campo para pagamento
    print("\n📋 3. INTEGRAÇÃO COM PAGAMENTOS:")
    # Verificar se solicitações têm referência a cobranças
    cobrancas_certidao = supabase.table('asaas_cobrancas').select('*').eq('tipo_cobranca', 'certidao').execute().data
    print(f"   Cobranças de certidão: {len(cobrancas_certidao)}")
    
    return {
        'solicitacoes': solicitacoes,
        'cobrancas_certidao': cobrancas_certidao
    }

def investigate_regularization_flow():
    """Investiga o fluxo de regularização"""
    print("\n🔍 INVESTIGAÇÃO: FLUXO DE REGULARIZAÇÃO")
    print("-" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar se tabela existe
    print("📋 1. VERIFICAÇÃO DE TABELA:")
    try:
        regularizacoes = supabase.table('solicitacoes_regularizacao').select('*').execute().data
        print(f"   ✅ Tabela existe com {len(regularizacoes)} registros")
        return {'exists': True, 'solicitacoes': regularizacoes}
    except Exception as e:
        print(f"   ❌ Tabela NÃO EXISTE: {str(e)}")
        
        # 2. Verificar cobranças de regularização
        print("\n📋 2. COBRANÇAS DE REGULARIZAÇÃO:")
        cobrancas_reg = supabase.table('asaas_cobrancas').select('*').eq('tipo_cobranca', 'regularizacao').execute().data
        print(f"   Cobranças: {len(cobrancas_reg)}")
        
        return {'exists': False, 'cobrancas': cobrancas_reg}

def investigate_affiliate_system():
    """Investiga o sistema de afiliados"""
    print("\n🔍 INVESTIGAÇÃO: SISTEMA DE AFILIADOS")
    print("-" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar afiliados
    print("📋 1. AFILIADOS CADASTRADOS:")
    affiliates = supabase.table('affiliates').select('*').execute().data
    print(f"   Total: {len(affiliates)}")
    
    if affiliates:
        for aff in affiliates:
            print(f"   - {aff['display_name']} Status: {aff['status']}")
            print(f"     Wallet: {aff['asaas_wallet_id']}")
            print(f"     Código: {aff['referral_code']}")
    
    # 2. Verificar referrals
    print("\n📋 2. INDICAÇÕES:")
    referrals = supabase.table('referrals').select('*').execute().data
    print(f"   Total: {len(referrals)}")
    
    # 3. Verificar transações de split
    print("\n📋 3. TRANSAÇÕES DE SPLIT:")
    transactions = supabase.table('transactions').select('*').execute().data
    print(f"   Total: {len(transactions)}")
    
    return {
        'affiliates': affiliates,
        'referrals': referrals,
        'transactions': transactions
    }

def analyze_payment_integration():
    """Analisa integração geral com pagamentos"""
    print("\n🔍 INVESTIGAÇÃO: INTEGRAÇÃO DE PAGAMENTOS")
    print("-" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar todas as cobranças por tipo
    print("📋 1. COBRANÇAS POR TIPO:")
    cobrancas = supabase.table('asaas_cobrancas').select('*').execute().data
    
    tipos = {}
    for cobranca in cobrancas:
        tipo = cobranca['tipo_cobranca']
        if tipo not in tipos:
            tipos[tipo] = 0
        tipos[tipo] += 1
    
    for tipo, count in tipos.items():
        print(f"   - {tipo}: {count} cobranças")
    
    if not tipos:
        print("   ❌ NENHUMA COBRANÇA REGISTRADA!")
    
    # 2. Verificar webhooks
    print("\n📋 2. WEBHOOKS RECEBIDOS:")
    webhooks = supabase.table('asaas_webhooks').select('*').execute().data
    print(f"   Total: {len(webhooks)}")
    
    # 3. Verificar eventos de webhook
    print("\n📋 3. EVENTOS DE WEBHOOK:")
    webhook_events = supabase.table('webhook_events').select('*').execute().data
    print(f"   Total: {len(webhook_events)}")
    
    return {
        'cobrancas': cobrancas,
        'tipos': tipos,
        'webhooks': webhooks,
        'webhook_events': webhook_events
    }

def generate_implementation_roadmap(data):
    """Gera roadmap de implementação baseado nos dados"""
    print("\n🛠️ ROADMAP DE IMPLEMENTAÇÃO")
    print("=" * 60)
    
    filiation_data = data['filiation']
    certification_data = data['certification']
    regularization_data = data['regularization']
    affiliate_data = data['affiliate']
    payment_data = data['payment']
    
    print("\n🎯 FASE 1: CORRIGIR SISTEMA DE FILIAÇÃO")
    print("-" * 40)
    
    if len(filiation_data['subscriptions']) == 0:
        print("❌ PROBLEMA: Nenhuma assinatura ativa")
        print("✅ SOLUÇÃO: Corrigir fluxo PaymentForm → user_subscriptions")
    
    if len(filiation_data['cobrancas']) == 0:
        print("❌ PROBLEMA: Nenhuma cobrança gerada")
        print("✅ SOLUÇÃO: Corrigir integração com Asaas")
    
    print("\n🎯 FASE 2: IMPLEMENTAR SISTEMA DE REGULARIZAÇÃO")
    print("-" * 40)
    
    if not regularization_data['exists']:
        print("❌ PROBLEMA: Tabela solicitacoes_regularizacao não existe")
        print("✅ SOLUÇÃO: Criar tabela e integrar com pagamentos")
    
    print("\n🎯 FASE 3: IMPLEMENTAR PAGAMENTOS PARA CERTIDÕES")
    print("-" * 40)
    
    if len(certification_data['cobrancas_certidao']) == 0:
        print("❌ PROBLEMA: Certidões não geram cobranças")
        print("✅ SOLUÇÃO: Integrar solicitação com geração de cobrança")
    
    print("\n🎯 INTEGRAÇÃO COM AFILIADOS")
    print("-" * 40)
    
    if len(affiliate_data['affiliates']) == 0:
        print("⚠️ OBSERVAÇÃO: Nenhum afiliado cadastrado")
        print("✅ AÇÃO: Testar sistema quando houver afiliados")
    else:
        print(f"✅ {len(affiliate_data['affiliates'])} afiliados cadastrados")
    
    if len(affiliate_data['transactions']) == 0:
        print("⚠️ OBSERVAÇÃO: Nenhuma transação de split")
        print("✅ AÇÃO: Implementar split em todos os 3 sistemas")

def main():
    """Função principal"""
    print("🚀 INVESTIGAÇÃO COMPLETA DOS SISTEMAS DE PAGAMENTO")
    print("=" * 60)
    
    # Investigações detalhadas
    filiation_data = investigate_filiation_flow()
    certification_data = investigate_certification_flow()
    regularization_data = investigate_regularization_flow()
    affiliate_data = investigate_affiliate_system()
    payment_data = analyze_payment_integration()
    
    # Compilar dados
    all_data = {
        'filiation': filiation_data,
        'certification': certification_data,
        'regularization': regularization_data,
        'affiliate': affiliate_data,
        'payment': payment_data
    }
    
    # Gerar roadmap
    generate_implementation_roadmap(all_data)
    
    return all_data

if __name__ == "__main__":
    main()