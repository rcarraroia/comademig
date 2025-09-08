#!/usr/bin/env python3
"""
Verificar configuração do Asaas
Testa se a API key está configurada e funcionando
"""
import requests
import os

def check_asaas_api():
    """Verifica se a API do Asaas está configurada e funcionando"""
    
    print("🔍 VERIFICAÇÃO DA CONFIGURAÇÃO ASAAS")
    print("=" * 50)
    
    # Verificar se existe API key (simulada - não temos acesso às env vars do Supabase)
    print("🔑 Verificando configuração da API...")
    
    # Tentar uma chamada básica para a API do Asaas (sem API key real)
    # Isso nos dirá se o endpoint está funcionando
    
    try:
        # Teste básico de conectividade com a API Asaas
        response = requests.get(
            'https://www.asaas.com/api/v3/customers',
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 Status da API Asaas: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ API Asaas está funcionando (erro 401 esperado sem API key)")
            print("🔑 Problema provável: API key não configurada ou inválida")
        elif response.status_code == 200:
            print("⚠️ Resposta inesperada (200) - verificar configuração")
        else:
            print(f"❌ Status inesperado: {response.status_code}")
            print(f"📄 Resposta: {response.text[:200]}")
            
    except requests.exceptions.Timeout:
        print("⏰ TIMEOUT - API Asaas não respondeu em 10 segundos")
    except requests.exceptions.ConnectionError:
        print("🔌 ERRO DE CONEXÃO - Não foi possível conectar à API Asaas")
    except Exception as e:
        print(f"💥 ERRO: {str(e)}")
    
    print("\n📋 POSSÍVEIS PROBLEMAS IDENTIFICADOS:")
    print("1. 🔑 API key do Asaas não configurada no Supabase")
    print("2. 🔐 API key inválida ou expirada")
    print("3. 🌐 Problemas de conectividade com API Asaas")
    print("4. 🔒 Edge function requer usuário autenticado")
    
    print("\n📋 PRÓXIMOS PASSOS:")
    print("1. Verificar se ASAAS_API_KEY está configurada no Supabase")
    print("2. Testar edge function com usuário autenticado")
    print("3. Verificar logs da edge function no Supabase")
    print("4. Implementar retry logic e melhor tratamento de erros")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    check_asaas_api()