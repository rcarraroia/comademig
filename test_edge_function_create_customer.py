#!/usr/bin/env python3
"""
Teste direto da Edge Function asaas-create-customer
com dados do formulário de filiação
"""
import requests
import json

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

# URL da Edge Function
EDGE_FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/asaas-create-customer"

# Dados de teste (simulando formulário de filiação)
payload = {
    "user_id": "e1406ff4-a0f4-4189-93b4-8a832ecbdd40",
    "customer_data": {
        "name": "Nome Completo do Teste",
        "email": "teste@teste.com",
        "cpfCnpj": "11144477735",
        "phone": "11987654321"
    }
}

# Headers necessários
headers = {
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json"
}

print("=" * 80)
print("TESTE DA EDGE FUNCTION: asaas-create-customer")
print("=" * 80)
print(f"\n📍 URL: {EDGE_FUNCTION_URL}")
print(f"\n📦 Payload enviado:")
print(json.dumps(payload, indent=2))
print("\n" + "=" * 80)
print("EXECUTANDO REQUISIÇÃO...")
print("=" * 80 + "\n")

try:
    # Fazer requisição POST
    response = requests.post(
        EDGE_FUNCTION_URL,
        headers=headers,
        json=payload,
        timeout=30
    )
    
    # Exibir resultado
    print(f"📊 STATUS CODE: {response.status_code}")
    print("\n" + "=" * 80)
    print("RESPOSTA COMPLETA:")
    print("=" * 80)
    
    # Tentar parsear como JSON
    try:
        response_json = response.json()
        print(json.dumps(response_json, indent=2, ensure_ascii=False))
    except:
        # Se não for JSON, mostrar texto puro
        print(response.text)
    
    print("\n" + "=" * 80)
    print("ANÁLISE DO RESULTADO:")
    print("=" * 80)
    
    if response.status_code == 200:
        print("✅ SUCESSO - Edge Function executada com sucesso")
        try:
            data = response.json()
            if 'customer_id' in data:
                print(f"✅ Customer ID criado: {data['customer_id']}")
            if 'message' in data:
                print(f"📝 Mensagem: {data['message']}")
        except:
            pass
    elif response.status_code == 400:
        print("⚠️ ERRO 400 - Bad Request (dados inválidos ou faltando)")
    elif response.status_code == 401:
        print("🔒 ERRO 401 - Não autorizado (problema com token)")
    elif response.status_code == 404:
        print("❌ ERRO 404 - Edge Function não encontrada")
    elif response.status_code == 500:
        print("💥 ERRO 500 - Erro interno da Edge Function")
    else:
        print(f"⚠️ Status inesperado: {response.status_code}")
    
    print("\n" + "=" * 80)
    print("HEADERS DA RESPOSTA:")
    print("=" * 80)
    for key, value in response.headers.items():
        print(f"{key}: {value}")
    
except requests.exceptions.Timeout:
    print("⏱️ ERRO: Timeout - Edge Function demorou mais de 30 segundos")
except requests.exceptions.ConnectionError:
    print("🔌 ERRO: Falha na conexão com o Supabase")
except Exception as e:
    print(f"💥 ERRO INESPERADO: {type(e).__name__}")
    print(f"Detalhes: {str(e)}")

print("\n" + "=" * 80)
print("FIM DO TESTE")
print("=" * 80)
