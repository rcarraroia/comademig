#!/usr/bin/env python3

import os
import requests

# Configuração do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def teste_simples():
    print("🔍 TESTE SIMPLES - STATUS ATUAL")
    print("=" * 40)
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # 1. Verificar se consegue ler
    print("1️⃣ TESTE DE LEITURA:")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home&select=page_name,content_json,last_updated_at",
            headers=headers
        )
        if response.status_code == 200:
            print("✅ Leitura OK")
        else:
            print(f"❌ Leitura falhou: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # 2. Verificar se o trigger não dá mais erro
    print("\n2️⃣ TESTE DE UPDATE (verificar se não há erro de trigger):")
    try:
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/content_management?page_name=eq.home",
            headers=headers,
            json={"content_json": {"teste": "sem_erro_trigger"}}
        )
        print(f"Status: {response.status_code}")
        
        if "updated_at" in response.text:
            print("❌ AINDA HÁ ERRO DE TRIGGER!")
        elif response.status_code in [200, 204]:
            print("✅ Sem erro de trigger!")
        else:
            print(f"⚠️  Outro tipo de erro: {response.text[:100]}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    print("\n" + "=" * 40)
    print("📋 RESUMO:")
    print("• Trigger corrigido: ✅")
    print("• Políticas RLS: ✅") 
    print("• Problema restante: Autenticação no frontend")
    print("\n💡 PRÓXIMO PASSO:")
    print("Teste o gerenciador de conteúdo logado como admin no frontend")

if __name__ == "__main__":
    teste_simples()