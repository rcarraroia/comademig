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

print("🔍 DEBUG PROFUNDO DO PROBLEMA...")
print("=" * 50)

try:
    # 1. Ver estado atual
    print("1️⃣ ESTADO ATUAL:")
    current = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
    if current.data:
        print(f"📋 Conteúdo atual: {json.dumps(current.data[0]['content_json'], indent=2)}")
        record_id = current.data[0]['id']
        print(f"🆔 ID: {record_id}")
    
    # 2. Fazer update simples
    print("\n2️⃣ UPDATE SIMPLES:")
    simple_content = {"test": "simple_update", "timestamp": "2024-02-09T15:30:00Z"}
    
    update_result = supabase.table('content_management').update({
        'content_json': simple_content
    }).eq('page_name', 'home').execute()
    
    print(f"📊 Resultado do update: {update_result}")
    
    # 3. Verificar se foi salvo
    print("\n3️⃣ VERIFICAÇÃO IMEDIATA:")
    check = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
    if check.data:
        new_content = check.data[0]['content_json']
        print(f"📋 Conteúdo após update: {json.dumps(new_content, indent=2)}")
        
        if new_content.get('test') == 'simple_update':
            print("✅ UPDATE FUNCIONOU!")
        else:
            print("❌ UPDATE NÃO FUNCIONOU!")
            
            # 4. Tentar update por ID
            print("\n4️⃣ TENTANDO UPDATE POR ID:")
            id_update = supabase.table('content_management').update({
                'content_json': {"test": "update_by_id", "method": "by_id"}
            }).eq('id', record_id).execute()
            
            print(f"📊 Resultado update por ID: {id_update}")
            
            # Verificar novamente
            check2 = supabase.table('content_management').select('*').eq('page_name', 'home').execute()
            if check2.data:
                content_after_id = check2.data[0]['content_json']
                print(f"📋 Conteúdo após update por ID: {json.dumps(content_after_id, indent=2)}")
                
                if content_after_id.get('test') == 'update_by_id':
                    print("✅ UPDATE POR ID FUNCIONOU!")
                    print("💡 O problema pode estar no filtro por page_name")
                else:
                    print("❌ NENHUM UPDATE ESTÁ FUNCIONANDO!")
                    print("🔍 Pode haver um trigger ou política bloqueando")
    
    # 5. Verificar se há triggers ativos
    print("\n5️⃣ INFORMAÇÕES ADICIONAIS:")
    print("🔍 Verificando se há algum problema com triggers ou políticas...")
    
    # Tentar um upsert
    print("\n6️⃣ TESTANDO UPSERT:")
    try:
        upsert_result = supabase.table('content_management').upsert({
            'page_name': 'test_page_debug',
            'content_json': {"test": "upsert_test"}
        }).execute()
        print(f"📊 Resultado upsert: {upsert_result}")
        
        # Limpar o teste
        supabase.table('content_management').delete().eq('page_name', 'test_page_debug').execute()
        print("🧹 Registro de teste removido")
        
    except Exception as upsert_error:
        print(f"❌ Erro no upsert: {upsert_error}")
        
except Exception as e:
    print(f"❌ ERRO GERAL: {e}")

print("\n" + "=" * 50)
print("✅ DEBUG CONCLUÍDO")