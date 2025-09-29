#!/usr/bin/env python3
"""
Script para testar se a Edge Function create-unified-member-type existe e funciona
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def test_edge_function():
    """Testa se a Edge Function existe"""
    print("🧪 TESTE DA EDGE FUNCTION create-unified-member-type")
    print("=" * 60)
    
    supabase = get_supabase_client()
    
    try:
        # Tentar chamar a edge function (vai dar erro de auth, mas confirma que existe)
        response = supabase.functions.invoke('create-unified-member-type', {
            'body': {
                'memberType': {
                    'name': 'Teste',
                    'description': 'Teste',
                    'sort_order': 1,
                    'is_active': True
                },
                'subscriptionPlan': {
                    'plan_title': 'Teste Plan',
                    'price': 25.00,
                    'recurrence': 'Mensal'
                }
            }
        })
        
        print('✅ create-unified-member-type: EXISTE e RESPONDE')
        print(f'📊 Response: {response}')
        
    except Exception as e:
        error_str = str(e)
        if 'No authorization header' in error_str or 'Unauthorized' in error_str:
            print('✅ create-unified-member-type: EXISTE (erro de auth esperado)')
            print('📋 A função existe e está funcionando, apenas requer autenticação')
        elif 'Function not found' in error_str or '404' in error_str:
            print('❌ create-unified-member-type: NÃO EXISTE')
            print(f'📋 Erro: {error_str}')
        else:
            print(f'⚠️  create-unified-member-type: ERRO INESPERADO - {error_str}')
    
    print("\n" + "=" * 60)
    print("✅ TESTE CONCLUÍDO")

if __name__ == "__main__":
    test_edge_function()