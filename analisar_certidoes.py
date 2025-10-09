#!/usr/bin/env python3
from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("📋 ANÁLISE COMPLETA: SISTEMA DE CERTIDÕES")
print("=" * 80)

# 1. Estrutura da tabela
print("\n1️⃣ ESTRUTURA DA TABELA solicitacoes_certidoes:")
try:
    result = supabase.table('solicitacoes_certidoes').select('*').limit(1).execute()
    if result.data:
        print(f"✅ Colunas: {list(result.data[0].keys())}")
    else:
        print("⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# 2. Dados existentes
print("\n2️⃣ DADOS EXISTENTES:")
try:
    result = supabase.table('solicitacoes_certidoes').select('*').order('created_at', desc=True).execute()
    print(f"Total de registros: {len(result.data)}")
    
    if result.data:
        print("\nÚltimos 3 registros:")
        for r in result.data[:3]:
            print(f"  - ID: {r['id'][:8]}...")
            print(f"    Tipo: {r.get('tipo', 'N/A')}")
            print(f"    Status: {r.get('status', 'N/A')}")
            print(f"    User ID: {r.get('user_id', 'N/A')[:8]}...")
            print(f"    Criado: {r.get('created_at', 'N/A')}")
            print(f"    Dados: {json.dumps(r.get('dados_solicitacao', {}), indent=6)[:200]}...")
            print()
except Exception as e:
    print(f"❌ Erro: {e}")

# 3. Tabela de certidões (tipos disponíveis)
print("\n3️⃣ TIPOS DE CERTIDÕES DISPONÍVEIS (tabela certidoes):")
try:
    result = supabase.table('certidoes').select('*').execute()
    print(f"Total de tipos: {len(result.data)}")
    
    if result.data:
        for cert in result.data:
            print(f"  - {cert.get('tipo', 'N/A')}: R$ {cert.get('preco', 0)}")
            print(f"    Ativo: {cert.get('is_active', False)}")
except Exception as e:
    print(f"❌ Erro ao buscar certidoes: {e}")

# 4. Verificar RLS policies
print("\n4️⃣ TESTANDO ACESSO (RLS):")
try:
    # Tentar inserir um registro de teste (não vai commitar)
    test_data = {
        'user_id': 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',
        'tipo': 'teste',
        'status': 'pendente',
        'dados_solicitacao': {'teste': True}
    }
    print("  Tentando INSERT (teste)...")
    # Não vamos realmente inserir, só testar a permissão
    print("  ⚠️ Teste de INSERT desabilitado para não poluir banco")
except Exception as e:
    print(f"  ❌ INSERT bloqueado: {e}")

print("\n" + "=" * 80)
