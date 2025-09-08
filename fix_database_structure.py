#!/usr/bin/env python3
"""
Corrigir estrutura das tabelas que estão causando erro 400
"""
from supabase import create_client, Client

# Configurações
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def fix_database_issues():
    """Corrigir problemas de estrutura do banco"""
    print("🔧 CORRIGINDO ESTRUTURA DO BANCO DE DADOS")
    print("=" * 50)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar tabelas existentes
    print("\n1️⃣ VERIFICANDO TABELAS EXISTENTES")
    print("-" * 30)
    
    tables_to_check = [
        'solicitacoes_certidoes',
        'solicitacoes_regularizacao', 
        'profiles',
        'asaas_cobrancas'
    ]
    
    for table in tables_to_check:
        try:
            response = supabase.table(table).select('*').limit(1).execute()
            print(f"✅ {table}: OK ({len(response.data)} registros)")
        except Exception as e:
            print(f"❌ {table}: {e}")
    
    # 2. Testar queries específicas que estão falhando
    print("\n2️⃣ TESTANDO QUERIES PROBLEMÁTICAS")
    print("-" * 30)
    
    # Query que está falhando no log
    problematic_queries = [
        {
            'name': 'Certidões com profiles',
            'table': 'solicitacoes_certidoes',
            'query': '*,profiles(nome_completo,cpf,cargo,igreja)'
        },
        {
            'name': 'Regularizações com profiles', 
            'table': 'solicitacoes_regularizacao',
            'query': '*,profiles(nome_completo,cpf,cargo,igreja)'
        }
    ]
    
    for query_test in problematic_queries:
        try:
            print(f"\n🧪 Testando: {query_test['name']}")
            
            # Testar query simples primeiro
            simple_response = supabase.table(query_test['table']).select('*').limit(1).execute()
            print(f"  ✅ Query simples: {len(simple_response.data)} registros")
            
            # Testar query com join
            try:
                join_response = supabase.table(query_test['table']).select(query_test['query']).limit(1).execute()
                print(f"  ✅ Query com join: {len(join_response.data)} registros")
            except Exception as join_error:
                print(f"  ❌ Query com join: {join_error}")
                
                # Testar campos individuais do profiles
                print("  🔍 Testando campos do profiles...")
                try:
                    profile_response = supabase.table('profiles').select('nome_completo,cpf,cargo,igreja').limit(1).execute()
                    print(f"    ✅ Campos profiles existem: {len(profile_response.data)} registros")
                except Exception as profile_error:
                    print(f"    ❌ Problema nos campos profiles: {profile_error}")
                    
                    # Verificar quais campos existem
                    try:
                        all_profiles = supabase.table('profiles').select('*').limit(1).execute()
                        if all_profiles.data:
                            available_fields = list(all_profiles.data[0].keys())
                            print(f"    📋 Campos disponíveis: {available_fields}")
                    except:
                        print("    ❌ Não foi possível listar campos do profiles")
                        
        except Exception as e:
            print(f"❌ Erro geral em {query_test['name']}: {e}")
    
    # 3. Verificar estrutura da tabela profiles
    print("\n3️⃣ ANALISANDO TABELA PROFILES")
    print("-" * 30)
    
    try:
        profiles_data = supabase.table('profiles').select('*').limit(3).execute()
        if profiles_data.data:
            print("✅ Tabela profiles acessível")
            print(f"📋 Campos encontrados: {list(profiles_data.data[0].keys())}")
            
            # Verificar campos específicos que estão sendo buscados
            required_fields = ['nome_completo', 'cpf', 'cargo', 'igreja']
            available_fields = list(profiles_data.data[0].keys())
            
            print("\n🔍 Verificação de campos obrigatórios:")
            for field in required_fields:
                if field in available_fields:
                    print(f"  ✅ {field}: Existe")
                else:
                    print(f"  ❌ {field}: NÃO EXISTE")
                    
        else:
            print("⚠️ Tabela profiles vazia")
            
    except Exception as e:
        print(f"❌ Erro ao acessar profiles: {e}")
    
    # 4. Sugestões de correção
    print("\n" + "=" * 50)
    print("🎯 DIAGNÓSTICO E SOLUÇÕES")
    print("=" * 50)
    
    print("\n📋 PROBLEMAS IDENTIFICADOS:")
    print("• Erro 400 nas queries com join profiles")
    print("• Possível problema nos campos: nome_completo, cpf, cargo, igreja")
    print("• Estrutura da tabela profiles pode estar incorreta")
    
    print("\n🔧 SOLUÇÕES RECOMENDADAS:")
    print("1. Verificar se campos existem na tabela profiles")
    print("2. Corrigir nomes dos campos se necessário")
    print("3. Atualizar queries no frontend")
    print("4. Verificar políticas RLS das tabelas")

if __name__ == "__main__":
    fix_database_issues()