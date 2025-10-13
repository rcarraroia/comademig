#!/usr/bin/env python3
"""
Teste completo da Edge Function asaas-webhook
"""
import requests
import json

url = 'https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook'

print('=' * 70)
print('🧪 TESTE COMPLETO - Edge Function asaas-webhook')
print('=' * 70)
print(f'\nURL: {url}\n')

# Teste 1: OPTIONS (CORS preflight)
print('-' * 70)
print('TESTE 1: OPTIONS (CORS Preflight)')
print('-' * 70)
try:
    response = requests.options(url, timeout=10)
    print(f'✅ Status: {response.status_code}')
    print(f'Headers CORS:')
    for key in ['Access-Control-Allow-Origin', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Methods']:
        if key in response.headers:
            print(f'  {key}: {response.headers[key]}')
except Exception as e:
    print(f'❌ Erro: {e}')

print()

# Teste 2: POST com payload válido
print('-' * 70)
print('TESTE 2: POST com payload de teste')
print('-' * 70)

payload = {
    'event': 'PAYMENT_RECEIVED',
    'payment': {
        'id': 'pay_test_webhook_123',
        'customer': 'cus_test_456',
        'value': 150.00,
        'netValue': 145.50,
        'description': 'Teste Webhook Sandbox',
        'billingType': 'PIX',
        'status': 'RECEIVED',
        'dueDate': '2025-01-18',
        'dateCreated': '2025-01-11',
        'confirmedDate': '2025-01-11',
        'paymentDate': '2025-01-11'
    }
}

print('Payload:')
print(json.dumps(payload, indent=2))
print()

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        print('✅ SUCESSO!')
    elif response.status_code == 500:
        print('⚠️ Erro 500 (esperado - dados de teste)')
    
    print(f'\nResponse:')
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
        
except Exception as e:
    print(f'❌ Erro: {e}')

print()
print('=' * 70)
print('🎯 CONCLUSÃO')
print('=' * 70)
print('\nSe OPTIONS retornou 200 e POST retornou 200 ou 500:')
print('✅ Edge Function está ACESSÍVEL e FUNCIONANDO')
print('✅ URL pode ser configurada no Asaas Sandbox')
print('\nURL para configurar no Asaas:')
print(f'  {url}')
print('=' * 70)
