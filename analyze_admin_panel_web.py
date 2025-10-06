#!/usr/bin/env python3
"""
Análise Técnica do Painel Administrativo COMADEMIG
Baseado no método de acesso direto usado para Supabase
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse
import re

class AdminPanelAnalyzer:
    def __init__(self):
        self.base_url = "https://comademig.vercel.app"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.analysis_results = {
            'authentication': {},
            'dashboard_structure': {},
            'sidebar_menu': {},
            'components_analysis': {},
            'bugs_found': [],
            'admin_vs_user_issues': [],
            'recommendations': []
        }

    def login(self, email, password):
        """Realiza login no sistema"""
        print("🔐 Iniciando processo de login...")
        
        try:
            # Tentar diferentes URLs de login
            login_urls = [
                f"{self.base_url}/auth",
                f"{self.base_url}/login", 
                f"{self.base_url}/signin",
                f"{self.base_url}/"
            ]
            
            response = None
            working_url = None
            
            for url in login_urls:
                print(f"🔍 Tentando acessar: {url}")
                response = self.session.get(url)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    working_url = url
                    print(f"✅ Página encontrada: {url}")
                    break
            
            if not working_url:
                print("❌ Nenhuma página de login encontrada")
                return False
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Procurar formulário de login
            login_form = soup.find('form')
            if not login_form:
                print("❌ Formulário de login não encontrado")
                return False
            
            # Extrair dados do formulário
            form_data = {
                'email': email,
                'password': password
            }
            
            # Procurar campos CSRF ou tokens
            csrf_token = soup.find('input', {'name': 'csrf_token'})
            if csrf_token:
                form_data['csrf_token'] = csrf_token.get('value')
            
            # Tentar login via POST
            login_response = self.session.post(login_url, data=form_data)
            
            # Verificar se login foi bem-sucedido
            if 'dashboard' in login_response.url or login_response.status_code == 200:
                print("✅ Login realizado com sucesso")
                self.analysis_results['authentication']['status'] = 'success'
                self.analysis_results['authentication']['redirect_url'] = login_response.url
                return True
            else:
                print(f"❌ Falha no login: {login_response.status_code}")
                self.analysis_results['authentication']['status'] = 'failed'
                return False
                
        except Exception as e:
            print(f"❌ Erro durante login: {str(e)}")
            self.analysis_results['authentication']['error'] = str(e)
            return False

    def analyze_dashboard_structure(self):
        """Analisa a estrutura do dashboard administrativo"""
        print("📊 Analisando estrutura do dashboard...")
        
        try:
            # Tentar acessar dashboard
            dashboard_urls = [
                f"{self.base_url}/dashboard",
                f"{self.base_url}/admin",
                f"{self.base_url}/dashboard/admin"
            ]
            
            for url in dashboard_urls:
                response = self.session.get(url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Analisar estrutura HTML
                    self.analysis_results['dashboard_structure'] = {
                        'url': url,
                        'title': soup.find('title').text if soup.find('title') else 'N/A',
                        'main_containers': len(soup.find_all(['main', 'div'], class_=re.compile(r'dashboard|admin|panel'))),
                        'sidebar_present': bool(soup.find(['aside', 'nav', 'div'], class_=re.compile(r'sidebar|nav|menu'))),
                        'header_present': bool(soup.find(['header', 'div'], class_=re.compile(r'header|top|navbar'))),
                        'content_area': bool(soup.find(['main', 'div'], class_=re.compile(r'content|main|body')))
                    }
                    
                    print(f"✅ Dashboard encontrado em: {url}")
                    return soup
            
            print("❌ Dashboard não encontrado em nenhuma URL")
            return None
            
        except Exception as e:
            print(f"❌ Erro ao analisar dashboard: {str(e)}")
            self.analysis_results['dashboard_structure']['error'] = str(e)
            return None

    def analyze_sidebar_menu(self, soup):
        """Analisa o menu lateral e suas inconsistências"""
        print("📋 Analisando menu lateral...")
        
        try:
            # Procurar sidebar
            sidebar_selectors = [
                'aside',
                '[class*="sidebar"]',
                '[class*="nav"]',
                '[class*="menu"]'
            ]
            
            sidebar = None
            for selector in sidebar_selectors:
                sidebar = soup.select_one(selector)
                if sidebar:
                    break
            
            if not sidebar:
                print("❌ Sidebar não encontrada")
                return
            
            # Extrair itens do menu
            menu_items = []
            links = sidebar.find_all('a')
            
            for link in links:
                item = {
                    'text': link.get_text(strip=True),
                    'href': link.get('href', ''),
                    'classes': link.get('class', []),
                    'icon': bool(link.find(['i', 'svg', 'span'], class_=re.compile(r'icon|fa-|lucide')))
                }
                menu_items.append(item)
            
            # Categorizar itens (admin vs usuário)
            admin_keywords = ['admin', 'manage', 'config', 'settings', 'users', 'reports', 'analytics']
            user_keywords = ['profile', 'account', 'my', 'personal', 'carteira', 'certidao']
            
            admin_items = []
            user_items = []
            unclear_items = []
            
            for item in menu_items:
                text_lower = item['text'].lower()
                href_lower = item['href'].lower()
                
                is_admin = any(keyword in text_lower or keyword in href_lower for keyword in admin_keywords)
                is_user = any(keyword in text_lower or keyword in href_lower for keyword in user_keywords)
                
                if is_admin:
                    admin_items.append(item)
                elif is_user:
                    user_items.append(item)
                else:
                    unclear_items.append(item)
            
            self.analysis_results['sidebar_menu'] = {
                'total_items': len(menu_items),
                'admin_items': admin_items,
                'user_items': user_items,
                'unclear_items': unclear_items,
                'all_items': menu_items
            }
            
            # Identificar problemas
            if len(user_items) > 0:
                self.analysis_results['admin_vs_user_issues'].append({
                    'type': 'mixed_menu_items',
                    'description': 'Menu administrativo contém itens de usuário',
                    'items': user_items
                })
            
            print(f"✅ Menu analisado: {len(menu_items)} itens encontrados")
            
        except Exception as e:
            print(f"❌ Erro ao analisar sidebar: {str(e)}")
            self.analysis_results['sidebar_menu']['error'] = str(e)

    def analyze_components(self, soup):
        """Analisa componentes e identifica possíveis bugs"""
        print("🔍 Analisando componentes...")
        
        try:
            # Procurar por indicadores de erro
            error_indicators = [
                soup.find_all(text=re.compile(r'error|erro|404|500|undefined|null', re.I)),
                soup.find_all(['div', 'span'], class_=re.compile(r'error|alert|warning')),
                soup.find_all(['button', 'a'], {'disabled': True}),
                soup.find_all(['img'], {'src': re.compile(r'placeholder|missing|error')})
            ]
            
            bugs_found = []
            
            # Verificar elementos quebrados
            broken_images = soup.find_all('img', {'src': ''})
            if broken_images:
                bugs_found.append({
                    'type': 'broken_images',
                    'count': len(broken_images),
                    'description': 'Imagens com src vazio'
                })
            
            # Verificar links quebrados
            empty_links = soup.find_all('a', {'href': ['', '#', 'javascript:void(0)']})
            if empty_links:
                bugs_found.append({
                    'type': 'empty_links',
                    'count': len(empty_links),
                    'description': 'Links vazios ou não funcionais'
                })
            
            # Verificar formulários sem action
            forms_no_action = soup.find_all('form', {'action': ''})
            if forms_no_action:
                bugs_found.append({
                    'type': 'forms_no_action',
                    'count': len(forms_no_action),
                    'description': 'Formulários sem action definido'
                })
            
            # Verificar botões sem funcionalidade
            buttons_no_onclick = soup.find_all('button', {'onclick': ''})
            if buttons_no_onclick:
                bugs_found.append({
                    'type': 'buttons_no_function',
                    'count': len(buttons_no_onclick),
                    'description': 'Botões sem funcionalidade definida'
                })
            
            self.analysis_results['bugs_found'] = bugs_found
            self.analysis_results['components_analysis'] = {
                'total_forms': len(soup.find_all('form')),
                'total_buttons': len(soup.find_all('button')),
                'total_links': len(soup.find_all('a')),
                'total_images': len(soup.find_all('img')),
                'javascript_errors': len(soup.find_all(text=re.compile(r'javascript.*error', re.I)))
            }
            
            print(f"✅ Componentes analisados: {len(bugs_found)} problemas encontrados")
            
        except Exception as e:
            print(f"❌ Erro ao analisar componentes: {str(e)}")
            self.analysis_results['components_analysis']['error'] = str(e)

    def generate_recommendations(self):
        """Gera recomendações baseadas na análise"""
        print("💡 Gerando recomendações...")
        
        recommendations = []
        
        # Recomendações baseadas no menu
        if self.analysis_results['sidebar_menu'].get('user_items'):
            recommendations.append({
                'priority': 'high',
                'category': 'menu_structure',
                'issue': 'Menu administrativo contém itens de usuário',
                'recommendation': 'Separar completamente funcionalidades administrativas das de usuário'
            })
        
        # Recomendações baseadas em bugs
        for bug in self.analysis_results['bugs_found']:
            if bug['type'] == 'broken_images':
                recommendations.append({
                    'priority': 'medium',
                    'category': 'ui_bugs',
                    'issue': f"{bug['count']} imagens quebradas",
                    'recommendation': 'Corrigir src das imagens ou implementar fallback'
                })
        
        self.analysis_results['recommendations'] = recommendations

    def save_report(self):
        """Salva relatório da análise"""
        report_file = 'admin_panel_analysis_report.json'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {report_file}")

    def run_analysis(self, email, password):
        """Executa análise completa"""
        print("🚀 Iniciando análise técnica do painel administrativo...")
        print("=" * 60)
        
        # 1. Login
        if not self.login(email, password):
            print("❌ Não foi possível fazer login. Análise interrompida.")
            return False
        
        # 2. Analisar estrutura do dashboard
        soup = self.analyze_dashboard_structure()
        if not soup:
            print("❌ Não foi possível acessar dashboard. Análise limitada.")
            return False
        
        # 3. Analisar menu lateral
        self.analyze_sidebar_menu(soup)
        
        # 4. Analisar componentes
        self.analyze_components(soup)
        
        # 5. Gerar recomendações
        self.generate_recommendations()
        
        # 6. Salvar relatório
        self.save_report()
        
        print("=" * 60)
        print("✅ Análise concluída com sucesso!")
        return True

def main():
    """Função principal"""
    analyzer = AdminPanelAnalyzer()
    
    # Credenciais fornecidas
    email = "rcarrarocoach@gmail.com"
    password = "M&151173c@"
    
    # Executar análise
    success = analyzer.run_analysis(email, password)
    
    if success:
        print("\n📊 RESUMO DA ANÁLISE:")
        print("-" * 40)
        
        # Mostrar problemas encontrados
        bugs = analyzer.analysis_results.get('bugs_found', [])
        if bugs:
            print(f"🐛 Bugs encontrados: {len(bugs)}")
            for bug in bugs:
                print(f"  - {bug['description']}: {bug['count']} ocorrências")
        
        # Mostrar problemas admin vs usuário
        admin_issues = analyzer.analysis_results.get('admin_vs_user_issues', [])
        if admin_issues:
            print(f"⚠️ Problemas admin/usuário: {len(admin_issues)}")
            for issue in admin_issues:
                print(f"  - {issue['description']}")
        
        # Mostrar recomendações
        recommendations = analyzer.analysis_results.get('recommendations', [])
        if recommendations:
            print(f"💡 Recomendações: {len(recommendations)}")
            for rec in recommendations:
                print(f"  - [{rec['priority']}] {rec['recommendation']}")

if __name__ == "__main__":
    main()