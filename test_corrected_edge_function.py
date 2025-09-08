#!/usr/bin/env python3
"""
Teste Completo da Edge Function Corrigida
Testa todos os tipos de serviço e cenários de erro
"""
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Configurações
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_all_service_types():
    """Testa a edge function com todos os tipos de serviço"""
    
    print("🧪 TESTE COMPLETO DA EDGE FUNCTION CORRIGIDA")
    print("=" * 70)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Dados base do cliente
    base_customer = {
        "name": "João Silva Teste",
        "email": "joao.teste@email.com",
        "cpfCnpj": "12345678901",
        "phone": "31999999999",
        "city": "Belo Horizonte",
        "province": "MG"
    }
    
    # Data de vencimento padrão
    due_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Cenários de teste
    test_scenarios = [
        {
            "name": "Certidão de Ministério",
            "data": {
                "customer": base_customer,
                "billingType": "PIX",
                "value": 45.00,
                "dueDate": due_date,
                "description": "Certidão de Ministério - Teste",
                "tipoCobranca": "certidao",
                "serviceType": "certidao",
                "serviceData": {
                    "tipo_certidao": "ministerio",
                    "justificativa": "Necessário para comprovação ministerial"
                }
            }
        },
        {
            "name": "Regularização de Igreja",
            "data": {
                "customer": base_customer,
                "billingType": "BOLETO",
                "value": 1230.00,
                "dueDate": due_date,
                "description": "Regularização Completa - Teste",
                "tipoCobranca": "regularizacao",
                "serviceType": "regularizacao",
                "serviceData": {
                    "servicos_selecionados": [
                        {"id": "estatuto", "nome": "Estatuto Social", "valor": 450.00},
                        {"id": "cnpj", "nome": "Solicitação de CNPJ", "valor": 380.00},
                        {"id": "ata-fundacao", "nome": "Ata de Fundação", "valor": 250.00},
                        {"id": "consultoria", "nome": "Consultoria Jurídica", "valor": 150.00}
                    ]
                }
            }
        },
        {
            "name": "Filiação COMADEMIG",
            "data": {
                "customer": base_customer,
                "billingType": "PIX",
                "value": 120.00,
                "dueDate": due_date,
                "description": "Filiação COMADEMIG - Plano Mensal",
                "tipoCobranca": "filiacao",
                "serviceType": "filiacao",
                "serviceData": {
                    "member_type_id": "pastor-presidente",
                    "subscription_plan_id": "plano-mensal-pastor"
                }
            }
        }
    ]
    
    results = []
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n🧪 Teste {i}: {scenario['name']}")
        print("-" * 50)
        
        try:
            print("📋 Dados do teste:")
            print(f"   - Tipo: {scenario['data']['serviceType']}")
            print(f"   - Valor: R$ {scenario['data']['value']}")
            print(f"   - Forma: {scenario['data']['billingType']}")
            
            # Chamar edge function
            response = supabase.functions.invoke('asaas-create-payment', {
                'body': scenario['data']
            })
            
            if response.error:
                print(f"❌ ERRO: {response.error}")
                results.append({
                    'scenario': scenario['name'],
                    'success': False,
                    'error': str(response.error)
                })
            elif response.data and response.data.get('success'):
                print("✅ SUCESSO!")
                cobranca = response.data.get('cobranca', {})
                print(f"   - ID Cobrança: {cobranca.get('id')}")
                print(f"   - Asaas ID: {cobranca.get('asaas_id')}")
                print(f"   - Status: {cobranca.get('status')}")
                print(f"   - Service Type: {cobranca.get('service_type')}")
                
                if scenario['data']['billingType'] == 'PIX' and cobranca.get('qr_code_pix'):
                    print("   - QR Code PIX: ✅ Gerado")
                
                results.append({
                    'scenario': scenario['name'],
                    'success': True,
                    'cobranca_id': cobranca.get('id'),
                    'asaas_id': cobranca.get('asaas_id')
                })
            else:
                error_msg = response.data.get('error', 'Erro desconhecido') if response.data else 'Resposta vazia'
                print(f"❌ FALHA: {error_msg}")
                results.append({
                    'scenario': scenario['name'],
                    'success': False,
                    'error': error_msg
                })
                
        except Exception as e:
            print(f"💥 EXCEÇÃO: {str(e)}")
            results.append({
                'scenario': scenario['name'],
                'success': False,
                'error': f"Exceção: {str(e)}"
            })
    
    # Teste de validação de dados
    print(f"\n🧪 Teste 4: Validação de Dados Inválidos")
    print("-" * 50)
    
    invalid_data = {
        "customer": {
            "name": "",  # Nome vazio (inválido)
            "email": "email-invalido",  # Email inválido
            "cpfCnpj": ""  # CPF vazio (inválido)
        },
        "billingType": "PIX",
        "value": -10.00,  # Valor negativo (inválido)
        "dueDate": due_date,
        "description": "",  # Descrição vazia (inválida)
        "tipoCobranca": "teste"
    }
    
    try:
        response = supabase.functions.invoke('asaas-create-payment', {
            'body': invalid_data
        })
        
        if response.error or (response.data and not response.data.get('success')):
            print("✅ VALIDAÇÃO FUNCIONANDO - Dados inválidos rejeitados corretamente")
            error_details = response.error or response.data.get('error')
            print(f"   - Erro: {error_details}")
            results.append({
                'scenario': 'Validação de Dados Inválidos',
                'success': True,
                'note': 'Validação funcionando corretamente'
            })
        else:
            print("❌ PROBLEMA - Dados inválidos foram aceitos!")
            results.append({
                'scenario': 'Validação de Dados Inválidos',
                'success': False,
                'error': 'Validação não está funcionando'
            })
            
    except Exception as e:
        print(f"💥 EXCEÇÃO: {str(e)}")
        results.append({
            'scenario': 'Validação de Dados Inválidos',
            'success': False,
            'error': f"Exceção: {str(e)}"
        })
    
    # Resumo dos resultados
    print(f"\n📊 RESUMO DOS TESTES")
    print("=" * 70)
    
    successful_tests = sum(1 for r in results if r['success'])
    total_tests = len(results)
    
    print(f"✅ Testes bem-sucedidos: {successful_tests}/{total_tests}")
    print(f"❌ Testes com falha: {total_tests - successful_tests}/{total_tests}")
    
    if successful_tests == total_tests:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Edge function está funcionando corretamente")
    else:
        print(f"\n⚠️ {total_tests - successful_tests} TESTE(S) FALHARAM")
        print("❌ Problemas identificados:")
        
        for result in results:
            if not result['success']:
                print(f"   - {result['scenario']}: {result.get('error', 'Erro desconhecido')}")
    
    # Verificar estrutura do banco
    print(f"\n🔍 VERIFICAÇÃO DO BANCO DE DADOS")
    print("-" * 50)
    
    try:
        # Verificar se as novas colunas existem
        cobrancas = supabase.table('asaas_cobrancas').select('service_type, service_data', count='exact').limit(1).execute()
        print(f"✅ Novas colunas (service_type, service_data) estão disponíveis")
        
        # Verificar cobranças criadas nos testes
        test_cobrancas = supabase.table('asaas_cobrancas').select('*').order('created_at', ascending=False).limit(5).execute()
        print(f"📊 Últimas cobranças criadas: {len(test_cobrancas.data)}")
        
        for cobranca in test_cobrancas.data:
            if cobranca.get('service_type'):
                print(f"   - {cobranca['service_type']}: R$ {cobranca['valor']} ({cobranca['status']})")
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
    
    print("\n" + "=" * 70)
    print("📋 TESTE COMPLETO CONCLUÍDO")
    
    return results

if __name__ == "__main__":
    test_all_service_types()