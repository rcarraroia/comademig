#!/usr/bin/env python3

import os
import requests
import json
from datetime import datetime

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_content_update():
    print("🔍 TESTE FINAL - SIMULANDO SALVAMENTO DO EDITOR...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Dados exatos que o editor está tentando salvar
    content_data = {
        "banner_principal": {
            "titulo_principal": "Com Deus nós podemos Mais",
            "subtitulo": "Descrição do banner",
            "texto_botao": "Conheça",
            "link_botao": "/sobre"
        },
        "cards_acao": [
            {"titulo": "Inscreva-se", "descricao": "Participe dos nossos eventos e congressos", "link_botao": "/eventos"},
            {"titulo": "Filie-se", "descricao": "Torne-se membro da COMADEMIG", "link_botao": "/filiacao"},
            {"titulo": "Regularização", "descricao": "Regularize sua igreja e documentação", "link_botao": "/dashboard/regularizacao"},
            {"titulo": "Ao Vivo", "descricao": "Acompanhe nossos cultos e eventos", "link_botao": "/eventos"}
        ],
        "destaques_convencao": [],
        "noticias_recentes": [],
        "junte_se_missao": {
            "titulo_principal": "Junte-se à Nossa Missão",
            "subtitulo": "Faça parte da família COMADEMIG e fortaleça o Reino de Deus em Minas Gerais",
            "texto_botao": "Filie-se Agora",
            "link_botao": "/filiacao"
        }
    }
    
    update_payload = {
        "content_json": content_data,
        "last_updated_at": datetime.now().isoformat()
    }
    
    try:
        # Testar UPDATE (que é o que o hook corrigido faz)
        print("🔄 Testando UPDATE...")
        url = f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home"
        
        response = requests.patch(
            url,
            headers=headers,
            json=update_payload
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCESSO! O conteúdo foi salvo!")
            
            # Verificar se foi realmente salvo
            print("\n🔍 Verificando se foi salvo...")
            get_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=*",
                headers=headers
            )
            
            if get_response.status_code == 200:
                data = get_response.json()
                if data and len(data) > 0:
                    saved_content = data[0]['content_json']
                    print("✅ Conteúdo verificado!")
                    print(f"📄 Título salvo: {saved_content.get('banner_principal', {}).get('titulo_principal', 'N/A')}")
                else:
                    print("⚠️ Nenhum dado encontrado")
            else:
                print(f"❌ Erro ao verificar: {get_response.status_code}")
                
        else:
            print(f"❌ ERRO: {response.status_code}")
            print(f"📋 Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERRO DE CONEXÃO: {e}")

if __name__ == "__main__":
    test_content_update()