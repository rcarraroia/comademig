#!/usr/bin/env python3

import os
from supabase import create_client, Client

# Configuração do Supabase
url = "https://amkelczfwazutrciqtlk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(url, key)

def check_existing_pages():
    print("🔍 VERIFICANDO REGISTROS EXISTENTES...")
    print("=" * 50)
    
    pages = ['home', 'sobre', 'lideranca', 'contato']
    existing_pages = []
    missing_pages = []
    
    for page in pages:
        try:
            result = supabase.table('content_management').select('*').eq('page_name', page).execute()
            if result.data:
                print(f"✅ {page}: Registro existe (ID: {result.data[0]['id']})")
                existing_pages.append(page)
            else:
                print(f"❌ {page}: Registro NÃO existe")
                missing_pages.append(page)
        except Exception as e:
            print(f"❌ {page}: Erro - {e}")
            missing_pages.append(page)
    
    return existing_pages, missing_pages

if __name__ == "__main__":
    existing, missing = check_existing_pages()
    
    print(f"\n📊 RESUMO:")
    print(f"✅ Páginas existentes: {len(existing)} - {existing}")
    print(f"❌ Páginas faltando: {len(missing)} - {missing}")