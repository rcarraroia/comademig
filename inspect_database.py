#!/usr/bin/env python3
import requests
import json

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def inspect_database():
    print("🔍 INSPEÇÃO DO BANCO DE DADOS SUPABASE")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Lista de tabelas para verificar
    tables_to_check = [
        "profiles", "eventos", "inscricoes_eventos", "presencas_eventos",
        "user_roles", "affiliates", "carteira_digital", "member_types",
        "subscription_plans", "user_subscriptions", "planos_assinatura"
    ]
    
    print("\n📋 VERIFICANDO TABELAS:")
    
    for table in tables_to_check:
        try:
            # Tentar fazer uma query simples para verificar se a tabela existe
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?limit=1",
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"  ✓ {table} - EXISTE")
                
                # Se for a tabela profiles, verificar se tem coluna bio
                if table == "profiles":
                    # Tentar buscar um registro com bio
                    bio_response = requests.get(
                        f"{SUPABASE_URL}/rest/v1/{table}?select=bio&limit=1",
                        headers=headers
                    )
                    if bio_response.status_code == 200:
                        print(f"    • Coluna 'bio' existe: ✓ SIM")
                    else:
                        print(f"    • Coluna 'bio' existe: ❌ NÃO (erro: {bio_response.status_code})")
                        
            elif response.status_code == 404:
                print(f"  ❌ {table} - NÃO EXISTE")
            else:
                print(f"  ⚠️  {table} - ERRO {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"  ❌ {table} - ERRO DE CONEXÃO: {str(e)[:50]}")
    
    # Verificar especificamente a estrutura de eventos se existir
    print("\n🎪 DETALHES DA TABELA 'eventos':")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/eventos?limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                print("  Colunas encontradas no primeiro registro:")
                for key in data[0].keys():
                    print(f"    • {key}")
            else:
                print("  Tabela existe mas está vazia")
        else:
            print(f"  Erro ao acessar: {response.status_code}")
            
    except Exception as e:
        print(f"  Erro: {e}")
    
    # Verificar especificamente a estrutura de subscription_plans se existir
    print("\n💳 DETALHES DA TABELA 'subscription_plans':")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/subscription_plans?limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                print("  Colunas encontradas no primeiro registro:")
                for key in data[0].keys():
                    print(f"    • {key}")
            else:
                print("  Tabela existe mas está vazia")
        else:
            print(f"  Erro ao acessar: {response.status_code}")
            
    except Exception as e:
        print(f"  Erro: {e}")
    
    # Verificar especificamente a estrutura de user_subscriptions se existir
    print("\n👥 DETALHES DA TABELA 'user_subscriptions':")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_subscriptions?limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                print("  Colunas encontradas no primeiro registro:")
                for key in data[0].keys():
                    print(f"    • {key}")
            else:
                print("  Tabela existe mas está vazia")
        else:
            print(f"  Erro ao acessar: {response.status_code}")
            
    except Exception as e:
        print(f"  Erro: {e}")
    
    print("\n" + "=" * 50)
    print("✅ INSPEÇÃO CONCLUÍDA")

if __name__ == "__main__":
    inspect_database()