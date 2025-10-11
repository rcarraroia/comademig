#!/usr/bin/env python3
"""
Script para analisar o estado atual das tabelas relacionadas a assinaturas
ANTES de implementar mudanças no sistema de filiação
"""
from supabase import create_client, Client
import json

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_table(supabase: Client, table_name: str):
    """Análise completa de uma tabela"""
    print(f"\n{'='*70}")
    print(f"ANÁLISE DA TABELA: {table_name}")
    print(f"{'='*70}\n")
    
    try:
        # 1. Verificar existência e contar registros
        count_response = supabase.table(table_name).select('*', count='exact').execute()
        print(f"✅ Tabela existe")
        print(f"📊 Total de registros: {count_response.count}")
        
        # 2. Pegar amostra de dados
        sample_response = supabase.table(table_name).select('*').limit(3).execute()
        print(f"\n📋 Amostra de dados (primeiros 3 registros):")
        for i, record in enumerate(sample_response.data, 1):
            print(f"\nRegistro {i}:")
            print(json.dumps(record, indent=2, default=str))
        
        # 3. Identificar colunas
        if sample_response.data:
            columns = list(sample_response.data[0].keys())
            print(f"\n📝 Colunas identificadas ({len(columns)}):")
            for col in columns:
                print(f"  - {col}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao analisar tabela: {str(e)}")
        return False

def main():
    """Função principal de análise"""
    print("\n" + "="*70)
    print("ANÁLISE PRÉVIA DO BANCO DE DADOS - SISTEMA DE ASSINATURAS")
    print("="*70)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Tabelas a serem analisadas
    tables_to_check = [
        'profiles',
        'member_types',
        'subscription_plans',
        'user_subscriptions',
        'asaas_cobrancas'
    ]
    
    results = {}
    
    for table in tables_to_check:
        results[table] = analyze_table(supabase, table)
    
    # Resumo final
    print(f"\n{'='*70}")
    print("RESUMO DA ANÁLISE")
    print(f"{'='*70}\n")
    
    for table, exists in results.items():
        status = "✅ Existe" if exists else "❌ Não existe"
        print(f"{table}: {status}")
    
    # Verificações específicas para assinaturas
    print(f"\n{'='*70}")
    print("VERIFICAÇÕES ESPECÍFICAS")
    print(f"{'='*70}\n")
    
    # Verificar se profiles tem campos relacionados ao Asaas
    try:
        profile_sample = supabase.table('profiles').select('*').limit(1).execute()
        if profile_sample.data:
            profile_cols = list(profile_sample.data[0].keys())
            asaas_fields = [col for col in profile_cols if 'asaas' in col.lower()]
            print(f"Campos do Asaas em profiles: {asaas_fields if asaas_fields else 'Nenhum'}")
    except Exception as e:
        print(f"Erro ao verificar campos Asaas em profiles: {e}")

if __name__ == "__main__":
    main()
