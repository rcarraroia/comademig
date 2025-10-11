#!/usr/bin/env python3
"""
Script para verificar a estrutura exata da tabela user_subscriptions
"""
from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n" + "="*70)
    print("VERIFICANDO ESTRUTURA DA TABELA user_subscriptions")
    print("="*70 + "\n")
    
    # Tentar inserir um registro de teste para ver quais campos são aceitos
    test_data = {
        'user_id': 'test-id',
        'subscription_plan_id': 'test-plan-id',
        'member_type_id': 'test-member-type-id',
        'status': 'pending',
        'asaas_subscription_id': 'test-asaas-id',
        'started_at': '2025-01-10T00:00:00Z',
        'expires_at': '2025-02-10T00:00:00Z'
    }
    
    print("Tentando inserir registro de teste para identificar campos...")
    print(f"Dados de teste: {test_data}\n")
    
    try:
        response = supabase.table('user_subscriptions').insert(test_data).execute()
        print("✅ Inserção bem-sucedida!")
        print(f"Registro criado: {response.data}")
        
        # Deletar o registro de teste
        if response.data:
            delete_response = supabase.table('user_subscriptions').delete().eq('user_id', 'test-id').execute()
            print("\n🗑️ Registro de teste deletado")
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Erro ao inserir: {error_msg}\n")
        
        # Analisar o erro para identificar campos inválidos
        if 'column' in error_msg.lower():
            print("📋 O erro indica problema com colunas.")
            print("Campos que podem não existir:")
            if 'asaas_subscription_id' in error_msg:
                print("  - asaas_subscription_id NÃO EXISTE")

if __name__ == "__main__":
    main()
