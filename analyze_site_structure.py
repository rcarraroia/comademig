#!/usr/bin/env python3
"""
Análise da estrutura do site COMADEMIG para identificar como acessar o painel administrativo
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse

class SiteStructureAnalyzer:
    def __init__(self):
        self.base_url = "https://comademig.vercel.app"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.found_urls = set()
        self.analysis_results = {
            'site_structure': {},
            'authentication_methods': [],
            'admin_access_points': [],
            'navigation_structure': {},
            'forms_found': [],
            'spa_detection': {}
        }

    def analyze_homepage(self):
        """Analisa a página inicial"""
        print("🏠 Analisando página inicial...")
        
        try:
            response = self.session.get(self.base_url)
            if response.status_code != 200:
                print(f"❌ Erro ao acessar homepage: {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Detectar se é SPA
            react_indicators = [
                soup.find('div', {'id': 'root'}),
                soup.find('div', {'id': 'app'}),
                soup.find_all('script', src=re.compile(r'react|bundle|app\.js')),
                'React' in response.text,
                'ReactDOM' in response.text
            ]
            
            is_spa = any(react_indicators)
            
            self.analysis_results['spa_detection'] = {
                'is_spa': is_spa,
                'react_root': bool(soup.find('div', {'id': 'root'})),
                'bundle_scripts': len(soup.find_all('script', src=re.compile(r'bundle|app\.js'))),
                'react_mentions': response.text.count('React')
            }
            
            # Procurar links de navegação
            nav_links = []
            all_links = soup.find_all('a', href=True)
            
            for link in all_links:
                href = link.get('href')
                text = link.get_text(strip=True)
                
                # Filtrar links relevantes
                if href and (href.startswith('/') or self.base_url in href):
                    nav_links.append({
                        'text': text,
                        'href': href,
                        'full_url': urljoin(self.base_url, href)
                    })
                    self.found_urls.add(urljoin(self.base_url, href))
            
            # Procurar formulários
            forms = soup.find_all('form')
            forms_data = []
            
            for form in forms:
                form_data = {
                    'action': form.get('action', ''),
                    'method': form.get('method', 'GET'),
                    'inputs': []
                }
                
                inputs = form.find_all(['input', 'select', 'textarea'])
                for inp in inputs:
                    form_data['inputs'].append({
                        'type': inp.get('type', inp.name),
                        'name': inp.get('name', ''),
                        'placeholder': inp.get('placeholder', ''),
                        'required': inp.has_attr('required')
                    })
                
                forms_data.append(form_data)
            
            # Procurar indicadores de autenticação
            auth_indicators = []
            
            auth_keywords = ['login', 'entrar', 'signin', 'auth', 'dashboard', 'admin', 'painel']
            for keyword in auth_keywords:
                elements = soup.find_all(text=re.compile(keyword, re.I))
                if elements:
                    auth_indicators.append({
                        'keyword': keyword,
                        'occurrences': len(elements),
                        'contexts': [elem.strip() for elem in elements[:3]]  # Primeiros 3
                    })
            
            self.analysis_results['site_structure'] = {
                'title': soup.find('title').text if soup.find('title') else 'N/A',
                'nav_links_count': len(nav_links),
                'forms_count': len(forms),
                'auth_indicators': auth_indicators
            }
            
            self.analysis_results['navigation_structure'] = nav_links
            self.analysis_results['forms_found'] = forms_data
            
            print(f"✅ Homepage analisada: {len(nav_links)} links, {len(forms)} formulários")
            print(f"🔍 SPA detectado: {is_spa}")
            
            return soup
            
        except Exception as e:
            print(f"❌ Erro ao analisar homepage: {str(e)}")
            return None

    def discover_admin_routes(self):
        """Tenta descobrir rotas administrativas"""
        print("🔍 Descobrindo rotas administrativas...")
        
        # Rotas comuns para testar
        admin_routes = [
            '/admin',
            '/dashboard',
            '/dashboard/admin',
            '/painel',
            '/painel-admin',
            '/auth',
            '/login',
            '/signin',
            '/app',
            '/app/admin',
            '/app/dashboard'
        ]
        
        accessible_routes = []
        
        for route in admin_routes:
            try:
                url = urljoin(self.base_url, route)
                response = self.session.get(url)
                
                status_info = {
                    'route': route,
                    'url': url,
                    'status_code': response.status_code,
                    'accessible': response.status_code == 200,
                    'redirect': response.url != url if hasattr(response, 'url') else False
                }
                
                if response.status_code == 200:
                    # Analisar conteúdo da página
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Procurar indicadores de painel admin
                    admin_indicators = [
                        bool(soup.find(text=re.compile(r'admin|dashboard|painel', re.I))),
                        bool(soup.find(['form'], action=re.compile(r'login|auth'))),
                        bool(soup.find(['input'], type='password')),
                        bool(soup.find(['div', 'section'], class_=re.compile(r'admin|dashboard')))
                    ]
                    
                    status_info['admin_indicators'] = sum(admin_indicators)
                    status_info['has_login_form'] = bool(soup.find(['input'], type='password'))
                    
                    accessible_routes.append(status_info)
                    print(f"✅ {route}: {response.status_code} - Indicadores admin: {sum(admin_indicators)}")
                else:
                    print(f"❌ {route}: {response.status_code}")
                
            except Exception as e:
                print(f"⚠️ Erro ao testar {route}: {str(e)}")
        
        self.analysis_results['admin_access_points'] = accessible_routes
        return accessible_routes

    def analyze_javascript_routes(self, soup):
        """Analisa rotas definidas em JavaScript (para SPAs)"""
        print("📜 Analisando rotas JavaScript...")
        
        try:
            # Procurar scripts
            scripts = soup.find_all('script')
            js_routes = []
            
            route_patterns = [
                r'["\']/(admin|dashboard|auth|login)[^"\']*["\']',
                r'path:\s*["\'][^"\']*["\']',
                r'route:\s*["\'][^"\']*["\']',
                r'to:\s*["\'][^"\']*["\']'
            ]
            
            for script in scripts:
                if script.string:
                    for pattern in route_patterns:
                        matches = re.findall(pattern, script.string, re.I)
                        for match in matches:
                            if isinstance(match, tuple):
                                match = match[0]
                            js_routes.append(match.strip('"\''))
            
            # Remover duplicatas e filtrar
            js_routes = list(set(js_routes))
            js_routes = [route for route in js_routes if route.startswith('/')]
            
            self.analysis_results['javascript_routes'] = js_routes
            print(f"✅ {len(js_routes)} rotas JavaScript encontradas")
            
            return js_routes
            
        except Exception as e:
            print(f"❌ Erro ao analisar JavaScript: {str(e)}")
            return []

    def test_authentication_methods(self):
        """Testa diferentes métodos de autenticação"""
        print("🔐 Testando métodos de autenticação...")
        
        auth_methods = []
        
        # Método 1: Formulário tradicional
        for route in ['/auth', '/login', '/']:
            try:
                url = urljoin(self.base_url, route)
                response = self.session.get(url)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Procurar formulário de login
                    login_forms = soup.find_all('form')
                    for form in login_forms:
                        inputs = form.find_all('input')
                        has_email = any(inp.get('type') == 'email' or 'email' in inp.get('name', '') for inp in inputs)
                        has_password = any(inp.get('type') == 'password' for inp in inputs)
                        
                        if has_email and has_password:
                            auth_methods.append({
                                'type': 'form_auth',
                                'url': url,
                                'method': form.get('method', 'POST'),
                                'action': form.get('action', ''),
                                'found_at': route
                            })
            
            except Exception as e:
                print(f"⚠️ Erro ao testar {route}: {str(e)}")
        
        # Método 2: API endpoints
        api_endpoints = [
            '/api/auth/login',
            '/api/login',
            '/auth/login',
            '/login'
        ]
        
        for endpoint in api_endpoints:
            try:
                url = urljoin(self.base_url, endpoint)
                response = self.session.post(url, json={'test': 'test'})
                
                if response.status_code != 404:
                    auth_methods.append({
                        'type': 'api_endpoint',
                        'url': url,
                        'status_code': response.status_code,
                        'response_type': response.headers.get('content-type', '')
                    })
            
            except Exception as e:
                continue
        
        self.analysis_results['authentication_methods'] = auth_methods
        print(f"✅ {len(auth_methods)} métodos de autenticação encontrados")
        
        return auth_methods

    def generate_access_strategy(self):
        """Gera estratégia de acesso ao painel administrativo"""
        print("🎯 Gerando estratégia de acesso...")
        
        strategy = {
            'recommended_approach': '',
            'steps': [],
            'tools_needed': [],
            'challenges': []
        }
        
        # Analisar resultados
        is_spa = self.analysis_results['spa_detection']['is_spa']
        auth_methods = self.analysis_results['authentication_methods']
        admin_routes = self.analysis_results['admin_access_points']
        
        if is_spa:
            strategy['recommended_approach'] = 'selenium_automation'
            strategy['tools_needed'] = ['Selenium WebDriver', 'Chrome/Firefox']
            strategy['steps'] = [
                '1. Usar Selenium para navegar até a página inicial',
                '2. Procurar botão/link de login na interface',
                '3. Preencher formulário de login automaticamente',
                '4. Aguardar redirecionamento para dashboard',
                '5. Analisar estrutura do painel administrativo'
            ]
            strategy['challenges'] = [
                'Necessita de browser real',
                'JavaScript deve estar habilitado',
                'Pode ter captcha ou proteções anti-bot'
            ]
        else:
            strategy['recommended_approach'] = 'requests_session'
            strategy['tools_needed'] = ['requests', 'BeautifulSoup']
            strategy['steps'] = [
                '1. Fazer GET na página de login',
                '2. Extrair tokens CSRF se necessário',
                '3. Fazer POST com credenciais',
                '4. Seguir redirecionamentos',
                '5. Analisar HTML do painel'
            ]
        
        # Adicionar rotas descobertas
        if admin_routes:
            accessible = [r for r in admin_routes if r['accessible']]
            if accessible:
                strategy['entry_points'] = [r['url'] for r in accessible]
        
        self.analysis_results['access_strategy'] = strategy
        return strategy

    def save_report(self):
        """Salva relatório completo"""
        report_file = 'site_structure_analysis.json'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {report_file}")

    def run_analysis(self):
        """Executa análise completa"""
        print("🚀 Iniciando análise da estrutura do site...")
        print("=" * 60)
        
        # 1. Analisar homepage
        soup = self.analyze_homepage()
        if not soup:
            return False
        
        # 2. Descobrir rotas administrativas
        self.discover_admin_routes()
        
        # 3. Analisar rotas JavaScript
        self.analyze_javascript_routes(soup)
        
        # 4. Testar métodos de autenticação
        self.test_authentication_methods()
        
        # 5. Gerar estratégia de acesso
        self.generate_access_strategy()
        
        # 6. Salvar relatório
        self.save_report()
        
        print("=" * 60)
        print("✅ Análise da estrutura concluída!")
        return True

def main():
    """Função principal"""
    analyzer = SiteStructureAnalyzer()
    
    success = analyzer.run_analysis()
    
    if success:
        print("\n📊 RESUMO DA ANÁLISE:")
        print("-" * 50)
        
        # SPA Detection
        spa_info = analyzer.analysis_results['spa_detection']
        print(f"🔍 Tipo de aplicação: {'SPA (React)' if spa_info['is_spa'] else 'Tradicional'}")
        
        # Rotas administrativas
        admin_routes = analyzer.analysis_results['admin_access_points']
        accessible = [r for r in admin_routes if r['accessible']]
        print(f"🚪 Rotas administrativas acessíveis: {len(accessible)}")
        for route in accessible:
            print(f"  - {route['route']}: {route['status_code']} (indicadores: {route.get('admin_indicators', 0)})")
        
        # Métodos de autenticação
        auth_methods = analyzer.analysis_results['authentication_methods']
        print(f"🔐 Métodos de autenticação: {len(auth_methods)}")
        for method in auth_methods:
            print(f"  - {method['type']}: {method['url']}")
        
        # Estratégia recomendada
        strategy = analyzer.analysis_results['access_strategy']
        print(f"🎯 Abordagem recomendada: {strategy['recommended_approach']}")
        print("📋 Próximos passos:")
        for step in strategy['steps']:
            print(f"  {step}")

if __name__ == "__main__":
    main()