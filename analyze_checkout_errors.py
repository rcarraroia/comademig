#!/usr/bin/env python3
"""
Análise dos erros de checkout de serviços (certidões e regularização)
"""
from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_user_subscriptions():
    """Verificar estrutura da tabela user_subscriptions"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n" + "="*60)
    print("ANÁLISE: user_subscriptions")
    print("="*60)
    
    try:
        # Tentar query simples primeiro
        response = supabase.table('user_subscriptions').select('*').limit(1).execute()
        print(f"✅ Tabela existe")
        print(f"📊 Estrutura de 1 registro:")
        if response.data:
            print(json.dumps(response.data[0], indent=2, default=str))
        
        # Tentar query com joins (como no código)
        try:
            response_join = supabase.table('user_subscriptions').select(
                '*,subscription_plans(id,name,permissions,price,recurrence),member_types(id,name)'
            ).limit(1).execute()
            print("\n✅ Query com joins funciona")
        except Exception as e:
            print(f"\n❌ Query com joins FALHA: {str(e)}")
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

def analyze_services_tables():
    """Verificar tabelas relacionadas a serviços"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    tables = [
        'solicitacoes_certidoes',
        'solicitacoes_regularizacao',
        'asaas_cobrancas'
    ]
    
    print("\n" + "="*60)
    print("ANÁLISE: Tabelas de Serviços")
    print("="*60)
    
    for table in tables:
        try:
            response = supabase.table(table).select('*', count='exact').limit(1).execute()
            print(f"\n✅ {table}")
            print(f"   Total registros: {response.count}")
            if response.data:
                print(f"   Colunas: {list(response.data[0].keys())}")
        except Exception as e:
            print(f"\n❌ {table}: {str(e)}")

def check_user_profile():
    """Verificar dados do perfil do usuário de teste"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n" + "="*60)
    print("ANÁLISE: Perfil do Usuário de Teste")
    print("="*60)
    
    user_id = "324b8066-1be9-425b-8384-942134e012f7"
    
    try:
        response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        if response.data:
            print("\n✅ Perfil encontrado:")
            profile = response.data[0]
            print(f"   Nome: {profile.get('full_name')}")
            print(f"   Email: {profile.get('email')}")
            print(f"   CPF: {profile.get('cpf')}")
            print(f"   Telefone: {profile.get('phone')}")
            print(f"   Endereço: {profile.get('address')}")
            print(f"   CEP: {profile.get('postal_code')}")
            print(f"   Asaas Customer ID: {profile.get('asaas_customer_id')}")
        else:
            print("❌ Perfil não encontrado")
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

if __name__ == "__main__":
    analyze_user_subscriptions()
    analyze_services_tables()
    check_user_profile()
