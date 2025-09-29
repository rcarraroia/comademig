#!/usr/bin/env python3
"""
Script para verificar as constraints reais da tabela subscription_plans
usando APENAS LEITURA conforme regras do Supabase
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    # Extrair configurações de src/integrations/supabase/client.ts
    SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def analyze_constraints():
    """Analisa as constraints reais do banco usando APENAS LEITURA"""
    print("🔍 ANÁLISE DE CONSTRAINTS REAIS - subscription_plans")
    print("=" * 60)
    print("⚠️  USANDO APENAS LEITURA - NÃO EXECUTANDO OPERAÇÕES DE ESCRITA")
    print()
    
    supabase = get_supabase_client()
    
    # 1. Verificar se existem registros para analisar valores válidos
    print("📋 VERIFICANDO REGISTROS EXISTENTES:")
    print("-" * 50)
    
    try:
        response = supabase.table('subscription_plans').select('*').execute()
        
        if response.data:
            print(f"✅ Encontrados {len(response.data)} registros existentes")
            print("\n📊 VALORES DE RECORRÊNCIA EXISTENTES:")
            
            recurrence_values = set()
            for record in response.data:
                if 'recurrence' in record and record['recurrence']:
                    recurrence_values.add(record['recurrence'])
                    print(f"   • ID: {record.get('id', 'N/A')[:8]}... - Recorrência: '{record['recurrence']}'")
            
            if recurrence_values:
                print(f"\n✅ VALORES VÁLIDOS DESCOBERTOS: {list(recurrence_values)}")
            else:
                print("\n⚠️  Nenhum valor de recorrência encontrado nos registros")
                
        else:
            print("📋 Tabela está vazia - não há registros para analisar")
            
    except Exception as e:
        print(f"❌ Erro ao verificar registros: {str(e)}")
    
    # 2. Analisar a mensagem de erro para descobrir valores válidos
    print(f"\n🚨 ANÁLISE DO ERRO REPORTADO:")
    print("-" * 50)
    print("Erro: 'Recorrência deve ser Mensal ou Anual'")
    print("Função: validate_subscription_plan_data()")
    print("✅ VALORES VÁLIDOS IDENTIFICADOS: 'Mensal', 'Anual'")
    
    # 3. Verificar se há outros registros com valores diferentes
    print(f"\n🔍 TESTANDO VALORES POSSÍVEIS (APENAS LEITURA):")
    print("-" * 50)
    
    possible_values = ['Mensal', 'Anual', 'monthly', 'annual', 'semestral', 'Semestral']
    
    for value in possible_values:
        try:
            # APENAS SELECT - não INSERT
            response = supabase.table('subscription_plans').select('id').eq('recurrence', value).limit(1).execute()
            
            if response.data:
                print(f"✅ '{value}': EXISTE no banco ({len(response.data)} registro(s))")
            else:
                print(f"❌ '{value}': NÃO encontrado no banco")
                
        except Exception as e:
            print(f"⚠️  '{value}': Erro ao verificar - {str(e)}")
    
    # 4. Gerar script SQL correto
    print(f"\n📝 SCRIPT SQL CORRETO BASEADO NA ANÁLISE:")
    print("-" * 50)
    print("-- Script baseado na análise real do banco")
    print("-- Função validate_subscription_plan_data() espera: 'Mensal' ou 'Anual'")
    print()
    print("INSERT INTO subscription_plans (plan_title, description, price, recurrence, is_active) VALUES")
    print("('Anuidade Pastor 2025', 'Plano anual para pastores com acesso completo', 120.00, 'Anual', true),")
    print("('Anuidade Membro Regular', 'Plano básico anual para membros', 60.00, 'Anual', true),")
    print("('Contribuição Mensal Básica', 'Plano mensal para membros regulares', 35.00, 'Mensal', true);")
    
    print(f"\n🎯 CORREÇÕES NECESSÁRIAS NO FRONTEND:")
    print("-" * 50)
    print("1. Schema do formulário deve aceitar: 'Mensal', 'Anual'")
    print("2. Opções do select devem ser: 'Mensal', 'Anual'")
    print("3. Função de formatação deve mapear corretamente")
    
    print("\n" + "=" * 60)
    print("✅ ANÁLISE CONCLUÍDA - APENAS LEITURA UTILIZADA")

if __name__ == "__main__":
    analyze_constraints()