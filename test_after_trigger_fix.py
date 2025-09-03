#!/usr/bin/env python3

import os
import requests
import json
from datetime import datetime

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def test_after_trigger_fix():
    print("🔍 TESTE APÓS CORREÇÃO DO TRIGGER...")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Conteúdo de teste realista
    test_content = {
        "banner_principal": {
            "titulo_principal": "🎉 SISTEMA FUNCIONANDO!",
            "subtitulo": "O gerenciador de conteúdo foi corrigido com sucesso!",
            "texto_botao": "Celebrar",
            "link_botao": "/sucesso"
        },
        "cards_acao": [
            {"titulo": "✅ Correção", "descricao": "Trigger corrigido", "link_botao": "/admin"},
            {"titulo": "✅ Políticas", "descricao": "RLS ajustado", "link_botao": "/admin"},
            {"titulo": "✅ Frontend", "descricao": "Código corrigido", "link_botao": "/admin"},
            {"titulo": "✅ Teste", "descricao": "Tudo funcionando", "link_botao": "/admin"}
        ],
        "destaques_convencao": [
            {
                "titulo_evento": "Sistema Corrigido",
                "imagem_evento": "",
                "subtitulo": "Gerenciador de conteúdo funcionando",
                "link_evento": "/admin"
            }
        ],
        "noticias_recentes": [
            {
                "titulo_noticia": "Problema Resolvido!",
                "imagem_noticia": "",
                "data_noticia": datetime.now().strftime("%Y-%m-%d"),
                "resumo_noticia": "O erro do campo updated_at foi corrigido",
                "link_noticia": "/noticias"
            }
        ],
        "junte_se_missao": {
            "titulo_principal": "Missão Cumprida!",
            "subtitulo": "O sistema está funcionando perfeitamente",
            "texto_botao": "Continuar",
            "link_botao": "/dashboard"
        }
    }
    
    try:
        print("🔄 TESTANDO UPDATE COM CONTEÚDO COMPLETO...")
        
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json,last_updated_at",
            headers=headers,
            json={
                "content_json": test_content,
                "last_updated_at": datetime.now().isoformat()
            }
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ UPDATE FUNCIONOU!")
            response_data = response.json()
            print(f"📋 Resposta: {json.dumps(response_data, indent=2)}")
            
            # Verificar se foi realmente salvo
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
                    
                    if "SISTEMA FUNCIONANDO" in titulo_salvo:
                        print("🎉 SUCESSO TOTAL!")
                        print(f"📄 Título confirmado: {titulo_salvo}")
                        print(f"📅 Última atualização: {check_data[0].get('last_updated_at', 'N/A')}")
                        
                        # Verificar outros campos
                        cards = saved_content.get('cards_acao', [])
                        print(f"📋 Cards salvos: {len(cards)}")
                        
                        destaques = saved_content.get('destaques_convencao', [])
                        print(f"🌟 Destaques salvos: {len(destaques)}")
                        
                        noticias = saved_content.get('noticias_recentes', [])
                        print(f"📰 Notícias salvas: {len(noticias)}")
                        
                        print("\n🎯 RESULTADO: O gerenciador de conteúdo está FUNCIONANDO PERFEITAMENTE!")
                        return True
                    else:
                        print(f"❌ Conteúdo não foi salvo corretamente. Título: {titulo_salvo}")
                        return False
                else:
                    print("❌ Nenhum dado retornado")
                    return False
            else:
                print(f"❌ Erro na verificação: {check_response.status_code} - {check_response.text}")
                return False
                
        elif response.status_code == 204:
            print("✅ UPDATE RETORNOU 204 (No Content) - Isso é normal!")
            print("🔍 Verificando se foi salvo mesmo assim...")
            
            # Verificar se foi salvo
            check_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json,last_updated_at",
                headers=headers
            )
            
            if check_response.status_code == 200:
                check_data = check_response.json()
                if check_data and len(check_data) > 0:
                    saved_content = check_data[0]['content_json']
                    titulo_salvo = saved_content.get('banner_principal', {}).get('titulo_principal', '')
                    
                    if "SISTEMA FUNCIONANDO" in titulo_salvo:
                        print("🎉 SUCESSO! Conteúdo foi salvo mesmo com 204!")
                        return True
                    else:
                        print(f"❌ Conteúdo não foi salvo. Título atual: {titulo_salvo}")
                        return False
            
            return False
        else:
            print(f"❌ UPDATE FALHOU: {response.status_code}")
            print(f"📋 Erro: {response.text}")
            
            # Verificar se ainda é o erro do updated_at
            if "updated_at" in response.text:
                print("🔧 AINDA HÁ PROBLEMA COM O CAMPO updated_at!")
                print("💡 Execute o script fix_all_triggers.sql no Supabase")
            
            return False
            
    except Exception as e:
        print(f"❌ ERRO DE CONEXÃO: {e}")
        return False

if __name__ == "__main__":
    success = test_after_trigger_fix()
    print("\n" + "=" * 50)
    if success:
        print("🎉 PROBLEMA TOTALMENTE RESOLVIDO!")
        print("✅ O gerenciador de conteúdo está funcionando!")
        print("🚀 Você pode usar o sistema normalmente!")
    else:
        print("❌ Ainda há problemas.")
        print("🔧 Execute o script fix_all_triggers.sql no Supabase")
        print("📞 Se o problema persistir, verifique os logs do Supabase")