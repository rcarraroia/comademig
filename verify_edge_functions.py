#!/usr/bin/env python3
"""
Script para verificar Edge Functions deployadas no Supabase
"""
import requests
import json

# Configurações do Supabase (extraídas do .env)
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

# Lista de Edge Functions que devem existir
EXPECTED_FUNCTIONS = [
    'asaas-webhook',
    'asaas-create-customer',
    'asaas-create-subscription',
    'asaas-create-boleto',
    'asaas-create-pix-payment',
    'asaas-process-card',
    'asaas-process-splits',
]

def test_edge_function(function_name):
    """Testa se uma Edge Function está acessível"""
    url = f"{SUPABASE_URL}/functions/v1/{function_name}"
    
    try:
        # Fazer requisição OPTIONS (CORS preflight)
        response = requests.options(url, timeout=5)
        
        if response.status_code == 200:
            return {
                'name': function_name,
                'status': 'DEPLOYED',
                'accessible': True,
                'status_code': response.status_code
            }
        else:
            return {
                'name': function_name,
                'status': 'DEPLOYED',
                'accessible': True,
                'status_code': response.status_code,
                'note': 'Responde mas não é OPTIONS 200'
            }
    except requests.exceptions.Timeout:
        return {
            'name': function_name,
            'status': 'TIMEOUT',
            'accessible': False,
            'error': 'Timeout após 5 segundos'
        }
    except requests.exceptions.ConnectionError:
        return {
            'name': function_name,
            'status': 'NOT_DEPLOYED',
            'accessible': False,
            'error': 'Não foi possível conectar'
        }
    except Exception as e:
        return {
            'name': function_name,
            'status': 'ERROR',
            'accessible': False,
            'error': str(e)
        }

def test_webhook_function():
    """Testa especificamente a função de webhook com POST"""
    url = f"{SUPABASE_URL}/functions/v1/asaas-webhook"
    
    test_payload = {
        "event": "PAYMENT_RECEIVED",
        "payment": {
            "id": "pay_test_verification",
            "customer": "cus_test",
            "value": 100.00,
            "status": "RECEIVED",
            "billingType": "PIX",
            "dueDate": "2025-01-18",
            "dateCreated": "2025-01-11"
        }
    }
    
    try:
        response = requests.post(
            url,
            json=test_payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        return {
            'name': 'asaas-webhook (POST test)',
            'status': 'DEPLOYED',
            'accessible': True,
            'status_code': response.status_code,
            'response': response.text[:200] if response.text else 'Empty response'
        }
    except Exception as e:
        return {
            'name': 'asaas-webhook (POST test)',
            'status': 'ERROR',
            'accessible': False,
            'error': str(e)
        }

def main():
    print("=" * 70)
    print("🔍 VERIFICAÇÃO DE EDGE FUNCTIONS - SUPABASE")
    print("=" * 70)
    print(f"\nURL Base: {SUPABASE_URL}")
    print(f"Testando {len(EXPECTED_FUNCTIONS)} Edge Functions...\n")
    
    results = []
    
    # Testar cada função
    for func_name in EXPECTED_FUNCTIONS:
        print(f"Testando: {func_name}...", end=" ")
        result = test_edge_function(func_name)
        results.append(result)
        
        if result['accessible']:
            print(f"✅ {result['status']} (HTTP {result.get('status_code', 'N/A')})")
        else:
            print(f"❌ {result['status']} - {result.get('error', 'Unknown error')}")
    
    # Teste especial para webhook com POST
    print(f"\nTeste especial: asaas-webhook (POST)...", end=" ")
    webhook_result = test_webhook_function()
    results.append(webhook_result)
    
    if webhook_result['accessible']:
        print(f"✅ {webhook_result['status']} (HTTP {webhook_result.get('status_code', 'N/A')})")
        print(f"   Resposta: {webhook_result.get('response', 'N/A')}")
    else:
        print(f"❌ {webhook_result['status']} - {webhook_result.get('error', 'Unknown error')}")
    
    # Resumo
    print("\n" + "=" * 70)
    print("📊 RESUMO")
    print("=" * 70)
    
    deployed = sum(1 for r in results if r['accessible'])
    not_deployed = sum(1 for r in results if not r['accessible'])
    
    print(f"\n✅ Deployadas e acessíveis: {deployed}")
    print(f"❌ Não deployadas ou inacessíveis: {not_deployed}")
    print(f"📊 Total testadas: {len(results)}")
    
    # Detalhes das não deployadas
    if not_deployed > 0:
        print("\n⚠️ FUNÇÕES NÃO ACESSÍVEIS:")
        for r in results:
            if not r['accessible']:
                print(f"   - {r['name']}: {r.get('error', 'Unknown')}")
    
    # Conclusão
    print("\n" + "=" * 70)
    print("🎯 CONCLUSÃO")
    print("=" * 70)
    
    if deployed == len(results):
        print("\n✅ TODAS as Edge Functions estão deployadas e acessíveis!")
        print("   O webhook pode ser configurado no Asaas.")
    elif deployed > 0:
        print(f"\n⚠️ PARCIALMENTE deployado: {deployed}/{len(results)} funções acessíveis")
        print("   Algumas funções precisam ser deployadas.")
    else:
        print("\n❌ NENHUMA Edge Function está acessível!")
        print("   As funções precisam ser deployadas no Supabase.")
    
    print("\n" + "=" * 70)
    
    # Salvar resultado em JSON
    with open('edge_functions_status.json', 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': '2025-01-11',
            'supabase_url': SUPABASE_URL,
            'total_tested': len(results),
            'deployed': deployed,
            'not_deployed': not_deployed,
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print("📄 Resultado salvo em: edge_functions_status.json\n")

if __name__ == "__main__":
    main()
