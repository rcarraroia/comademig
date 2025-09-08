#!/usr/bin/env python3
"""
ANÁLISE OBRIGATÓRIA DO ESTADO ATUAL DO BANCO
Verificar estrutura e dados existentes ANTES de qualquer migração
"""
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analyze_asaas_cobrancas_table():
    """Análise completa da tabela asaas_cobrancas"""
    
    print("🔍 ANÁLISE OBRIGATÓRIA DO ESTADO ATUAL DO BANCO")
    print("=" * 60)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # 1. Verificar estrutura atual da tabela
        print("\n📋 1. ESTRUTURA ATUAL DA TABELA asaas_cobrancas")
        print("-" * 50)
        
        # Buscar uma amostra para ver colunas existentes
        sample = supabase.table('asaas_cobrancas').select('*').limit(1).execute()
        
        if sample.data:
            print("✅ Tabela existe")
            print(f"📊 Colunas existentes: {list(sample.data[0].keys())}")
            
            # Verificar se service_type e service_data já existem
            has_service_type = 'service_type' in sample.data[0]
            has_service_data = 'service_data' in sample.data[0]
            
            print(f"🔍 Coluna 'service_type' existe: {'✅ SIM' if has_service_type else '❌ NÃO'}")
            print(f"🔍 Coluna 'service_data' existe: {'✅ SIM' if has_service_data else '❌ NÃO'}")
        else:
            print("⚠️ Tabela vazia, mas estrutura existe")
        
        # 2. Analisar valores únicos em tipo_cobranca
        print(f"\n📊 2. VALORES ÚNICOS EM 'tipo_cobranca'")
        print("-" * 50)
        
        all_records = supabase.table('asaas_cobrancas').select('tipo_cobranca').execute()
        
        if all_records.data:
            # Contar valores únicos
            tipo_cobranca_counts = {}
            for record in all_records.data:
                tipo = record.get('tipo_cobranca')
                if tipo:
                    tipo_cobranca_counts[tipo] = tipo_cobranca_counts.get(tipo, 0) + 1
                else:
                    tipo_cobranca_counts['NULL'] = tipo_cobranca_counts.get('NULL', 0) + 1
            
            print(f"📈 Total de registros: {len(all_records.data)}")
            print("📊 Distribuição por tipo_cobranca:")
            
            for tipo, count in sorted(tipo_cobranca_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"   - {tipo}: {count} registros")
            
            # Listar todos os valores únicos para o constraint
            valores_unicos = [k for k in tipo_cobranca_counts.keys() if k != 'NULL']
            print(f"\n🎯 Valores únicos não-nulos: {valores_unicos}")
            
        else:
            print("📊 Nenhum registro encontrado")
        
        # 3. Verificar registros recentes
        print(f"\n📅 3. REGISTROS MAIS RECENTES")
        print("-" * 50)
        
        recent = supabase.table('asaas_cobrancas').select('*').order('created_at', desc=True).limit(3).execute()
        
        if recent.data:
            for i, record in enumerate(recent.data, 1):
                print(f"📄 Registro {i}:")
                print(f"   - ID: {record.get('id', 'N/A')}")
                print(f"   - Tipo Cobrança: {record.get('tipo_cobranca', 'NULL')}")
                print(f"   - Valor: R$ {record.get('valor', 0)}")
                print(f"   - Status: {record.get('status', 'N/A')}")
                print(f"   - Criado em: {record.get('created_at', 'N/A')}")
                print()
        
        # 4. Verificar constraints existentes
        print(f"\n🔒 4. ANÁLISE DE CONSTRAINTS")
        print("-" * 50)
        
        # Tentar inserir um registro de teste para ver constraints
        print("🧪 Testando constraints existentes...")
        
        # Este teste vai falhar, mas nos mostrará quais constraints existem
        try:
            test_insert = supabase.table('asaas_cobrancas').insert({
                'user_id': '00000000-0000-0000-0000-000000000000',  # UUID inválido de propósito
                'tipo_cobranca': 'teste_constraint'
            }).execute()
        except Exception as e:
            print(f"📋 Constraints detectados via erro de teste: {str(e)}")
        
        # 5. Recomendações baseadas na análise
        print(f"\n💡 5. RECOMENDAÇÕES PARA MIGRAÇÃO")
        print("-" * 50)
        
        if all_records.data and tipo_cobranca_counts:
            print("✅ ESTRATÉGIA RECOMENDADA:")
            print("1. Adicionar colunas service_type e service_data SEM constraints")
            print("2. Atualizar service_type = tipo_cobranca para registros existentes")
            print(f"3. Criar constraint incluindo valores existentes: {valores_unicos}")
            print("4. Adicionar valores futuros: ['certidao', 'regularizacao', 'filiacao', 'taxa_anual']")
            
            # Gerar lista completa para constraint
            valores_necessarios = ['certidao', 'regularizacao', 'filiacao', 'taxa_anual']
            valores_completos = list(set(valores_unicos + valores_necessarios))
            
            print(f"\n🎯 CONSTRAINT FINAL DEVE INCLUIR: {valores_completos}")
        else:
            print("✅ Tabela vazia - pode usar constraint padrão")
        
    except Exception as e:
        print(f"❌ ERRO na análise: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("📋 ANÁLISE CONCLUÍDA - PRONTO PARA CRIAR MIGRAÇÃO SEGURA")
    
    return True

if __name__ == "__main__":
    analyze_asaas_cobrancas_table()