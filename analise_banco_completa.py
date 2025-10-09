#!/usr/bin/env python3
"""
Análise Completa do Banco de Dados - Módulo de Serviços
Tarefa 1 da Fase 1: Mapear estrutura atual
"""

from supabase import create_client, Client
import json
from datetime import datetime

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 100)
print("📊 ANÁLISE COMPLETA DO BANCO DE DADOS - MÓDULO DE SERVIÇOS")
print("=" * 100)
print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# ============================================================================
# 1. TABELAS RELACIONADAS A CERTIDÕES
# ============================================================================
print("\n" + "=" * 100)
print("1️⃣ TABELAS RELACIONADAS A CERTIDÕES")
print("=" * 100)

# 1.1 valores_certidoes
print("\n📋 Tabela: valores_certidoes")
print("-" * 100)
try:
    result = supabase.table('valores_certidoes').select('*').execute()
    if result.data:
        print(f"✅ Existe | Total de registros: {len(result.data)}")
        print(f"   Colunas: {list(result.data[0].keys())}")
        print("\n   Dados:")
        for item in result.data:
            print(f"   - {item.get('tipo')}: R$ {item.get('valor')} | {item.get('nome')} | Ativo: {item.get('is_active')}")
    else:
        print("⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# 1.2 certidoes (tipos)
print("\n📋 Tabela: certidoes")
print("-" * 100)
try:
    result = supabase.table('certidoes').select('*').execute()
    print(f"✅ Existe | Total de registros: {len(result.data)}")
    if result.data and len(result.data) > 0:
        print(f"   Colunas: {list(result.data[0].keys())}")
    else:
        print("   ⚠️ Tabela vazia - não é possível ver estrutura")
except Exception as e:
    print(f"❌ Erro: {e}")

# 1.3 solicitacoes_certidoes
print("\n📋 Tabela: solicitacoes_certidoes")
print("-" * 100)
try:
    result = supabase.table('solicitacoes_certidoes').select('*').limit(1).execute()
    total_result = supabase.table('solicitacoes_certidoes').select('*', count='exact').execute()
    total = total_result.count if hasattr(total_result, 'count') else len(total_result.data)
    
    print(f"✅ Existe | Total de registros: {total}")
    if result.data and len(result.data) > 0:
        print(f"   Colunas: {list(result.data[0].keys())}")
        print("\n   Amostra de dados:")
        for item in result.data:
            print(f"   - ID: {item.get('id')[:8]}... | Status: {item.get('status')} | User: {item.get('user_id')[:8]}...")
    else:
        print("   ⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# ============================================================================
# 2. TABELAS RELACIONADAS A REGULARIZAÇÃO
# ============================================================================
print("\n" + "=" * 100)
print("2️⃣ TABELAS RELACIONADAS A REGULARIZAÇÃO")
print("=" * 100)

# 2.1 servicos_regularizacao
print("\n📋 Tabela: servicos_regularizacao")
print("-" * 100)
try:
    result = supabase.table('servicos_regularizacao').select('*').order('sort_order').execute()
    print(f"✅ Existe | Total de registros: {len(result.data)}")
    if result.data:
        print(f"   Colunas: {list(result.data[0].keys())}")
        print("\n   Dados:")
        for item in result.data:
            print(f"   - {item.get('nome')}: R$ {item.get('valor')} | Ordem: {item.get('sort_order')} | Ativo: {item.get('is_active')}")
    else:
        print("   ⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# 2.2 solicitacoes_regularizacao
print("\n📋 Tabela: solicitacoes_regularizacao")
print("-" * 100)
try:
    result = supabase.table('solicitacoes_regularizacao').select('*').limit(1).execute()
    total_result = supabase.table('solicitacoes_regularizacao').select('*', count='exact').execute()
    total = total_result.count if hasattr(total_result, 'count') else len(total_result.data)
    
    print(f"✅ Existe | Total de registros: {total}")
    if result.data and len(result.data) > 0:
        print(f"   Colunas: {list(result.data[0].keys())}")
        print("\n   Amostra de dados:")
        for item in result.data:
            print(f"   - ID: {item.get('id')[:8]}... | Status: {item.get('status')} | Valor: R$ {item.get('valor_total')}")
    else:
        print("   ⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# ============================================================================
# 3. TABELA DE COBRANÇAS (ASAAS)
# ============================================================================
print("\n" + "=" * 100)
print("3️⃣ TABELA DE COBRANÇAS (ASAAS)")
print("=" * 100)

print("\n📋 Tabela: asaas_cobrancas")
print("-" * 100)
try:
    result = supabase.table('asaas_cobrancas').select('*').limit(1).execute()
    total_result = supabase.table('asaas_cobrancas').select('*', count='exact').execute()
    total = total_result.count if hasattr(total_result, 'count') else len(total_result.data)
    
    print(f"✅ Existe | Total de registros: {total}")
    if result.data and len(result.data) > 0:
        print(f"   Colunas: {list(result.data[0].keys())}")
        
        # Verificar se tem coluna service_type
        if 'service_type' in result.data[0]:
            print("   ✅ Coluna 'service_type' existe")
            
            # Contar por tipo
            certidoes = supabase.table('asaas_cobrancas').select('*', count='exact').eq('service_type', 'certidao').execute()
            regularizacao = supabase.table('asaas_cobrancas').select('*', count='exact').eq('service_type', 'regularizacao').execute()
            
            cert_count = certidoes.count if hasattr(certidoes, 'count') else len(certidoes.data)
            reg_count = regularizacao.count if hasattr(regularizacao, 'count') else len(regularizacao.data)
            
            print(f"   - Certidões: {cert_count} cobranças")
            print(f"   - Regularização: {reg_count} cobranças")
        else:
            print("   ⚠️ Coluna 'service_type' NÃO existe")
            
        # Verificar se tem coluna tipo_cobranca (antiga)
        if 'tipo_cobranca' in result.data[0]:
            print("   ⚠️ Coluna 'tipo_cobranca' existe (antiga)")
    else:
        print("   ⚠️ Tabela vazia")
except Exception as e:
    print(f"❌ Erro: {e}")

# ============================================================================
# 4. ANÁLISE DE DADOS ÓRFÃOS
# ============================================================================
print("\n" + "=" * 100)
print("4️⃣ ANÁLISE DE DADOS ÓRFÃOS")
print("=" * 100)

# 4.1 Solicitações de certidões sem payment_reference
print("\n🔍 Solicitações de certidões sem payment_reference:")
print("-" * 100)
try:
    result = supabase.table('solicitacoes_certidoes').select('id, status, payment_reference').is_('payment_reference', 'null').execute()
    print(f"   Total: {len(result.data)} solicitações sem referência de pagamento")
    if len(result.data) > 0:
        print("   ⚠️ Atenção: Existem solicitações sem vínculo com pagamento")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# 4.2 Solicitações de regularização sem payment_reference
print("\n🔍 Solicitações de regularização sem payment_reference:")
print("-" * 100)
try:
    result = supabase.table('solicitacoes_regularizacao').select('id, status, payment_reference').is_('payment_reference', 'null').execute()
    print(f"   Total: {len(result.data)} solicitações sem referência de pagamento")
    if len(result.data) > 0:
        print("   ⚠️ Atenção: Existem solicitações sem vínculo com pagamento")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# ============================================================================
# 5. RESUMO GERAL
# ============================================================================
print("\n" + "=" * 100)
print("5️⃣ RESUMO GERAL")
print("=" * 100)

print("\n📊 Contagem de Registros:")
print("-" * 100)

tabelas = {
    'valores_certidoes': 0,
    'certidoes': 0,
    'solicitacoes_certidoes': 0,
    'servicos_regularizacao': 0,
    'solicitacoes_regularizacao': 0,
    'asaas_cobrancas': 0
}

for tabela in tabelas.keys():
    try:
        result = supabase.table(tabela).select('*', count='exact').execute()
        tabelas[tabela] = result.count if hasattr(result, 'count') else len(result.data)
    except:
        tabelas[tabela] = 0

for tabela, count in tabelas.items():
    print(f"   {tabela:35} : {count:5} registros")

print("\n📈 Total de Registros a Migrar:")
print("-" * 100)
total_servicos = tabelas['valores_certidoes'] + tabelas['servicos_regularizacao']
total_solicitacoes = tabelas['solicitacoes_certidoes'] + tabelas['solicitacoes_regularizacao']
print(f"   Serviços (valores_certidoes + servicos_regularizacao)     : {total_servicos}")
print(f"   Solicitações (solicitacoes_certidoes + regularizacao)     : {total_solicitacoes}")

# ============================================================================
# 6. RECOMENDAÇÕES
# ============================================================================
print("\n" + "=" * 100)
print("6️⃣ RECOMENDAÇÕES PARA MIGRAÇÃO")
print("=" * 100)

print("\n✅ Tabelas que serão migradas:")
print("   1. valores_certidoes → servicos (categoria: certidao)")
print("   2. servicos_regularizacao → servicos (categoria: regularizacao)")
print("   3. solicitacoes_certidoes → solicitacoes_servicos")
print("   4. solicitacoes_regularizacao → solicitacoes_servicos")

print("\n⚠️ Atenções:")
if tabelas['solicitacoes_certidoes'] == 0 and tabelas['solicitacoes_regularizacao'] == 0:
    print("   ✅ Não há solicitações antigas - migração será simples")
else:
    print(f"   ⚠️ Existem {total_solicitacoes} solicitações que precisam ser migradas")
    print("   ⚠️ Verificar se todas têm payment_reference válido")

print("\n📋 Próximos Passos:")
print("   1. Criar backup de todas as tabelas")
print("   2. Criar novas tabelas (servicos, servico_exigencias, solicitacoes_servicos)")
print("   3. Configurar RLS policies")
print("   4. Executar migração de dados")
print("   5. Validar integridade")

print("\n" + "=" * 100)
print("✅ ANÁLISE CONCLUÍDA")
print("=" * 100)
print()
