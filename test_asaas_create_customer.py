#!/usr/bin/env python3
"""
Script para testar Edge Function asaas-create-customer
e capturar erro completo
"""
import requests
import json

# URL da Edge Function
url = "https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-create-customer"

# Dados de teste (simulando requisição que deu erro)
payload = {
    "user_id": "200aa7dd-07a5-4b97-ba2c-f7bceee78955",
    "customer_data": {
        "name": "Teste Cliente",
        "email": "teste@test.com",
        "cpfCnpj": "12345678900",
        "phone": "11987654321"
    }
}

print("=" * 70)
print("🧪 TESTE - Edge Function asaas-create-customer")
print("=" * 70)
print(f"\nURL: {url}")
print(f"\nPayload enviado:")
print(json.dumps(payload, indent=2, ensure_ascii=False))
print("\n" + "-" * 70)
print("Enviando requisição...\n")

try:
    # Fazer requisição POST
    response = requests.post(
        url,
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=30
    )
    
    print("=" * 70)
    print("📥 RESPOSTA RECEBIDA")
    print("=" * 70)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Status: {'✅ Sucesso' if response.status_code == 200 else '❌ Erro'}")
    
    print(f"\nHeaders:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    
    print(f"\nResponse Body:")
    print("-" * 70)
    
    # Tentar parsear como JSON
    try:
        response_json = response.json()
        print(json.dumps(response_json, indent=2, ensure_ascii=False))
        
        # Análise detalhada do erro
        if response.status_code != 200:
            print("\n" + "=" * 70)
            print("🔍 ANÁLISE DO ERRO")
            print("=" * 70)
            
            if 'error' in response_json:
                print(f"\n❌ Erro: {response_json['error']}")
            
            if 'message' in response_json:
                print(f"📝 Mensagem: {response_json['message']}")
            
            if 'details' in response_json:
                print(f"📋 Detalhes:")
                print(json.dumps(response_json['details'], indent=2, ensure_ascii=False))
            
            # Diagnóstico
            print("\n" + "-" * 70)
            print("💡 POSSÍVEIS CAUSAS:")
            
            if 'ASAAS_API_KEY' in str(response_json):
                print("  ⚠️ ASAAS_API_KEY não configurada nas Edge Functions")
                print("     Solução: Configurar secrets no Supabase")
            
            if 'user_id' in str(response_json):
                print("  ⚠️ Problema com user_id")
                print("     Verificar se usuário existe no banco")
            
            if 'customer_data' in str(response_json):
                print("  ⚠️ Problema com dados do cliente")
                print("     Verificar validação de CPF, email, etc.")
            
            if 'Database' in str(response_json) or 'database' in str(response_json):
                print("  ⚠️ Erro de banco de dados")
                print("     Verificar tabela asaas_customers e permissões RLS")
        
        else:
            print("\n✅ SUCESSO! Cliente criado.")
            if 'customer_id' in response_json:
                print(f"   Customer ID: {response_json['customer_id']}")
    
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
        'headers': dict(response.headers),
        'response': response.text
    }
    
    with open('test_asaas_create_customer_result.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print("📄 Resultado salvo em: test_asaas_create_customer_result.json\n")

except requests.exceptions.Timeout:
    print("❌ ERRO: Timeout após 30 segundos")
    print("   A Edge Function não respondeu a tempo")

except requests.exceptions.ConnectionError as e:
    print(f"❌ ERRO DE CONEXÃO: {e}")
    print("   Não foi possível conectar à Edge Function")

except Exception as e:
    print(f"❌ ERRO INESPERADO: {e}")
    print(f"   Tipo: {type(e).__name__}")

print("=" * 70)
