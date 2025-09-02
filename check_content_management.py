#!/usr/bin/env python3
import requests
import json

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def check_content_management():
    print("🔍 VERIFICANDO TABELA CONTENT_MANAGEMENT")
    print("=" * 50)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/content_management", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Tabela content_management EXISTE")
            print(f"📊 Total de registros: {len(data)}")
            
            if data:
                print("📋 Páginas configuradas:")
                for item in data:
                    page_name = item.get("page_name", "N/A")
                    updated_at = item.get("updated_at", "N/A")[:10] if item.get("updated_at") else "N/A"
                    print(f"  • {page_name} - Última atualização: {updated_at}")
                    
                    # Verificar se tem conteúdo
                    content_json = item.get("content_json")
                    if content_json:
                        print(f"    ✓ Tem conteúdo configurado")
                    else:
                        print(f"    ❌ Sem conteúdo configurado")
            else:
                print("⚠️  Tabela existe mas está vazia")
                
        elif response.status_code == 404:
            print("❌ Tabela content_management NÃO EXISTE")
        else:
            print(f"❌ Erro ao acessar tabela: {response.status_code}")
            print(f"Resposta: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

    # Verificar também as páginas do frontend
    print("\n🌐 VERIFICANDO PÁGINAS DO FRONTEND:")
    frontend_pages = ["home", "sobre", "lideranca", "noticias", "eventos", "multimidia", "contato"]
    
    for page in frontend_pages:
        try:
            # Verificar se existe conteúdo para cada página
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.{page}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data:
                    print(f"  ✅ {page.upper()} - Configurado")
                else:
                    print(f"  ❌ {page.upper()} - Não configurado")
            else:
                print(f"  ⚠️  {page.upper()} - Erro ao verificar")
                
        except Exception as e:
            print(f"  ❌ {page.upper()} - Erro: {e}")

if __name__ == "__main__":
    check_content_management()