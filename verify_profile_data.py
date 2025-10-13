#!/usr/bin/env python3
"""
Verificar dados do perfil do último usuário criado
"""

from supabase import create_client, Client
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verify_profile():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # User ID do último teste
    user_id = "324b8066-1be9-425b-8384-942134e012f7"
    
    print(f"🔍 VERIFICANDO PERFIL DO USUÁRIO")
    print(f"{'='*60}")
    print(f"User ID: {user_id}")
    print(f"{'='*60}\n")
    
    try:
        response = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
        
        if response.data:
            profile = response.data
            
            print("📋 DADOS PESSOAIS:")
            print(f"  Nome: {profile.get('nome_completo', 'NULL')}")
            print(f"  CPF: {profile.get('cpf', 'NULL')}")
            print(f"  RG: {profile.get('rg', 'NULL')}")
            print(f"  Email: {profile.get('email', 'NULL')}")
            print(f"  Telefone: {profile.get('telefone', 'NULL')}")
            print(f"  Data Nascimento: {profile.get('data_nascimento', 'NULL')}")
            
            print(f"\n📍 ENDEREÇO:")
            print(f"  CEP: {profile.get('cep', 'NULL')}")
            print(f"  Endereço: {profile.get('endereco', 'NULL')}")
            print(f"  Número: {profile.get('numero', 'NULL')}")
            print(f"  Complemento: {profile.get('complemento', 'NULL')}")
            print(f"  Bairro: {profile.get('bairro', 'NULL')}")
            print(f"  Cidade: {profile.get('cidade', 'NULL')}")
            print(f"  Estado: {profile.get('estado', 'NULL')}")
            
            print(f"\n⛪ DADOS MINISTERIAIS:")
            print(f"  Igreja: {profile.get('igreja', 'NULL')}")
            print(f"  Cargo: {profile.get('cargo', 'NULL')}")
            print(f"  Tipo Membro: {profile.get('tipo_membro', 'NULL')}")
            print(f"  Data Ordenação: {profile.get('data_ordenacao', 'NULL')}")
            
            print(f"\n💳 DADOS ASAAS:")
            print(f"  Customer ID: {profile.get('asaas_customer_id', 'NULL')}")
            print(f"  Subscription ID: {profile.get('asaas_subscription_id', 'NULL')}")
            
            print(f"\n📊 ANÁLISE:")
            campos_vazios = []
            campos_preenchidos = []
            
            campos_importantes = [
                'cpf', 'telefone', 'cep', 'endereco', 'numero', 
                'bairro', 'cidade', 'estado', 'igreja', 'cargo'
            ]
            
            for campo in campos_importantes:
                valor = profile.get(campo)
                if valor is None or valor == '' or valor == 'NULL':
                    campos_vazios.append(campo)
                else:
                    campos_preenchidos.append(campo)
            
            print(f"\n  ✅ Campos preenchidos ({len(campos_preenchidos)}):")
            for campo in campos_preenchidos:
                print(f"    - {campo}: {profile.get(campo)}")
            
            print(f"\n  ❌ Campos vazios ({len(campos_vazios)}):")
            for campo in campos_vazios:
                print(f"    - {campo}")
            
            print(f"\n{'='*60}")
            if len(campos_vazios) == 0:
                print("✅ TODOS OS CAMPOS IMPORTANTES ESTÃO PREENCHIDOS!")
            else:
                print(f"⚠️ {len(campos_vazios)} CAMPOS IMPORTANTES ESTÃO VAZIOS")
            print(f"{'='*60}")
            
        else:
            print("❌ Perfil não encontrado")
            
    except Exception as e:
        print(f"❌ Erro ao buscar perfil: {str(e)}")

if __name__ == "__main__":
    verify_profile()
