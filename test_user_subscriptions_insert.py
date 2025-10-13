#!/usr/bin/env python3
"""
Teste de inserção em user_subscriptions para ver quais campos são aceitos
"""

from supabase import create_client, Client
import uuid
from datetime import datetime, timedelta

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_insert():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Buscar um user_id e plan_id válidos
    print("🔍 Buscando IDs válidos...")
    
    # Buscar um usuário
    user_response = supabase.table('profiles').select('id').limit(1).execute()
    if not user_response.data:
        print("❌ Nenhum usuário encontrado")
        return
    user_id = user_response.data[0]['id']
    print(f"✅ user_id: {user_id}")
    
    # Buscar um plano
    plan_response = supabase.table('subscription_plans').select('id, member_type_id').limit(1).execute()
    if not plan_response.data:
        print("❌ Nenhum plano encontrado")
        return
    plan_id = plan_response.data[0]['id']
    member_type_id = plan_response.data[0]['member_type_id']
    print(f"✅ subscription_plan_id: {plan_id}")
    print(f"✅ member_type_id: {member_type_id}")
    
    # Dados de teste
    test_data = {
        'user_id': user_id,
        'subscription_plan_id': plan_id,
        'member_type_id': member_type_id,
        'status': 'pending',
        'asaas_subscription_id': 'sub_test_' + str(uuid.uuid4())[:8],
        'started_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
    }
    
    print(f"\n📤 Tentando inserir:")
    for key, value in test_data.items():
        print(f"  - {key}: {value}")
    
    try:
        response = supabase.table('user_subscriptions').insert(test_data).execute()
        print(f"\n✅ SUCESSO! Registro criado:")
        print(f"  ID: {response.data[0]['id']}")
        
        # Deletar o registro de teste
        delete_response = supabase.table('user_subscriptions').delete().eq('id', response.data[0]['id']).execute()
        print(f"\n🗑️ Registro de teste deletado")
        
    except Exception as e:
        print(f"\n❌ ERRO ao inserir:")
        print(f"  {str(e)}")
        
        # Tentar descobrir qual campo está causando problema
        print(f"\n🔍 Testando campos individualmente...")
        for key in list(test_data.keys()):
            minimal_data = {
                'user_id': user_id,
                'subscription_plan_id': plan_id,
                key: test_data[key]
            }
            try:
                test_response = supabase.table('user_subscriptions').insert(minimal_data).execute()
                print(f"  ✅ {key}: OK")
                # Deletar
                supabase.table('user_subscriptions').delete().eq('id', test_response.data[0]['id']).execute()
            except Exception as field_error:
                print(f"  ❌ {key}: {str(field_error)}")

if __name__ == "__main__":
    test_insert()
