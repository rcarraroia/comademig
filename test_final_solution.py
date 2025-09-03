#!/usr/bin/env python3

import os
import requests
import json
from datetime import datetime

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_fixed_solution():
    print("🔍 TESTE DA SOLUÇÃO FINAL...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Testar SELECT com campos específicos (como o hook corrigido faz)
    print("📖 TESTANDO SELECT COM CAMPOS ESPECÍFICOS...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json,last_updated_at,created_at",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SELECT específico funcionou!")
            data = response.json()
            if data:
                print(f"📋 Dados atuais: {json.dumps(data[0], indent=2)}")
        else:
            print(f"❌ SELECT falhou: {response.text}")
    except Exception as e:
        print(f"❌ Erro no SELECT: {e}")
    
    # Testar UPDATE com SELECT específico (como o hook corrigido faz)
    print("\n🔄 TESTANDO UPDATE COM SELECT ESPECÍFICO...")
    
    test_content = {
        "banner_principal": {
            "titulo_principal": "TESTE FINAL - FUNCIONANDO!",
            "subtitulo": "Se você está vendo isso, o problema foi resolvido!",
            "texto_botao": "Sucesso",
            "link_botao": "/sucesso"
        },
        "cards_acao": [
            {"titulo": "Teste 1", "descricao": "Funcionando", "link_botao": "/teste1"},
            {"titulo": "Teste 2", "descricao": "Funcionando", "link_botao": "/teste2"},
            {"titulo": "Teste 3", "descricao": "Funcionando", "link_botao": "/teste3"},
            {"titulo": "Teste 4", "descricao": "Funcionando", "link_botao": "/teste4"}
        ],
        "destaques_convencao": [],
        "noticias_recentes": [],
        "junte_se_missao": {
            "titulo_principal": "Teste Final",
            "subtitulo": "Sistema funcionando!",
            "texto_botao": "OK",
            "link_botao": "/ok"
        }
    }
    
    try:
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json,last_updated_at",
            headers=headers,
            json={
                "content_json": test_content,
                "last_updated_at": datetime.now().isoformat()
            }
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print("✅ UPDATE funcionou!")
            
            # Verificar se foi salvo
            print("\n🔍 VERIFICANDO SE FOI SALVO...")
            check_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json,last_updated_at",
                headers=headers
            )
            
            if check_response.status_code == 200:
                check_data = check_response.json()
                if check_data and len(check_data) > 0:
                    saved_content = check_data[0]['content_json']
                    titulo_salvo = saved_content.get('banner_principal', {}).get('titulo_principal', '')
                    
                    if titulo_salvo == "TESTE FINAL - FUNCIONANDO!":
                        print("🎉 SUCESSO TOTAL! O conteúdo foi salvo corretamente!")
                        print(f"📄 Título confirmado: {titulo_salvo}")
                        return True
                    else:
                        print(f"❌ Conteúdo não foi salvo. Título atual: {titulo_salvo}")
                        return False
                else:
                    print("❌ Nenhum dado retornado na verificação")
                    return False
            else:
                print(f"❌ Erro na verificação: {check_response.status_code}")
                return False
        else:
            print(f"❌ UPDATE falhou: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro no UPDATE: {e}")
        return False

if __name__ == "__main__":
    success = test_fixed_solution()
    print("\n" + "=" * 50)
    if success:
        print("🎉 PROBLEMA RESOLVIDO! O sistema de gerenciamento de conteúdo está funcionando!")
    else:
        print("❌ Ainda há problemas a serem resolvidos.")