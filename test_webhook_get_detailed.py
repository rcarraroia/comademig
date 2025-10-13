#!/usr/bin/env python3
"""
Teste detalhado do GET na Edge Function asaas-webhook
"""
import requests
import time

url = 'https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook'

print('=' * 70)
print('🧪 TESTE DETALHADO - GET asaas-webhook')
print('=' * 70)
print(f'\nURL: {url}')
print(f'Timestamp: {time.time()}\n')

# Teste 1: GET simples
print('-' * 70)
print('TESTE 1: GET simples')
print('-' * 70)
try:
    response = requests.get(url, timeout=10)
    print(f'Status: {response.status_code}')
    print(f'Headers:')
    for key, value in response.headers.items():
        print(f'  {key}: {value}')
    print(f'\nResponse: {response.text}')
except Exception as e:
    print(f'Erro: {e}')

print()

# Teste 2: GET com headers
print('-' * 70)
print('TESTE 2: GET com headers no-cache')
print('-' * 70)
try:
    response = requests.get(
        url, 
        headers={
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        timeout=10
    )
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Erro: {e}')

print()

# Teste 3: OPTIONS
print('-' * 70)
print('TESTE 3: OPTIONS (deve funcionar)')
print('-' * 70)
try:
    response = requests.options(url, timeout=10)
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Erro: {e}')

print()

# Teste 4: POST
print('-' * 70)
print('TESTE 4: POST (deve funcionar)')
print('-' * 70)
try:
    response = requests.post(
        url,
        json={'event': 'TEST', 'payment': {'id': 'test'}},
        timeout=10
    )
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Erro: {e}')

print()
print('=' * 70)
print('🎯 ANÁLISE')
print('=' * 70)
print('\nSe GET retorna 405:')
print('  ⚠️ Deploy pode não ter sido aplicado corretamente')
print('  ⚠️ Pode haver cache no Cloudflare/CDN')
print('  ⚠️ Código pode ter erro de sintaxe')
print('\nSe OPTIONS e POST funcionam mas GET não:')
print('  ⚠️ Problema específico com método GET')
print('  ⚠️ Verificar logs da Edge Function')
print('=' * 70)
