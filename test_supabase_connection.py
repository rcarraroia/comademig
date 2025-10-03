#!/usr/bin/env python3
"""
Script para verificar estado atual do banco de dados Supabase
Analisa tabelas existentes relacionadas ao Asaas
"""

from supabase import create_client, Client

# Configurações extraídas do client.ts
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_asaas_tables():
    """Analisa tabelas relacionadas ao Asaas no banco de dados"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Lista de tabelas para verificar (após execução da migração)
    asaas_tables = [
        'asaas_cobrancas',        # ← DEVE SER CRIADA pela migração
        'asaas_customers',        # ← DEVE SER CRIADA pela migração  
        'asaas_subscriptions',    # ← DEVE SER CRIADA pela migração
        'asaas_splits',           # ← DEVE SER CRIADA pela migração
        'asaas_webhooks',         # ← JÁ EXISTE
        'payment_transactions',   # ← JÁ EXISTE
        'affiliate_commissions'   # ← JÁ EXISTE
    ]
    
    print("🔍 ANÁLISE DO BANCO DE DADOS ASAAS")
    print("=" * 50)
    
    results = {}
    
    for table in asaas_tables:
        try:
            # Tentar contar registros
            count_response = supabase.table(table).select('*', count='exact').execute()
            count = count_response.count
            
            # Pegar amostra de dados (máximo 2 registros)
            sample_response = supabase.table(table).select('*').limit(2).execute()
            sample = sample_response.data
            
            results[table] = {
                'exists': True,
                'count': count,
                'sample': sample,
                'columns': list(sample[0].keys()) if sample else []
            }
            
            print(f"✅ {table}")
            print(f"   📊 Registros: {count}")
            if sample:
                print(f"   🔧 Colunas: {', '.join(list(sample[0].keys()))}")
            print()
            
        except Exception as e:
            results[table] = {
                'exists': False,
                'error': str(e)
            }
            print(f"❌ {table}")
            print(f"   🚫 Erro: {str(e)}")
            print()
    
    # Resumo
    print("📋 RESUMO")
    print("=" * 50)
    existing = [t for t, r in results.items() if r.get('exists', False)]
    missing = [t for t, r in results.items() if not r.get('exists', False)]
    
    print(f"✅ Tabelas existentes ({len(existing)}): {', '.join(existing)}")
    print(f"❌ Tabelas faltantes ({len(missing)}): {', '.join(missing)}")
    
    # Análise específica da tabela asaas_cobrancas
    if 'asaas_cobrancas' in existing:
        print("\n🔍 ANÁLISE DETALHADA: asaas_cobrancas")
        print("-" * 30)
        cobrancas_data = results['asaas_cobrancas']
        required_columns = [
            'id', 'user_id', 'asaas_id', 'customer_id', 'valor', 'descricao',
            'forma_pagamento', 'status', 'data_vencimento', 'service_type', 'service_data'
        ]
        
        existing_columns = cobrancas_data.get('columns', [])
        missing_columns = [col for col in required_columns if col not in existing_columns]
        
        if missing_columns:
            print(f"⚠️  Colunas faltantes: {', '.join(missing_columns)}")
        else:
            print("✅ Todas as colunas necessárias estão presentes")
    
    return results

if __name__ == "__main__":
    try:
        analyze_asaas_tables()
    except Exception as e:
        print(f"❌ Erro durante análise: {e}")