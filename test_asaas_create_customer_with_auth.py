#!/usr/bin/env python3
"""
Script para testar Edge Function asaas-create-customer
COM autenticação correta
"""
import requests
import json

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

# URL da Edge Function
url = f"{SUPABASE_URL}/functions/v1/asaas-create-customer"

# Headers com autenticação
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'apikey': SUPABASE_ANON_KEY
}

# Dados de teste
payload = {
    "user_id": "200aa7dd-07a5-4b97-ba2c-f7bceee78955",
    "customer_data": {
        "name": "Teste Cliente COMADEMIG",
        "email": "teste@comademig.com.br",
        "cpfCnpj": "12345678900",
        "phone": "11987654321",
        "address": "Rua Teste",
        "addressNumber": "123",
        "province": "Centro",
        "city": "Belo Horizonte",
        "state": "MG",
        "postalCode": "30000000"
    }
}

print("=" * 70)
print("🧪 TESTE - Edge Function asaas-create-customer (COM AUTH)")
print("=" * 70)
print(f"\nURL: {url}")
print(f"\nHeaders:")
print(f"  Authorization: Bearer {SUPABASE_ANON_KEY[:20]}...")
print(f"  apikey: {SUPABASE_ANON_KEY[:20]}...")
print(f"\nPayload enviado:")
print(json.dumps(payload, indent=2, ensure_ascii=False))
print("\n" + "-" * 70)
print("Enviando requisição...\n")

try:
    # Fazer requisição POST com autenticação
    response = requests.post(
        url,
        json=payload,
        headers=headers,
        timeout=30
    )
    
    print("=" * 70)
    print("📥 RESPOSTA RECEBIDA")
    print("=" * 70)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200 or response.status_code == 201:
        print(f"Status: ✅ SUCESSO")
    elif response.status_code == 400:
        print(f"Status: ⚠️ BAD REQUEST (dados inválidos)")
    elif response.status_code == 401:
        print(f"Status: ❌ UNAUTHORIZED (autenticação falhou)")
    elif response.status_code == 500:
        print(f"Status: ❌ INTERNAL SERVER ERROR")
    else:
        print(f"Status: ⚠️ {response.status_code}")
    
    print(f"\nResponse Body:")
    print("-" * 70)
    
    # Tentar parsear como JSON
    try:
        response_json = response.json()
        print(json.dumps(response_json, indent=2, ensure_ascii=False))
        
        # Análise detalhada
        print("\n" + "=" * 70)
        print("🔍 ANÁLISE DETALHADA")
        print("=" * 70)
        
        if response.status_code in [200, 201]:
            print("\n✅ SUCESSO! Cliente criado no Asaas")
            if 'customer_id' in response_json:
                print(f"   Customer ID: {response_json['customer_id']}")
            if 'message' in response_json:
                print(f"   Mensagem: {response_json['message']}")
        
        else:
            print(f"\n❌ ERRO: Status {response.status_code}")
            
            if 'error' in response_json:
                print(f"\n📛 Erro: {response_json['error']}")
            
            if 'message' in response_json:
                print(f"📝 Mensagem: {response_json['message']}")
            
            if 'details' in response_json:
                print(f"\n📋 Detalhes:")
                print(json.dumps(response_json['details'], indent=2, ensure_ascii=False))
            
            # Diagnóstico específico
            print("\n" + "-" * 70)
            print("💡 DIAGNÓSTICO:")
            
            error_text = str(response_json).lower()
            
            if 'asaas_api_key' in error_text or 'api_key' in error_text:
                print("\n  ⚠️ PROBLEMA: ASAAS_API_KEY não configurada")
                print("     Causa: Secrets não estão configurados nas Edge Functions")
                print("     Solução:")
                print("       1. Acessar: Supabase Dashboard > Edge Functions > Settings")
                print("       2. Adicionar secret: ASAAS_API_KEY")
                print("       3. Valor: $aact_prod_...")
            
            elif 'user_id' in error_text or 'user' in error_text:
                print("\n  ⚠️ PROBLEMA: user_id inválido ou não encontrado")
                print("     Causa: Usuário não existe no banco de dados")
                print("     Solução: Usar user_id de usuário existente")
            
            elif 'cpf' in error_text or 'cnpj' in error_text:
                print("\n  ⚠️ PROBLEMA: CPF/CNPJ inválido")
                print("     Causa: Formato ou validação de CPF falhou")
                print("     Solução: Usar CPF válido (11 dígitos)")
            
            elif 'database' in error_text or 'table' in error_text:
                print("\n  ⚠️ PROBLEMA: Erro de banco de dados")
                print("     Causa: Tabela asaas_customers não existe ou sem permissão")
                print("     Solução: Verificar migrações e políticas RLS")
            
            elif 'timeout' in error_text:
                print("\n  ⚠️ PROBLEMA: Timeout na API Asaas")
                print("     Causa: API Asaas não respondeu a tempo")
                print("     Solução: Tentar novamente")
            
            else:
                print("\n  ⚠️ Erro não identificado automaticamente")
                print("     Verifique a mensagem de erro acima")
    
    except json.JSONDecodeError:
        print(response.text)
        print("\n⚠️ Resposta não é JSON válido")
    
    print("\n" + "=" * 70)
    
    # Salvar resultado
    result = {
        'timestamp': '2025-01-11',
        'url': url,
        'payload': payload,
        'status_code': response.status_code,
        'response': response.text
    }
    
    with open('test_asaas_create_customer_auth_result.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print("📄 Resultado salvo em: test_asaas_create_customer_auth_result.json\n")

except requests.exceptions.Timeout:
    print("❌ ERRO: Timeout após 30 segundos")
    print("   A Edge Function não respondeu a tempo")

except requests.exceptions.ConnectionError as e:
    print(f"❌ ERRO DE CONEXÃO: {e}")

except Exception as e:
    print(f"❌ ERRO INESPERADO: {e}")
    print(f"   Tipo: {type(e).__name__}")

print("=" * 70)
