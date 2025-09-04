#!/usr/bin/env python3

import os
import requests
import json
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def get_supabase_config():
    """Obter configuração do Supabase"""
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise Exception("Credenciais do Supabase não encontradas")
    
    return {
        'url': url,
        'anon_key': key,
        'service_key': service_key
    }

def make_request(endpoint, headers, params=None):
    """Fazer requisição para API do Supabase"""
    try:
        response = requests.get(endpoint, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {'error': str(e), 'status_code': getattr(response, 'status_code', None)}

def inspect_supabase_storage():
    """Inspecionar storage via API REST"""
    
    config = get_supabase_config()
    
    print("🔍 INSPEÇÃO VIA API REST DO SUPABASE")
    print("=" * 70)
    print(f"🌐 URL: {config['url']}")
    print(f"🔑 Chave disponível: {'✅' if config['anon_key'] else '❌'}")
    print(f"🔐 Service Key: {'✅' if config['service_key'] else '❌'}")
    
    # Headers para autenticação (usar service key se disponível)
    auth_key = config['service_key'] if config['service_key'] else config['anon_key']
    headers = {
        'apikey': auth_key,
        'Authorization': f"Bearer {auth_key}",
        'Content-Type': 'application/json'
    }
    
    # 1. Listar buckets via Storage API
    print("\n1️⃣ BUCKETS VIA STORAGE API:")
    storage_url = f"{config['url']}/storage/v1/bucket"
    
    buckets_response = make_request(storage_url, headers)
    
    if 'error' in buckets_response:
        print(f"❌ Erro ao listar buckets: {buckets_response['error']}")
    else:
        print(f"✅ Buckets encontrados: {len(buckets_response)}")
        for bucket in buckets_response:
            print(f"   - {bucket.get('name', 'N/A')}: público={bucket.get('public', 'N/A')}")
    
    # 2. Verificar bucket content-images especificamente
    print("\n2️⃣ VERIFICAÇÃO DO BUCKET content-images:")
    content_bucket_url = f"{config['url']}/storage/v1/bucket/content-images"
    
    content_response = make_request(content_bucket_url, headers)
    
    if 'error' in content_response:
        print(f"❌ Erro ao verificar content-images: {content_response['error']}")
    else:
        print("✅ Bucket content-images encontrado:")
        print(f"   - Nome: {content_response.get('name', 'N/A')}")
        print(f"   - Público: {content_response.get('public', 'N/A')}")
        print(f"   - Criado: {content_response.get('created_at', 'N/A')}")
    
    # 3. Listar objetos no bucket content-images
    print("\n3️⃣ OBJETOS NO BUCKET content-images:")
    objects_url = f"{config['url']}/storage/v1/object/list/content-images"
    
    objects_response = make_request(objects_url, headers)
    
    if 'error' in objects_response:
        print(f"❌ Erro ao listar objetos: {objects_response['error']}")
    else:
        if isinstance(objects_response, list):
            print(f"✅ Objetos encontrados: {len(objects_response)}")
            for obj in objects_response[:10]:  # Mostrar apenas os primeiros 10
                print(f"   - {obj.get('name', 'N/A')} (tamanho: {obj.get('metadata', {}).get('size', 'N/A')})")
        else:
            print("❌ Resposta inesperada ao listar objetos")
    
    # 4. Testar upload (simulação)
    print("\n4️⃣ TESTE DE PERMISSÕES DE UPLOAD:")
    
    # Tentar fazer um upload de teste (sem arquivo real)
    upload_url = f"{config['url']}/storage/v1/object/content-images/test-permission.txt"
    
    # Usar método HEAD para testar permissões sem fazer upload real
    try:
        response = requests.head(upload_url, headers=headers)
        print(f"✅ Teste de permissão: Status {response.status_code}")
        if response.status_code == 404:
            print("   - Bucket acessível, arquivo não existe (normal)")
        elif response.status_code == 403:
            print("   - ❌ PROBLEMA: Acesso negado (RLS bloqueando)")
        else:
            print(f"   - Status inesperado: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro no teste de permissão: {e}")
    
    # 5. Verificar políticas via REST API (se disponível)
    print("\n5️⃣ TENTATIVA DE VERIFICAR POLÍTICAS:")
    
    # Tentar acessar informações de políticas via PostgREST
    policies_url = f"{config['url']}/rest/v1/rpc/get_policies"
    
    policies_response = make_request(policies_url, headers)
    
    if 'error' in policies_response:
        print(f"❌ Não foi possível acessar políticas via API: {policies_response['error']}")
    else:
        print("✅ Políticas acessíveis via API")
        print(json.dumps(policies_response, indent=2))
    
    # 6. Verificar autenticação atual
    print("\n6️⃣ STATUS DE AUTENTICAÇÃO:")
    
    auth_url = f"{config['url']}/auth/v1/user"
    
    auth_response = make_request(auth_url, headers)
    
    if 'error' in auth_response:
        print(f"❌ Erro na autenticação: {auth_response['error']}")
        print("   - Usando chave anônima (normal para API pública)")
    else:
        print("✅ Usuário autenticado:")
        print(f"   - ID: {auth_response.get('id', 'N/A')}")
        print(f"   - Email: {auth_response.get('email', 'N/A')}")
    
    print("\n" + "=" * 70)
    print("✅ INSPEÇÃO VIA API CONCLUÍDA")
    print("\n🎯 DIAGNÓSTICO:")
    print("- Se buckets aparecem mas upload falha = problema de RLS")
    print("- Se buckets não aparecem = problema de configuração")
    print("- Se erro 403 no teste = políticas RLS muito restritivas")

if __name__ == "__main__":
    try:
        inspect_supabase_storage()
    except Exception as e:
        print(f"❌ Erro geral: {e}")