#!/usr/bin/env python3
"""
Análise da implementação dos serviços de Certidões, Regularização e Filiação
"""
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_services():
    """Análise completa dos serviços implementados"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔍 ANÁLISE DOS SERVIÇOS - CERTIDÕES, REGULARIZAÇÃO E FILIAÇÃO")
    print("=" * 80)
    
    # 1. Verificar tabelas relacionadas a certidões
    print("\n📋 1. SISTEMA DE CERTIDÕES")
    print("-" * 40)
    
    try:
        # Verificar solicitações de certidões
        certidoes_response = supabase.table('solicitacoes_certidoes').select('*', count='exact').execute()
        print(f"✅ Tabela 'solicitacoes_certidoes': {certidoes_response.count} registros")
        
        if certidoes_response.data:
            sample = certidoes_response.data[0]
            print(f"   📄 Estrutura: {list(sample.keys())}")
            print(f"   📊 Status disponíveis: {set([r['status'] for r in certidoes_response.data])}")
        
        # Verificar valores de certidões
        valores_response = supabase.table('valores_certidoes').select('*').execute()
        print(f"✅ Tabela 'valores_certidoes': {len(valores_response.data)} tipos configurados")
        for valor in valores_response.data:
            print(f"   💰 {valor['tipo']}: R$ {valor['valor']}")
            
    except Exception as e:
        print(f"❌ Erro ao verificar certidões: {str(e)}")
    
    # 2. Verificar sistema de regularização
    print("\n🏛️ 2. SISTEMA DE REGULARIZAÇÃO")
    print("-" * 40)
    
    try:
        # Verificar solicitações de regularização
        reg_response = supabase.table('solicitacoes_regularizacao').select('*', count='exact').execute()
        print(f"✅ Tabela 'solicitacoes_regularizacao': {reg_response.count} registros")
        
        # Verificar serviços de regularização
        servicos_response = supabase.table('servicos_regularizacao').select('*').execute()
        print(f"✅ Tabela 'servicos_regularizacao': {len(servicos_response.data)} serviços")
        for servico in servicos_response.data:
            print(f"   🔧 {servico['nome']}: R$ {servico['valor']}")
            
    except Exception as e:
        print(f"❌ Erro ao verificar regularização: {str(e)}")

if __name__ == "__main__":
    analyze_services()    

    # 3. Verificar sistema de filiação
    print("\n👥 3. SISTEMA DE FILIAÇÃO")
    print("-" * 40)
    
    try:
        # Verificar tipos de membro
        member_types_response = supabase.table('member_types').select('*').execute()
        print(f"✅ Tabela 'member_types': {len(member_types_response.data)} tipos")
        for tipo in member_types_response.data:
            status = "Ativo" if tipo['is_active'] else "Inativo"
            print(f"   👤 {tipo['name']}: {status}")
        
        # Verificar planos de assinatura
        plans_response = supabase.table('subscription_plans').select('*').execute()
        print(f"✅ Tabela 'subscription_plans': {len(plans_response.data)} planos")
        for plano in plans_response.data:
            status = "Ativo" if plano['is_active'] else "Inativo"
            print(f"   💳 {plano['name']}: R$ {plano['price']}/{plano['recurrence']} - {status}")
        
        # Verificar assinaturas de usuários
        subscriptions_response = supabase.table('user_subscriptions').select('*', count='exact').execute()
        print(f"✅ Tabela 'user_subscriptions': {subscriptions_response.count} assinaturas")
        
    except Exception as e:
        print(f"❌ Erro ao verificar filiação: {str(e)}")
    
    # 4. Verificar sistema de pagamentos
    print("\n💳 4. SISTEMA DE PAGAMENTOS")
    print("-" * 40)
    
    try:
        # Verificar cobranças do Asaas
        cobrancas_response = supabase.table('asaas_cobrancas').select('*', count='exact').execute()
        print(f"✅ Tabela 'asaas_cobrancas': {cobrancas_response.count} cobranças")
        
        if cobrancas_response.data:
            tipos_cobranca = set([r['tipo_cobranca'] for r in cobrancas_response.data if r['tipo_cobranca']])
            print(f"   📊 Tipos de cobrança: {tipos_cobranca}")
            
            status_cobrancas = set([r['status'] for r in cobrancas_response.data if r['status']])
            print(f"   📊 Status das cobranças: {status_cobrancas}")
        
    except Exception as e:
        print(f"❌ Erro ao verificar pagamentos: {str(e)}")
    
    # 5. Análise de problemas identificados
    print("\n🚨 5. PROBLEMAS IDENTIFICADOS")
    print("-" * 40)
    
    problems = []
    
    # Verificar se certidões têm integração com pagamentos
    try:
        certidoes_sem_pagamento = supabase.table('solicitacoes_certidoes').select('*').eq('status', 'pendente').execute()
        if certidoes_sem_pagamento.data:
            problems.append(f"❌ {len(certidoes_sem_pagamento.data)} certidões pendentes sem processo de pagamento")
    except:
        problems.append("❌ Não foi possível verificar integração certidões-pagamento")
    
    # Verificar se regularização tem integração com pagamentos
    try:
        reg_sem_pagamento = supabase.table('solicitacoes_regularizacao').select('*').is_('payment_reference', 'null').execute()
        if reg_sem_pagamento.data:
            problems.append(f"❌ {len(reg_sem_pagamento.data)} regularizações sem referência de pagamento")
    except:
        problems.append("❌ Não foi possível verificar integração regularização-pagamento")
    
    if problems:
        for problem in problems:
            print(problem)
    else:
        print("✅ Nenhum problema crítico identificado")
    
    print("\n" + "=" * 80)
    print("📋 RESUMO DA ANÁLISE CONCLUÍDA")