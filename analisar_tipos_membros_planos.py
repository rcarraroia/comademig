#!/usr/bin/env python3
"""
Análise completa de Tipos de Membros e Planos de Assinatura
"""
from supabase import create_client, Client
import json

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def analisar():
    """Análise completa"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("=" * 80)
        print("🔍 ANÁLISE COMPLETA: TIPOS DE MEMBROS E PLANOS DE ASSINATURA")
        print("=" * 80)
        
        # 1. MEMBER_TYPES
        print("\n" + "=" * 80)
        print("📋 1. TABELA: member_types")
        print("=" * 80)
        
        try:
            result = supabase.table('member_types').select('*').execute()
            print(f"\n✅ Total de registros: {len(result.data)}")
            
            if result.data:
                print("\n📊 Estrutura dos campos:")
                print(f"   Campos: {list(result.data[0].keys())}")
                
                print("\n📝 Dados existentes:")
                for idx, item in enumerate(result.data, 1):
                    print(f"\n   {idx}. {item.get('name', 'N/A')}")
                    print(f"      ID: {item.get('id')}")
                    print(f"      Descrição: {item.get('description', 'N/A')}")
                    print(f"      Ativo: {item.get('is_active', 'N/A')}")
                    print(f"      Criado em: {item.get('created_at', 'N/A')}")
            else:
                print("\n⚠️ Nenhum registro encontrado")
                
        except Exception as e:
            print(f"\n❌ Erro ao acessar member_types: {str(e)}")
        
        # 2. SUBSCRIPTION_PLANS
        print("\n" + "=" * 80)
        print("💳 2. TABELA: subscription_plans")
        print("=" * 80)
        
        try:
            result = supabase.table('subscription_plans').select('*').execute()
            print(f"\n✅ Total de registros: {len(result.data)}")
            
            if result.data:
                print("\n📊 Estrutura dos campos:")
                print(f"   Campos: {list(result.data[0].keys())}")
                
                print("\n📝 Dados existentes:")
                for idx, item in enumerate(result.data, 1):
                    print(f"\n   {idx}. {item.get('name', 'N/A')}")
                    print(f"      ID: {item.get('id')}")
                    print(f"      Preço: R$ {item.get('price', 0)}")
                    print(f"      Período: {item.get('billing_period', 'N/A')}")
                    print(f"      Member Type ID: {item.get('member_type_id', 'N/A')}")
                    print(f"      Ativo: {item.get('is_active', 'N/A')}")
                    print(f"      Criado em: {item.get('created_at', 'N/A')}")
            else:
                print("\n⚠️ Nenhum registro encontrado")
                
        except Exception as e:
            print(f"\n❌ Erro ao acessar subscription_plans: {str(e)}")
        
        # 3. RELACIONAMENTO
        print("\n" + "=" * 80)
        print("🔗 3. RELACIONAMENTO ENTRE TABELAS")
        print("=" * 80)
        
        try:
            # Buscar planos com member_types
            result = supabase.table('subscription_plans').select('*, member_types(*)').execute()
            
            if result.data:
                print("\n✅ Relacionamento encontrado!")
                print("\n📊 Planos com seus Tipos de Membro:")
                for item in result.data:
                    print(f"\n   Plano: {item.get('name')}")
                    member_type = item.get('member_types')
                    if member_type:
                        print(f"   → Tipo de Membro: {member_type.get('name')}")
                    else:
                        print(f"   → Tipo de Membro: NÃO VINCULADO")
            else:
                print("\n⚠️ Nenhum relacionamento encontrado")
                
        except Exception as e:
            print(f"\n❌ Erro ao verificar relacionamento: {str(e)}")
        
        # 4. USER_SUBSCRIPTIONS
        print("\n" + "=" * 80)
        print("👥 4. TABELA: user_subscriptions")
        print("=" * 80)
        
        try:
            result = supabase.table('user_subscriptions').select('*').execute()
            print(f"\n✅ Total de registros: {len(result.data)}")
            
            if result.data:
                print("\n📊 Estrutura dos campos:")
                print(f"   Campos: {list(result.data[0].keys())}")
                
                print(f"\n📝 Primeiros 3 registros:")
                for idx, item in enumerate(result.data[:3], 1):
                    print(f"\n   {idx}. User ID: {item.get('user_id')}")
                    print(f"      Plan ID: {item.get('plan_id')}")
                    print(f"      Status: {item.get('status')}")
                    print(f"      Início: {item.get('start_date')}")
                    print(f"      Fim: {item.get('end_date')}")
            else:
                print("\n⚠️ Nenhum registro encontrado")
                
        except Exception as e:
            print(f"\n❌ Erro ao acessar user_subscriptions: {str(e)}")
        
        # 5. RESUMO E DIAGNÓSTICO
        print("\n" + "=" * 80)
        print("📊 5. RESUMO E DIAGNÓSTICO")
        print("=" * 80)
        
        try:
            mt_count = len(supabase.table('member_types').select('*').execute().data)
            sp_count = len(supabase.table('subscription_plans').select('*').execute().data)
            us_count = len(supabase.table('user_subscriptions').select('*').execute().data)
            
            print(f"\n📈 Contagem de registros:")
            print(f"   • Tipos de Membro: {mt_count}")
            print(f"   • Planos de Assinatura: {sp_count}")
            print(f"   • Assinaturas de Usuários: {us_count}")
            
            print(f"\n🔍 Análise:")
            if mt_count == 0:
                print("   ⚠️ Nenhum tipo de membro cadastrado")
            if sp_count == 0:
                print("   ⚠️ Nenhum plano de assinatura cadastrado")
            if us_count == 0:
                print("   ⚠️ Nenhuma assinatura ativa")
                
            if mt_count > 0 and sp_count > 0:
                print("   ✅ Sistema tem dados básicos configurados")
                
        except Exception as e:
            print(f"\n❌ Erro no resumo: {str(e)}")
        
        print("\n" + "=" * 80)
        print("✅ ANÁLISE CONCLUÍDA")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Erro geral: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analisar()
