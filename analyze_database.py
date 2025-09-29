#!/usr/bin/env python3
from supabase import create_client, Client
import json

# Configurações
SUPABASE_URL = 'https://amkelczfwazutrciqtlk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print('=== ANÁLISE COMPLETA DO BANCO DE DADOS ===')
print()

# 1. Verificar tabelas existentes
print('1. TABELAS EXISTENTES:')
tables = ['member_types', 'subscription_plans', 'member_type_subscriptions', 'user_subscriptions']

for table in tables:
    try:
        response = supabase.table(table).select('*').limit(1).execute()
        print(f'✅ {table}: EXISTE')
        print(f'   Registros: {len(response.data)}')
        if response.data:
            print(f'   Estrutura: {list(response.data[0].keys())}')
    except Exception as e:
        print(f'❌ {table}: ERRO - {e}')

print()
print('2. DADOS EXISTENTES:')

# Verificar dados em member_types
try:
    response = supabase.table('member_types').select('*').execute()
    print(f'member_types: {len(response.data)} registros')
    for item in response.data:
        name = item.get('name', 'N/A')
        desc = item.get('description', 'N/A')
        print(f'  - {name}: {desc}')
except Exception as e:
    print(f'member_types: ERRO - {e}')

# Verificar dados em subscription_plans
try:
    response = supabase.table('subscription_plans').select('*').execute()
    print(f'subscription_plans: {len(response.data)} registros')
    for item in response.data:
        title = item.get('plan_title', 'N/A')
        price = item.get('price', 0)
        recurrence = item.get('recurrence', 'N/A')
        print(f'  - {title}: R$ {price} ({recurrence})')
except Exception as e:
    print(f'subscription_plans: ERRO - {e}')

print()
print('3. EDGE FUNCTIONS:')
# Verificar se edge function existe
try:
    # Tentar chamar a edge function (vai dar erro de auth, mas confirma que existe)
    response = supabase.functions.invoke('create-unified-member-type', {})
    print('✅ create-unified-member-type: EXISTE')
except Exception as e:
    if 'No authorization header' in str(e) or 'Unauthorized' in str(e):
        print('✅ create-unified-member-type: EXISTE (erro de auth esperado)')
    else:
        print(f'❌ create-unified-member-type: ERRO - {e}')

print()
print('=== ANÁLISE CONCLUÍDA ===')