#!/usr/bin/env python3
"""
Análise completa do estado atual da implementação
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def analyze_implementation():
    """Análise completa da implementação atual"""
    print("🔍 ANÁLISE COMPLETA DA IMPLEMENTAÇÃO ATUAL")
    print("=" * 70)
    
    supabase = get_supabase_client()
    
    print("\n📊 ESTADO DAS TABELAS:")
    print("-" * 50)
    
    # Verificar cada tabela
    tables = {
        'member_types': 'Tipos de Membro',
        'subscription_plans': 'Planos de Assinatura', 
        'member_type_subscriptions': 'Relacionamentos',
        'user_subscriptions': 'Assinaturas de Usuários'
    }
    
    table_data = {}
    
    for table, description in tables.items():
        try:
            response = supabase.table(table).select('*', count='exact').execute()
            count = response.count
            sample = response.data[:2] if response.data else []
            
            table_data[table] = {
                'count': count,
                'sample': sample,
                'exists': True
            }
            
            print(f"✅ {description} ({table}): {count} registros")
            
        except Exception as e:
            table_data[table] = {
                'exists': False,
                'error': str(e)
            }
            print(f"❌ {description} ({table}): {str(e)}")
    
    print("\n🔗 ANÁLISE DE RELACIONAMENTOS:")
    print("-" * 50)
    
    # Verificar se existem relacionamentos
    if table_data['member_types']['exists'] and table_data['subscription_plans']['exists']:
        relationships_count = table_data['member_type_subscriptions']['count']
        print(f"📊 Relacionamentos configurados: {relationships_count}")
        
        if relationships_count == 0:
            print("⚠️  PROBLEMA IDENTIFICADO: Não há relacionamentos entre tipos de membro e planos")
            print("   Isso significa que o sistema unificado não pode funcionar corretamente")
        else:
            print("✅ Relacionamentos existem - sistema pode funcionar")
    
    print("\n🎯 ANÁLISE DE DADOS UNIFICADOS:")
    print("-" * 50)
    
    # Tentar simular o que o hook useMemberTypeWithPlan faria
    if table_data['member_types']['count'] > 0:
        try:
            # Query simplificada primeiro
            simple_query = supabase.table('member_types').select('id, name, description, sort_order, is_active').eq('is_active', True).execute()
            
            if simple_query.data:
                print(f"✅ Member types ativos: {len(simple_query.data)}")
                for mt in simple_query.data:
                    print(f"   • {mt['name']} (ID: {mt['id'][:8]}...)")
                
                # Tentar query com relacionamentos
                if table_data['member_type_subscriptions']['count'] > 0:
                    try:
                        unified_query = supabase.table('member_types').select('''
                            id, name, description, sort_order, is_active,
                            member_type_subscriptions(
                                subscription_plans(id, plan_title, price, recurrence)
                            )
                        ''').eq('is_active', True).execute()
                        
                        print(f"\n✅ Query unificada executada com sucesso")
                        print(f"📊 Registros retornados: {len(unified_query.data) if unified_query.data else 0}")
                        
                        if unified_query.data:
                            for item in unified_query.data:
                                name = item.get('name', 'N/A')
                                relations = item.get('member_type_subscriptions', [])
                                print(f"   • {name}: {len(relations)} plano(s) associado(s)")
                        
                    except Exception as e:
                        print(f"❌ Erro na query unificada: {str(e)}")
                        print("   Isso indica que o hook useMemberTypeWithPlan não funcionará")
                
            else:
                print("❌ Nenhum member type ativo encontrado")
                
        except Exception as e:
            print(f"❌ Erro ao buscar member types: {str(e)}")
    
    print("\n🧪 TESTE DE COMPONENTES:")
    print("-" * 50)
    
    # Verificar se os componentes podem funcionar
    components_status = {
        'useMemberTypeWithPlan': 'Pode funcionar' if table_data['member_types']['count'] > 0 else 'Não pode funcionar - sem dados',
        'UnifiedMemberTypeForm': 'Pode funcionar' if table_data['member_types']['exists'] and table_data['subscription_plans']['exists'] else 'Não pode funcionar - tabelas ausentes',
        'MemberTypeSelector': 'Pode funcionar' if table_data['member_types']['count'] > 0 else 'Não pode funcionar - sem dados',
        'Edge Function': 'Status desconhecido - requer teste com autenticação'
    }
    
    for component, status in components_status.items():
        if 'Pode funcionar' in status:
            print(f"✅ {component}: {status}")
        elif 'Status desconhecido' in status:
            print(f"⚠️  {component}: {status}")
        else:
            print(f"❌ {component}: {status}")
    
    print("\n📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:")
    print("-" * 50)
    
    problems = []
    
    # Verificar problemas específicos
    if table_data['subscription_plans']['count'] == 0:
        problems.append("❌ Nenhum plano de assinatura cadastrado")
    
    if table_data['member_type_subscriptions']['count'] == 0:
        problems.append("❌ Nenhum relacionamento entre tipos e planos")
    
    if table_data['member_types']['count'] > 0 and table_data['subscription_plans']['count'] == 0:
        problems.append("⚠️  Tipos de membro existem mas sem planos associados")
    
    if not problems:
        print("✅ Nenhum problema crítico identificado")
        print("✅ Sistema parece estar funcionalmente implementado")
    else:
        print("🚨 PROBLEMAS ENCONTRADOS:")
        for problem in problems:
            print(f"   {problem}")
    
    print("\n💡 RECOMENDAÇÕES:")
    print("-" * 50)
    
    if table_data['subscription_plans']['count'] == 0:
        print("1. 📝 Criar planos de assinatura usando a interface administrativa")
        print("2. 🔗 Associar planos aos tipos de membro existentes")
        print("3. 🧪 Testar o fluxo completo de filiação")
    
    if table_data['member_type_subscriptions']['count'] == 0 and table_data['subscription_plans']['count'] > 0:
        print("1. 🔗 Criar relacionamentos entre tipos existentes e planos")
        print("2. ✅ Verificar se o hook useMemberTypeWithPlan funciona")
    
    if all(table_data[t]['exists'] for t in tables.keys()):
        print("1. ✅ Estrutura de banco está correta")
        print("2. 🧪 Testar componentes individualmente")
        print("3. 🔧 Verificar se Edge Function está deployada")
    
    print("\n" + "=" * 70)
    print("✅ ANÁLISE CONCLUÍDA")
    
    return table_data

if __name__ == "__main__":
    analyze_implementation()