#!/usr/bin/env python3

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(url, key)

print("🔍 DEBUG DETALHADO DO CONTEÚDO...")
print("=" * 50)

try:
    # Verificar o registro atual
    print("📖 CONTEÚDO ATUAL:")
    current = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
    
    if current.data:
        record = current.data[0]
        print(f"🆔 ID: {record['id']}")
        print(f"📄 Page Name: {record['page_name']}")
        print(f"📅 Created At: {record['created_at']}")
        print(f"📅 Last Updated At: {record['last_updated_at']}")
        print(f"👤 Last Updated By: {record['last_updated_by']}")
        print(f"📋 Content JSON: {json.dumps(record['content_json'], indent=2)}")
        
        # Tentar fazer um update simples
        print("\n🔄 FAZENDO UPDATE SIMPLES...")
        
        new_content = {
            "banner_principal": {
                "titulo_principal": "TESTE DE SALVAMENTO",
                "subtitulo": "Este é um teste",
                "texto_botao": "Teste",
                "link_botao": "/teste"
            }
        }
        
        update_result = supabase.table('content_management').update({
            'content_json': new_content
        }).eq('page_name', 'home').execute()
        
        print(f"✅ Update realizado!")
        print(f"📋 Resultado: {json.dumps(update_result.data, indent=2)}")
        
        # Verificar se foi salvo
        print("\n🔍 VERIFICANDO SE FOI SALVO...")
        check = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
        
        if check.data:
            updated_record = check.data[0]
            print(f"📋 Conteúdo após update: {json.dumps(updated_record['content_json'], indent=2)}")
            
            if updated_record['content_json'].get('banner_principal', {}).get('titulo_principal') == "TESTE DE SALVAMENTO":
                print("✅ SUCESSO! O conteúdo foi salvo corretamente!")
            else:
                print("❌ FALHA! O conteúdo não foi salvo!")
        else:
            print("❌ Registro não encontrado após update!")
            
    else:
        print("❌ Nenhum registro encontrado para 'home'")
        
except Exception as e:
    print(f"❌ ERRO: {e}")

print("\n" + "=" * 50)
print("✅ DEBUG CONCLUÍDO")