#!/usr/bin/env python3
"""
Script para verificar a estrutura real da tabela subscription_plans
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def check_table_structure():
    """Verifica a estrutura real da tabela subscription_plans"""
    print("🔍 VERIFICAÇÃO DA ESTRUTURA DA TABELA subscription_plans")
    print("=" * 60)
    
    supabase = get_supabase_client()
    
    # Tentar inserir um registro de teste para descobrir os campos
    print("\n📋 TESTANDO INSERÇÃO PARA DESCOBRIR CAMPOS:")
    print("-" * 50)
    
    # Teste 1: Campos básicos
    try:
        response = supabase.table('subscription_plans').insert({
            'plan_title': 'TESTE_ESTRUTURA',
            'price': 25.00,
            'recurrence': 'Anual'
        }).execute()
        
        if response.data:
            print("✅ Campos básicos funcionam: plan_title, price, recurrence")
            
            # Pegar o ID para deletar depois
            test_id = response.data[0]['id']
            
            # Verificar estrutura do registro criado
            print("\n📊 ESTRUTURA DO REGISTRO CRIADO:")
            for key, value in response.data[0].items():
                print(f"   • {key}: {type(value).__name__} = {value}")
            
            # Deletar o registro de teste
            supabase.table('subscription_plans').delete().eq('id', test_id).execute()
            print("\n🗑️  Registro de teste removido")
            
        else:
            print("❌ Erro nos campos básicos")
            
    except Exception as e:
        print(f"❌ Erro ao testar campos básicos: {str(e)}")
    
    # Teste 2: Campo permissions
    print("\n📋 TESTANDO CAMPO PERMISSIONS:")
    print("-" * 50)
    
    try:
        response = supabase.table('subscription_plans').insert({
            'plan_title': 'TESTE_PERMISSIONS',
            'price': 25.00,
            'recurrence': 'Anual',
            'permissions': {'test': True}
        }).execute()
        
        if response.data:
            print("✅ Campo permissions existe e funciona")
            test_id = response.data[0]['id']
            supabase.table('subscription_plans').delete().eq('id', test_id).execute()
        else:
            print("❌ Campo permissions não funciona")
            
    except Exception as e:
        error_msg = str(e)
        if 'permissions' in error_msg and 'does not exist' in error_msg:
            print("❌ Campo permissions NÃO EXISTE na tabela")
        else:
            print(f"❌ Erro ao testar permissions: {error_msg}")
    
    # Teste 3: Campo description
    print("\n📋 TESTANDO CAMPO DESCRIPTION:")
    print("-" * 50)
    
    try:
        response = supabase.table('subscription_plans').insert({
            'plan_title': 'TESTE_DESCRIPTION',
            'price': 25.00,
            'recurrence': 'Anual',
            'description': 'Teste de descrição'
        }).execute()
        
        if response.data:
            print("✅ Campo description existe e funciona")
            test_id = response.data[0]['id']
            supabase.table('subscription_plans').delete().eq('id', test_id).execute()
        else:
            print("❌ Campo description não funciona")
            
    except Exception as e:
        error_msg = str(e)
        if 'description' in error_msg and 'does not exist' in error_msg:
            print("❌ Campo description NÃO EXISTE na tabela")
        else:
            print(f"❌ Erro ao testar description: {error_msg}")
    
    # Teste 4: Outros campos possíveis
    print("\n📋 TESTANDO OUTROS CAMPOS:")
    print("-" * 50)
    
    other_fields = ['is_active', 'created_at', 'updated_at', 'created_by', 'plan_id_gateway']
    
    for field in other_fields:
        try:
            test_data = {
                'plan_title': f'TESTE_{field.upper()}',
                'price': 25.00,
                'recurrence': 'Anual'
            }
            
            if field == 'is_active':
                test_data[field] = True
            elif field == 'plan_id_gateway':
                test_data[field] = 'test_gateway_id'
            elif field in ['created_by']:
                continue  # Pular campos que podem ter constraints
            else:
                continue  # Pular campos auto-gerados
            
            response = supabase.table('subscription_plans').insert(test_data).execute()
            
            if response.data:
                print(f"✅ Campo {field} existe e funciona")
                test_id = response.data[0]['id']
                supabase.table('subscription_plans').delete().eq('id', test_id).execute()
            else:
                print(f"❌ Campo {field} não funciona")
                
        except Exception as e:
            if field in str(e) and 'does not exist' in str(e):
                print(f"❌ Campo {field} NÃO EXISTE")
            else:
                print(f"⚠️  Campo {field}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ ANÁLISE CONCLUÍDA")

if __name__ == "__main__":
    check_table_structure()