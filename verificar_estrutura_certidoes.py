#!/usr/bin/env python3
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("🔍 VERIFICAÇÃO DETALHADA: ESTRUTURA DE CERTIDÕES")
print("=" * 80)

# Verificar solicitacoes_certidoes
print("\n1️⃣ Tabela: solicitacoes_certidoes")
try:
    result = supabase.table('solicitacoes_certidoes').select('*').limit(1).execute()
    if result.data:
        print(f"✅ Existe. Colunas: {list(result.data[0].keys())}")
    else:
        # Tentar inserir para ver estrutura
        print("⚠️ Tabela vazia. Tentando descobrir estrutura...")
        # Não vamos inserir, apenas verificar erro
except Exception as e:
    print(f"❌ Erro: {e}")

# Verificar certidoes (tipos)
print("\n2️⃣ Tabela: certidoes")
try:
    result = supabase.table('certidoes').select('*').execute()
    print(f"✅ Existe. Total registros: {len(result.data)}")
    if result.data:
        print(f"   Colunas: {list(result.data[0].keys())}")
except Exception as e:
    print(f"❌ Tabela não existe ou erro: {e}")

# Verificar valores_certidoes
print("\n3️⃣ Tabela: valores_certidoes")
try:
    result = supabase.table('valores_certidoes').select('*').execute()
    print(f"✅ Existe. Total registros: {len(result.data)}")
    if result.data:
        print(f"   Colunas: {list(result.data[0].keys())}")
except Exception as e:
    print(f"❌ Tabela não existe ou erro: {e}")

# Verificar asaas_cobrancas (para certidões)
print("\n4️⃣ Cobranças de Certidões em asaas_cobrancas:")
try:
    result = supabase.table('asaas_cobrancas').select('*').eq('tipo_cobranca', 'certidao').execute()
    print(f"Total cobranças de certidões: {len(result.data)}")
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n" + "=" * 80)
