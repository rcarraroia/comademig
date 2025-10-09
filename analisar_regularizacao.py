#!/usr/bin/env python3
from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("📋 ANÁLISE COMPLETA: SISTEMA DE REGULARIZAÇÃO")
print("=" * 80)

# 1. Estrutura da tabela solicitacoes_regularizacao
print("\n1️⃣ ESTRUTURA DA TABELA solicitacoes_regularizacao:")
try:
    result = supabase.table('solicitacoes_regularizacao').select('*').limit(1).execute()
    if result.data:
        print(f"✅ Colunas: {list(result.data[0].keys())}")
        print(f"   Total registros: {len(result.data)}")
    else:
        print("⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# 2. Dados existentes
print("\n2️⃣ DADOS EXISTENTES:")
try:
    result = supabase.table('solicitacoes_regularizacao').select('*').order('created_at', desc=True).execute()
    print(f"Total de registros: {len(result.data)}")
    
    if result.data:
        print("\nÚltimos 3 registros:")
        for r in result.data[:3]:
            print(f"  - ID: {r['id'][:8]}...")
            print(f"    Status: {r.get('status', 'N/A')}")
            print(f"    User ID: {r.get('user_id', 'N/A')[:8]}...")
            print(f"    Valor Total: R$ {r.get('valor_total', 0)}")
            print(f"    Criado: {r.get('created_at', 'N/A')}")
            print()
except Exception as e:
    print(f"❌ Erro: {e}")

# 3. Tabela de servicos_regularizacao (serviços disponíveis)
print("\n3️⃣ SERVIÇOS DISPONÍVEIS (tabela servicos_regularizacao):")
try:
    result = supabase.table('servicos_regularizacao').select('*').order('sort_order').execute()
    print(f"Total de serviços: {len(result.data)}")
    
    if result.data:
        for servico in result.data:
            print(f"  - {servico.get('nome', 'N/A')}: R$ {servico.get('valor', 0)}")
            print(f"    Ativo: {servico.get('is_active', False)}")
            print(f"    Ordem: {servico.get('sort_order', 0)}")
    else:
        print("⚠️ Tabela vazia - usando valores hardcoded no frontend")
except Exception as e:
    print(f"❌ Erro ao buscar servicos_regularizacao: {e}")

# 4. Verificar cobranças de regularização
print("\n4️⃣ COBRANÇAS DE REGULARIZAÇÃO em asaas_cobrancas:")
try:
    result = supabase.table('asaas_cobrancas').select('*').eq('service_type', 'regularizacao').execute()
    print(f"Total cobranças de regularização: {len(result.data)}")
    if result.data:
        for c in result.data[:3]:
            print(f"  - ID: {c['id'][:8]}... | Status: {c.get('status')} | Valor: R$ {c.get('value', 0)}")
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n" + "=" * 80)
