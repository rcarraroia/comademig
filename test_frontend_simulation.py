#!/usr/bin/env python3

import os
import requests
import json
from datetime import datetime

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_update_like_frontend():
    print("🔍 SIMULANDO EXATAMENTE O QUE O FRONTEND FAZ...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Dados que o frontend está enviando
    update_data = {
        "content_json": {
            "banner_principal": {
                "titulo_principal": "Com Deus nós podemos Mais",
                "subtitulo": "Descrição do banner",
                "texto_botao": "Conheça",
                "link_botao": "/sobre"
            },
            "cards_acao": [
                {"titulo": "Inscreva-se", "descricao": "Participe dos nossos eventos", "link_botao": "/eventos"},
                {"titulo": "Filie-se", "descricao": "Torne-se membro", "link_botao": "/filiacao"},
                {"titulo": "Regularização", "descricao": "Regularize sua igreja", "link_botao": "/dashboard/regularizacao"},
                {"titulo": "Ao Vivo", "descricao": "Acompanhe nossos cultos", "link_botao": "/eventos"}
            ],
            "destaques_convencao": [],
            "noticias_recentes": [],
            "junte_se_missao": {
                "titulo_principal": "Junte-se à Nossa Missão",
                "subtitulo": "Faça parte da família COMADEMIG",
                "texto_botao": "Filie-se Agora",
                "link_botao": "/filiacao"
            }
        },
        "last_updated_at": datetime.now().isoformat()
    }
    
    try:
        # Simular exatamente a query do frontend
        url = f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=*"
        
        response = requests.patch(
            url,
            headers=headers,
            json=update_data
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCESSO! O update funcionou!")
            data = response.json()
            print(f"📄 Dados retornados: {json.dumps(data, indent=2)}")
        else:
            print("❌ FALHOU!")
            print(f"Erro: {response.text}")
            
    except Exception as e:
        print(f"❌ ERRO DE CONEXÃO: {e}")

if __name__ == "__main__":
    test_update_like_frontend()