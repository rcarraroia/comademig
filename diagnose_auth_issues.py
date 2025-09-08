#!/usr/bin/env python3
"""
DIAGNÓSTICO DE PROBLEMAS DE AUTENTICAÇÃO E EDGE FUNCTIONS
"""

import json
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def diagnose_auth_system():
    """Diagnostica problemas no sistema de autenticação"""
    print("🔍 DIAGNÓSTICO DO SISTEMA DE AUTENTICAÇÃO")
    print("=" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # 1. Verificar se há usuários no sistema
        print("\n📋 Verificando usuários existentes...")
        profiles = supabase.table('profiles').select('*').execute()
        print(f"✅ Usuários encontrados: {len(profiles.data)}")
        
        if profiles.data:
            for profile in profiles.data:
                print(f"   - {profile.get('nome_completo', 'N/A')} (ID: {profile['id'][:8]}...)")
        
        # 2. Verificar user_roles
        print("\n📋 Verificando roles de usuário...")
        roles = supabase.table('user_roles').select('*').execute()
        print(f"✅ Roles encontradas: {len(roles.data)}")
        
        if roles.data:
            for role in roles.data:
                print(f"   - User: {role['user_id'][:8]}... Role: {role['role']}")
        else:
            print("⚠️ PROBLEMA: Nenhuma role encontrada!")
        
        # 3. Verificar assinaturas ativas
        print("\n📋 Verificando assinaturas ativas...")
        subscriptions = supabase.table('user_subscriptions').select('*').execute()
        print(f"✅ Assinaturas encontradas: {len(subscriptions.data)}")
        
        if subscriptions.data:
            for sub in subscriptions.data:
                print(f"   - User: {sub['user_id'][:8]}... Status: {sub['status']}")
        else:
            print("⚠️ PROBLEMA: Nenhuma assinatura ativa!")
        
        # 4. Testar função de permissões
        print("\n📋 Testando função get_user_permissions...")
        if profiles.data:
            first_user_id = profiles.data[0]['id']
            try:
                result = supabase.rpc('get_user_permissions', {'p_user_id': first_user_id}).execute()
                print(f"✅ Função funcionando: {result.data}")
            except Exception as e:
                print(f"❌ Erro na função: {str(e)}")
        
        return {
            'users_count': len(profiles.data),
            'roles_count': len(roles.data),
            'subscriptions_count': len(subscriptions.data),
            'has_admin': any(role['role'] == 'admin' for role in roles.data)
        }
        
    except Exception as e:
        print(f"❌ Erro no diagnóstico: {str(e)}")
        return None

def diagnose_payment_system():
    """Diagnostica problemas no sistema de pagamentos"""
    print("\n💳 DIAGNÓSTICO DO SISTEMA DE PAGAMENTOS")
    print("=" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # 1. Verificar tabelas de pagamento
        print("\n📋 Verificando tabelas de pagamento...")
        
        # Asaas cobranças
        cobrancas = supabase.table('asaas_cobrancas').select('*').execute()
        print(f"✅ Cobranças Asaas: {len(cobrancas.data)}")
        
        # Valores de certidões
        valores_cert = supabase.table('valores_certidoes').select('*').execute()
        print(f"✅ Valores de certidões: {len(valores_cert.data)}")
        
        if valores_cert.data:
            for valor in valores_cert.data:
                print(f"   - {valor['tipo']}: R$ {valor['valor']}")
        
        # Solicitações de regularização
        try:
            reg_solicitacoes = supabase.table('solicitacoes_regularizacao').select('*').execute()
            print(f"✅ Solicitações de regularização: {len(reg_solicitacoes.data)}")
        except Exception as e:
            print(f"❌ Tabela solicitacoes_regularizacao: {str(e)}")
        
        # 2. Testar função de cálculo de certidão
        print("\n📋 Testando função calculate_certification_value...")
        try:
            result = supabase.rpc('calculate_certification_value', {'tipo_certidao_param': 'ministerio'}).execute()
            print(f"✅ Função funcionando: R$ {result.data}")
        except Exception as e:
            print(f"❌ Erro na função: {str(e)}")
        
        return {
            'cobrancas_count': len(cobrancas.data),
            'valores_cert_count': len(valores_cert.data),
            'functions_working': True
        }
        
    except Exception as e:
        print(f"❌ Erro no diagnóstico de pagamentos: {str(e)}")
        return None

def check_edge_functions_config():
    """Verifica configuração das Edge Functions"""
    print("\n⚙️ VERIFICAÇÃO DE CONFIGURAÇÃO DAS EDGE FUNCTIONS")
    print("=" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Tentar uma chamada simples para verificar se as funções existem
    functions_to_test = [
        'asaas-create-payment',
        'asaas-webhook', 
        'affiliates-management'
    ]
    
    for func_name in functions_to_test:
        try:
            print(f"\n📋 Testando existência de {func_name}...")
            # Fazer uma chamada mínima só para ver se a função existe
            response = supabase.functions.invoke(func_name, {'body': {}})
            print(f"✅ Função {func_name} existe (pode ter erro de dados, mas existe)")
        except Exception as e:
            error_msg = str(e).lower()
            if 'not found' in error_msg or '404' in error_msg:
                print(f"❌ Função {func_name} NÃO EXISTE")
            else:
                print(f"⚠️ Função {func_name} existe mas tem problemas: {str(e)}")

def suggest_fixes(auth_results, payment_results):
    """Sugere correções baseadas nos diagnósticos"""
    print("\n🛠️ SUGESTÕES DE CORREÇÃO")
    print("=" * 50)
    
    fixes_needed = []
    
    if auth_results:
        if auth_results['roles_count'] == 0:
            fixes_needed.append("🔧 CRÍTICO: Criar roles de usuário (especialmente admin)")
        
        if auth_results['subscriptions_count'] == 0:
            fixes_needed.append("🔧 IMPORTANTE: Criar assinatura para pelo menos um usuário admin")
        
        if not auth_results['has_admin']:
            fixes_needed.append("🔧 CRÍTICO: Configurar pelo menos um usuário como admin")
    
    if not fixes_needed:
        fixes_needed.append("✅ Sistema de autenticação parece estar funcionando")
    
    print("\n📋 Correções necessárias:")
    for i, fix in enumerate(fixes_needed, 1):
        print(f"{i}. {fix}")
    
    return fixes_needed

def main():
    """Função principal"""
    print("🚀 DIAGNÓSTICO COMPLETO DO SISTEMA")
    print("=" * 60)
    
    # Diagnósticos
    auth_results = diagnose_auth_system()
    payment_results = diagnose_payment_system()
    check_edge_functions_config()
    
    # Sugestões
    fixes = suggest_fixes(auth_results, payment_results)
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DO DIAGNÓSTICO")
    print(f"✅ Usuários: {auth_results['users_count'] if auth_results else 'N/A'}")
    print(f"✅ Roles: {auth_results['roles_count'] if auth_results else 'N/A'}")
    print(f"✅ Assinaturas: {auth_results['subscriptions_count'] if auth_results else 'N/A'}")
    print(f"✅ Valores de certidão: {payment_results['valores_cert_count'] if payment_results else 'N/A'}")
    print(f"🔧 Correções necessárias: {len(fixes)}")
    print("=" * 60)

if __name__ == "__main__":
    main()