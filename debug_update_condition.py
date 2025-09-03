#!/usr/bin/env python3

import os
from supabase import create_client, Client
from datetime import datetime

# Configuração do Supabase
url = "https://amkelczfwazutrciqtlk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(url, key)

def debug_update_conditions():
    print("🔍 DEBUG: CONDIÇÕES DE UPDATE")
    print("=" * 60)
    
    # Primeiro, vamos ver exatamente quais registros existem
    try:
        result = supabase.table('content_management').select('id, page_name, last_updated_at').execute()
        
        print("📋 Registros existentes:")
        for record in result.data:
            print(f"   ID: {record['id']}")
            print(f"   Page: '{record['page_name']}'")
            print(f"   Updated: {record['last_updated_at']}")
            print("   ---")
            
    except Exception as e:
        print(f"❌ Erro ao listar registros: {e}")
        return
    
    # Agora vamos testar UPDATE com cada page_name
    pages_to_test = ['home', 'sobre', 'lideranca', 'contato']
    
    for page in pages_to_test:
        print(f"\n🧪 Testando UPDATE para '{page}':")
        
        try:
            # Primeiro verificar se o registro existe
            check_result = supabase.table('content_management').select('id').eq('page_name', page).execute()
            
            if check_result.data:
                print(f"   ✅ Registro existe: ID {check_result.data[0]['id']}")
                
                # Tentar UPDATE
                update_result = supabase.table('content_management').update({
                    'last_updated_at': datetime.now().isoformat()
                }).eq('page_name', page).execute()
                
                if update_result.data:
                    print(f"   ✅ UPDATE funcionou: {len(update_result.data)} registro(s) afetado(s)")
                else:
                    print(f"   ❌ UPDATE falhou: nenhum registro afetado")
                    print(f"   Resposta: {update_result}")
            else:
                print(f"   ❌ Registro não existe")
                
        except Exception as e:
            print(f"   ❌ Erro: {e}")

def test_update_with_content():
    print(f"\n📝 TESTANDO UPDATE COM CONTEÚDO REAL")
    print("=" * 60)
    
    # Dados de teste simples
    test_content = {
        "titulo": "Teste de Update",
        "descricao": "Testando se o update funciona",
        "lideres": [
            {
                "id": "test-1",
                "nome": "Teste Nome",
                "cargo": "Teste Cargo",
                "bio": "Teste Bio",
                "ordem": 1,
                "categoria": "presidencia"
            }
        ]
    }
    
    try:
        # Tentar UPDATE na página lideranca
        result = supabase.table('content_management').update({
            'content_json': test_content,
            'last_updated_at': datetime.now().isoformat()
        }).eq('page_name', 'lideranca').execute()
        
        if result.data:
            print("✅ UPDATE com conteúdo funcionou!")
            print(f"   Registros afetados: {len(result.data)}")
            
            # Verificar se foi salvo
            verify_result = supabase.table('content_management').select('content_json').eq('page_name', 'lideranca').execute()
            if verify_result.data:
                saved_content = verify_result.data[0]['content_json']
                print(f"   Título salvo: {saved_content.get('titulo', 'N/A')}")
                print(f"   Líderes salvos: {len(saved_content.get('lideres', []))}")
        else:
            print("❌ UPDATE com conteúdo falhou")
            print(f"   Resposta: {result}")
            
    except Exception as e:
        print(f"❌ Erro no UPDATE com conteúdo: {e}")

if __name__ == "__main__":
    debug_update_conditions()
    test_update_with_content()