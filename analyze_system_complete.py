#!/usr/bin/env python3
"""
Análise completa do sistema COMADEMIG para confirmar inconsistências
relatadas no plano-de-correcao-final.md
"""

from supabase import create_client, Client
import json

# Configurações do Supabase (extrair de src/integrations/supabase/client.ts)
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_database_structure():
    """Análise da estrutura do banco de dados"""
    print("🔍 ANÁLISE COMPLETA DO SISTEMA COMADEMIG")
    print("=" * 60)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Tabelas críticas para análise
    critical_tables = [
        'member_types',
        'subscription_plans', 
        'member_type_subscriptions',
        'profiles',
        'user_subscriptions',
        'asaas_cobrancas'
    ]
    
    results = {}
    
    print("\n📊 ANÁLISE DE TABELAS CRÍTICAS")
    print("-" * 40)
    
    for table in critical_tables:
        try:
            # Verificar existência e contar registros
            count_response = supabase.table(table).select('*', count='exact').execute()
            count = count_response.count
            
            # Pegar estrutura dos dados (primeiros registros)
            sample_response = supabase.table(table).select('*').limit(3).execute()
            sample_data = sample_response.data
            
            results[table] = {
                'exists': True,
                'count': count,
                'sample': sample_data,
                'columns': list(sample_data[0].keys()) if sample_data else []
            }
            
            print(f"✅ {table}: {count} registros")
            if sample_data:
                print(f"   Colunas: {', '.join(results[table]['columns'])}")
            else:
                print("   ⚠️  Tabela vazia")
                
        except Exception as e:
            results[table] = {
                'exists': False,
                'error': str(e)
            }
            print(f"❌ {table}: ERRO - {str(e)}")
    
    return results

def analyze_subscription_plans_structure(supabase):
    """Análise específica da tabela subscription_plans"""
    print("\n🔍 ANÁLISE DETALHADA: subscription_plans")
    print("-" * 40)
    
    try:
        # Verificar estrutura atual
        response = supabase.table('subscription_plans').select('*').limit(5).execute()
        data = response.data
        
        if data:
            print("✅ Estrutura atual da tabela:")
            for key in data[0].keys():
                print(f"   - {key}")
            
            print("\n📋 Dados de exemplo:")
            for i, plan in enumerate(data[:3]):
                print(f"   Plano {i+1}:")
                for key, value in plan.items():
                    print(f"     {key}: {value}")
                print()
        else:
            print("⚠️  Tabela subscription_plans está vazia")
            
    except Exception as e:
        print(f"❌ Erro ao analisar subscription_plans: {e}")

def analyze_member_types_structure(supabase):
    """Análise específica da tabela member_types"""
    print("\n🔍 ANÁLISE DETALHADA: member_types")
    print("-" * 40)
    
    try:
        response = supabase.table('member_types').select('*').limit(5).execute()
        data = response.data
        
        if data:
            print("✅ Estrutura atual da tabela:")
            for key in data[0].keys():
                print(f"   - {key}")
            
            print("\n📋 Dados de exemplo:")
            for i, member_type in enumerate(data[:3]):
                print(f"   Tipo {i+1}:")
                for key, value in member_type.items():
                    print(f"     {key}: {value}")
                print()
        else:
            print("⚠️  Tabela member_types está vazia")
            
    except Exception as e:
        print(f"❌ Erro ao analisar member_types: {e}")

def analyze_relationships(supabase):
    """Análise dos relacionamentos entre tabelas"""
    print("\n🔗 ANÁLISE DE RELACIONAMENTOS")
    print("-" * 40)
    
    try:
        # Verificar relacionamento member_types -> subscription_plans
        query = """
        SELECT 
            mt.id as member_type_id,
            mt.name as member_type_name,
            sp.id as plan_id,
            sp.name as plan_name,
            sp.price,
            sp.recurrence
        FROM member_types mt
        LEFT JOIN member_type_subscriptions mts ON mt.id = mts.member_type_id
        LEFT JOIN subscription_plans sp ON mts.subscription_plan_id = sp.id
        LIMIT 10
        """
        
        response = supabase.rpc('execute_sql', {'query': query}).execute()
        print("✅ Relacionamentos encontrados:")
        print(json.dumps(response.data, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"❌ Erro ao analisar relacionamentos: {e}")
        
        # Tentar análise alternativa
        try:
            print("\n🔄 Tentativa alternativa - verificando tabela de junção:")
            response = supabase.table('member_type_subscriptions').select('*').limit(5).execute()
            data = response.data
            
            if data:
                print("✅ Dados da tabela member_type_subscriptions:")
                for item in data:
                    print(f"   {item}")
            else:
                print("⚠️  Tabela member_type_subscriptions está vazia")
                
        except Exception as e2:
            print(f"❌ Erro na análise alternativa: {e2}")

def main():
    """Função principal de análise"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Análise geral das tabelas
    results = analyze_database_structure()
    
    # 2. Análise específica das tabelas críticas
    analyze_subscription_plans_structure(supabase)
    analyze_member_types_structure(supabase)
    
    # 3. Análise de relacionamentos
    analyze_relationships(supabase)
    
    print("\n" + "=" * 60)
    print("🎯 RESUMO DA ANÁLISE CONCLUÍDA")
    print("Verifique os resultados acima para confirmar as inconsistências")
    print("relatadas no plano-de-correcao-final.md")
    print("=" * 60)

if __name__ == "__main__":
    main()