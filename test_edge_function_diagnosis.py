#!/usr/bin/env python3
"""
Diagnóstico da Edge Function de Pagamento
Testa a edge function para identificar problemas específicos
"""
import requests
import json
from datetime import datetime, timedelta

# Configurações
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_edge_function():
    """Testa a edge function de criação de pagamento"""
    
    print("🔍 DIAGNÓSTICO DA EDGE FUNCTION DE PAGAMENTO")
    print("=" * 60)
    
    # URL da edge function
    edge_function_url = f"{SUPABASE_URL}/functions/v1/asaas-create-payment"
    
    # Headers
    headers = {
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY
    }
    
    # Dados de teste para filiação
    test_payment_data = {
        "customer": {
            "name": "João Silva Teste",
            "email": "joao.teste@email.com",
            "cpfCnpj": "12345678901",
            "phone": "31999999999",
            "city": "Belo Horizonte",
            "province": "MG"
        },
        "billingType": "PIX",
        "value": 50.00,
        "dueDate": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "description": "Teste de Filiação COMADEMIG",
        "tipoCobranca": "filiacao"
    }
    
    print("📋 Dados de teste:")
    print(json.dumps(test_payment_data, indent=2, ensure_ascii=False))
    print()
    
    try:
        print("🚀 Enviando requisição para edge function...")
        response = requests.post(
            edge_function_url,
            headers=headers,
            json=test_payment_data,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📊 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCESSO!")
            print("📄 Resposta:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            if result.get('success'):
                cobranca = result.get('cobranca', {})
                print(f"\n💰 Cobrança criada:")
                print(f"   - ID: {cobranca.get('id')}")
                print(f"   - Asaas ID: {cobranca.get('asaas_id')}")
                print(f"   - Valor: R$ {cobranca.get('valor')}")
                print(f"   - Status: {cobranca.get('status')}")
                
                if cobranca.get('qr_code_pix'):
                    print(f"   - QR Code PIX: Gerado ✅")
                
        else:
            print("❌ ERRO!")
            try:
                error_data = response.json()
                print("📄 Detalhes do erro:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print("📄 Resposta (texto):")
                print(response.text)
                
    except requests.exceptions.Timeout:
        print("⏰ TIMEOUT - Edge function demorou mais de 30 segundos")
    except requests.exceptions.ConnectionError:
        print("🔌 ERRO DE CONEXÃO - Não foi possível conectar à edge function")
    except Exception as e:
        print(f"💥 ERRO INESPERADO: {str(e)}")
    
    print("\n" + "=" * 60)
    print("📋 DIAGNÓSTICO CONCLUÍDO")

if __name__ == "__main__":
    test_edge_function()