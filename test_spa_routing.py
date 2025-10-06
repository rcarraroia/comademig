#!/usr/bin/env python3
"""
Script para testar se o roteamento SPA foi corrigido
"""

import requests
import time

def test_spa_routing():
    """Testa se as rotas SPA estão funcionando"""
    base_url = "https://comademig.vercel.app"
    
    # Rotas para testar
    test_routes = [
        "/",
        "/dashboard",
        "/dashboard/admin/usuarios", 
        "/dashboard/admin/member-management",
        "/dashboard/admin/diagnostics",
        "/sobre",
        "/filiacao",
        "/auth"
    ]
    
    print("🧪 Testando roteamento SPA após correções...")
    print("=" * 60)
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    results = {}
    
    for route in test_routes:
        try:
            url = f"{base_url}{route}"
            print(f"🔍 Testando: {route}")
            
            response = session.get(url, timeout=10)
            
            # Verificar se retorna HTML (não 404)
            is_html = 'text/html' in response.headers.get('content-type', '')
            has_react_root = '<div id="root">' in response.text
            
            status = "✅ OK" if response.status_code == 200 and is_html and has_react_root else f"❌ {response.status_code}"
            
            results[route] = {
                'status_code': response.status_code,
                'is_html': is_html,
                'has_react_root': has_react_root,
                'success': response.status_code == 200 and is_html and has_react_root
            }
            
            print(f"  {status}")
            
            # Pequena pausa entre requests
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Erro: {str(e)}")
            results[route] = {
                'error': str(e),
                'success': False
            }
    
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    successful = sum(1 for r in results.values() if r.get('success', False))
    total = len(results)
    
    print(f"✅ Rotas funcionando: {successful}/{total}")
    
    if successful == total:
        print("🎉 SUCESSO! Todas as rotas SPA estão funcionando!")
        print("✅ O problema de 404 no botão voltar foi corrigido!")
    else:
        print("⚠️ Algumas rotas ainda têm problemas:")
        for route, result in results.items():
            if not result.get('success', False):
                error = result.get('error', f"Status: {result.get('status_code', 'unknown')}")
                print(f"  ❌ {route}: {error}")
    
    return successful == total

if __name__ == "__main__":
    test_spa_routing()