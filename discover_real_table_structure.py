#!/usr/bin/env python3
"""
Script para descobrir a estrutura REAL da tabela subscription_plans
usando uma abordagem que funciona mesmo com RLS
"""

from supabase import create_client, Client

def get_supabase_client():
    """Conecta ao Supabase usando as credenciais do projeto"""
    url = "https://amkelczfwazutrciqtlk.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"
    
    return create_client(url, key)

def discover_table_structure():
    """Descobre a estrutura real da tabela através de tentativas de SELECT"""
    print("🔍 DESCOBRINDO ESTRUTURA REAL DA TABELA subscription_plans")
    print("=" * 65)
    
    supabase = get_supabase_client()
    
    # Lista de campos possíveis para testar
    possible_fields = [
        'id',
        'name', 
        'plan_title',
        'title',
        'description',
        'price',
        'recurrence',
        'permissions',
        'is_active',
        'active',
        'sort_order',
        'order_of_exhibition',
        'created_at',
        'updated_at',
        'created_by',
        'plan_id_gateway'
    ]
    
    existing_fields = []
    
    print("\n📋 TESTANDO CAMPOS INDIVIDUAIS:")
    print("-" * 50)
    
    for field in possible_fields:
        try:
            response = supabase.table('subscription_plans').select(field).limit(1).execute()
            if response.data is not None:  # Sucesso, mesmo que vazio
                existing_fields.append(field)
                print(f"✅ {field}: EXISTE")
            else:
                print(f"❌ {field}: NÃO EXISTE")
        except Exception as e:
            error_msg = str(e)
            if 'does not exist' in error_msg or 'column' in error_msg:
                print(f"❌ {field}: NÃO EXISTE")
            elif 'row-level security' in error_msg or '42501' in error_msg:
                # RLS bloqueou, mas o campo existe
                existing_fields.append(field)
                print(f"✅ {field}: EXISTE (RLS bloqueou)")
            else:
                print(f"⚠️  {field}: ERRO - {error_msg}")
    
    print(f"\n📊 CAMPOS CONFIRMADOS ({len(existing_fields)}):")
    print("-" * 50)
    for field in existing_fields:
        print(f"   • {field}")
    
    # Tentar SELECT com todos os campos existentes
    if existing_fields:
        print(f"\n🧪 TESTANDO SELECT COM TODOS OS CAMPOS:")
        print("-" * 50)
        
        try:
            fields_str = ', '.join(existing_fields)
            response = supabase.table('subscription_plans').select(fields_str).limit(1).execute()
            
            if response.data is not None:
                print("✅ SELECT com todos os campos funcionou!")
                if response.data:
                    print("\n📋 EXEMPLO DE REGISTRO:")
                    for key, value in response.data[0].items():
                        print(f"   • {key}: {type(value).__name__} = {value}")
                else:
                    print("📋 Tabela existe mas está vazia")
            else:
                print("❌ SELECT com todos os campos falhou")
                
        except Exception as e:
            print(f"❌ Erro no SELECT completo: {str(e)}")
    
    # Gerar script SQL correto
    print(f"\n📝 SCRIPT SQL CORRETO:")
    print("-" * 50)
    
    if existing_fields:
        # Determinar campos obrigatórios para INSERT
        required_fields = []
        optional_fields = []
        
        # Campos que geralmente são obrigatórios
        if 'name' in existing_fields:
            required_fields.append('name')
        elif 'plan_title' in existing_fields:
            required_fields.append('plan_title')
        elif 'title' in existing_fields:
            required_fields.append('title')
            
        if 'price' in existing_fields:
            required_fields.append('price')
            
        if 'recurrence' in existing_fields:
            required_fields.append('recurrence')
        
        # Campos opcionais
        if 'description' in existing_fields:
            optional_fields.append('description')
        if 'permissions' in existing_fields:
            optional_fields.append('permissions')
        if 'is_active' in existing_fields:
            optional_fields.append('is_active')
        elif 'active' in existing_fields:
            optional_fields.append('active')
        if 'sort_order' in existing_fields:
            optional_fields.append('sort_order')
        elif 'order_of_exhibition' in existing_fields:
            optional_fields.append('order_of_exhibition')
        
        all_insert_fields = required_fields + optional_fields
        
        print("-- Script SQL baseado na estrutura real descoberta")
        print(f"-- Campos encontrados: {', '.join(existing_fields)}")
        print()
        
        if all_insert_fields:
            fields_str = ', '.join(all_insert_fields)
            print(f"INSERT INTO subscription_plans ({fields_str}) VALUES")
            
            # Gerar valores de exemplo baseados nos campos
            values = []
            for field in all_insert_fields:
                if field in ['name', 'plan_title', 'title']:
                    values.append("'Plano Teste'")
                elif field == 'description':
                    values.append("'Descrição do plano teste'")
                elif field == 'price':
                    values.append("50.00")
                elif field == 'recurrence':
                    values.append("'annual'")  # Tentar valor comum
                elif field == 'permissions':
                    values.append("'{}'")
                elif field in ['is_active', 'active']:
                    values.append("true")
                elif field in ['sort_order', 'order_of_exhibition']:
                    values.append("0")
                else:
                    values.append("NULL")
            
            values_str = ', '.join(values)
            print(f"({values_str});")
        else:
            print("-- Não foi possível determinar campos para INSERT")
    else:
        print("-- Nenhum campo foi descoberto - tabela pode não existir")
    
    print("\n" + "=" * 65)
    print("✅ DESCOBERTA CONCLUÍDA")
    
    return existing_fields

if __name__ == "__main__":
    discover_table_structure()