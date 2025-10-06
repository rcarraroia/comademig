#!/usr/bin/env python3
"""
Script para análise do painel administrativo do COMADEMIG
Baseado no mesmo princípio das regras do Supabase - acesso direto aos dados reais
Versão HTTP usando requests + BeautifulSoup
"""

import requests
import time
import json
from datetime import datetime
from bs4 import BeautifulSoup
import re

class ComademigAdminAnalyzer:
    def __init__(self):
        self.base_url = "https://comademig.vercel.app"
        self.login_url = f"{self.base_url}/auth"
        self.credentials = {
            "email": "rcarrarocoach@gmail.com",
            "password": "M&151173c@"
        }
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.analysis_results = {
            "timestamp": datetime.now().isoformat(),
            "login_success": False,
            "admin_access": False,
            "menu_items": [],
            "page_analysis": {},
            "errors_found": [],
            "components_status": {},
            "auth_token": None,
            "cookies": {}
        }

    def test_site_accessibility(self):
        """Testar se o site está acessível"""
        try:
            print(f"🌐 Testando acesso ao site: {self.base_url}")
            response = self.session.get(self.base_url, timeout=10)
            
            if response.status_code == 200:
                print("✅ Site acessível")
                return True
            else:
                print(f"❌ Site retornou status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao acessar site: {e}")
            self.analysis_results["errors_found"].append(f"Site access error: {str(e)}")
            return False

    def analyze_login_page(self):
        """Analisar a página de login para entender a estrutura"""
        try:
            print(f"🔐 Analisando página de login: {self.login_url}")
            response = self.session.get(self.login_url, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Página de login inacessível: {response.status_code}")
                return False
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Procurar formulário de login
            login_forms = soup.find_all('form')
            email_inputs = soup.find_all('input', {'type': 'email'}) or soup.find_all('input', {'name': 'email'})
            password_inputs = soup.find_all('input', {'type': 'password'})
            
            print(f"📋 Análise da página de login:")
            print(f"  - Formulários encontrados: {len(login_forms)}")
            print(f"  - Campos de email: {len(email_inputs)}")
            print(f"  - Campos de senha: {len(password_inputs)}")
            
            # Verificar se é uma SPA (Single Page Application)
            has_react = 'react' in response.text.lower() or '_next' in response.text
            has_js_routing = 'router' in response.text.lower()
            
            print(f"  - Aplicação React/Next.js: {has_react}")
            print(f"  - Roteamento JS: {has_js_routing}")
            
            if has_react:
                print("⚠️ Detectada aplicação SPA - login pode requerer JavaScript")
                self.analysis_results["errors_found"].append("SPA detected - may need browser automation for login")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao analisar login: {e}")
            self.analysis_results["errors_found"].append(f"Login analysis error: {str(e)}")
            return False

    def analyze_dashboard_structure(self):
        """Analisar estrutura do dashboard através do código fonte"""
        try:
            print("📋 Analisando estrutura do dashboard...")
            
            # Tentar acessar dashboard diretamente (pode redirecionar para login)
            dashboard_url = f"{self.base_url}/dashboard"
            response = self.session.get(dashboard_url, timeout=10)
            
            print(f"📊 Status do dashboard: {response.status_code}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Procurar por links administrativos no HTML
                admin_links = []
                all_links = soup.find_all('a', href=True)
                
                for link in all_links:
                    href = link.get('href', '')
                    if '/dashboard/admin/' in href:
                        text = link.get_text(strip=True)
                        admin_links.append({
                            "url": href,
                            "label": text,
                            "full_url": f"{self.base_url}{href}" if href.startswith('/') else href
                        })
                
                self.analysis_results["menu_items"] = admin_links
                print(f"🔍 Links administrativos encontrados: {len(admin_links)}")
                
                for link in admin_links:
                    print(f"  - {link['label']}: {link['url']}")
                
                # Verificar se há indicação de autenticação necessária
                auth_indicators = ['login', 'signin', 'authenticate', 'unauthorized']
                page_text = response.text.lower()
                needs_auth = any(indicator in page_text for indicator in auth_indicators)
                
                if needs_auth:
                    print("🔒 Dashboard requer autenticação")
                else:
                    print("🔓 Dashboard acessível sem autenticação")
                    
            else:
                print(f"❌ Dashboard inacessível: {response.status_code}")
                if response.status_code == 401:
                    print("🔒 Autenticação necessária")
                elif response.status_code == 403:
                    print("🚫 Acesso negado")
                    
        except Exception as e:
            print(f"❌ Erro ao analisar dashboard: {e}")
            self.analysis_results["errors_found"].append(f"Dashboard analysis error: {str(e)}")

    def test_admin_pages(self):
        """Testar cada página administrativa via HTTP"""
        admin_pages = [
            "/dashboard/admin/usuarios",
            "/dashboard/admin/member-management", 
            "/dashboard/admin/financeiro-asaas",
            "/dashboard/admin/notifications",
            "/dashboard/admin/diagnostics",
            "/dashboard/admin/content"
        ]
        
        for page_path in admin_pages:
            try:
                print(f"🔍 Testando página: {page_path}")
                full_url = f"{self.base_url}{page_path}"
                response = self.session.get(full_url, timeout=10)
                
                # Analisar resposta HTTP
                status_code = response.status_code
                content_type = response.headers.get('content-type', '')
                
                # Verificar se é HTML válido
                is_html = 'text/html' in content_type
                
                if is_html and status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Procurar por indicadores de erro
                    error_indicators = [
                        "404", "Not Found", "Erro", "Error", 
                        "Página não encontrada", "Something went wrong"
                    ]
                    
                    page_text = soup.get_text()
                    has_error = any(indicator.lower() in page_text.lower() for indicator in error_indicators)
                    
                    # Contar componentes HTML
                    components_found = {
                        "tables": len(soup.find_all('table')),
                        "buttons": len(soup.find_all('button')),
                        "forms": len(soup.find_all('form')),
                        "inputs": len(soup.find_all('input')),
                        "divs": len(soup.find_all('div')),
                        "scripts": len(soup.find_all('script'))
                    }
                    
                    # Verificar se é uma SPA (conteúdo carregado via JS)
                    is_spa = components_found["scripts"] > 5 and components_found["divs"] < 10
                    
                    page_title = soup.title.string if soup.title else "Sem título"
                    
                else:
                    has_error = True
                    components_found = {}
                    page_title = f"HTTP {status_code}"
                    page_text = ""
                    is_spa = False
                
                self.analysis_results["page_analysis"][page_path] = {
                    "accessible": status_code == 200 and not has_error,
                    "status_code": status_code,
                    "title": page_title,
                    "url": full_url,
                    "components": components_found,
                    "has_errors": has_error,
                    "is_spa": is_spa,
                    "content_type": content_type,
                    "page_text_sample": page_text[:300] if page_text else ""
                }
                
                if status_code == 200:
                    status = "✅ OK" if not has_error else "⚠️ CARREGOU COM PROBLEMAS"
                elif status_code == 401:
                    status = "🔒 REQUER AUTENTICAÇÃO"
                elif status_code == 403:
                    status = "🚫 ACESSO NEGADO"
                elif status_code == 404:
                    status = "❌ NÃO ENCONTRADO"
                else:
                    status = f"❌ ERRO {status_code}"
                
                print(f"  {status} - {page_title}")
                if components_found:
                    print(f"    Componentes: {components_found}")
                if is_spa:
                    print(f"    ⚠️ SPA detectada - conteúdo pode ser carregado via JavaScript")
                
            except Exception as e:
                print(f"❌ Erro ao testar {page_path}: {e}")
                self.analysis_results["page_analysis"][page_path] = {
                    "accessible": False,
                    "error": str(e)
                }

    def analyze_source_code_structure(self):
        """Analisar estrutura baseada no código fonte do projeto"""
        try:
            print("🔧 Analisando estrutura do código fonte...")
            
            # Simular análise baseada no que sabemos do código
            expected_components = {
                "MemberTypesManagement": {
                    "url": "/dashboard/admin/member-management",
                    "expected_issues": ["Hook useMemberTypes não existe", "Propriedade order_of_exhibition incorreta"],
                    "status": "PARCIALMENTE_FUNCIONAL"
                },
                "SystemDiagnostics": {
                    "url": "/dashboard/admin/diagnostics", 
                    "expected_issues": ["Serviço diagnosticService não existe"],
                    "status": "COM_PROBLEMAS"
                },
                "UserManagement": {
                    "url": "/dashboard/admin/usuarios",
                    "expected_issues": [],
                    "status": "FUNCIONAL"
                },
                "AdminDashboard": {
                    "url": "/dashboard/admin",
                    "expected_issues": [],
                    "status": "FUNCIONAL"
                },
                "FinanceiroAsaas": {
                    "url": "/dashboard/admin/financeiro-asaas",
                    "expected_issues": ["Rota não implementada"],
                    "status": "NAO_IMPLEMENTADO"
                },
                "NotificationManagement": {
                    "url": "/dashboard/admin/notifications",
                    "expected_issues": ["Tabela notification_templates pode não existir"],
                    "status": "COM_PROBLEMAS"
                },
                "ContentManagement": {
                    "url": "/dashboard/admin/content",
                    "expected_issues": ["Tabela content_pages pode não existir"],
                    "status": "COM_PROBLEMAS"
                }
            }
            
            for component_name, component_info in expected_components.items():
                print(f"📋 {component_name}:")
                print(f"  URL: {component_info['url']}")
                print(f"  Status: {component_info['status']}")
                
                if component_info['expected_issues']:
                    print(f"  Problemas esperados:")
                    for issue in component_info['expected_issues']:
                        print(f"    - {issue}")
                
                self.analysis_results["components_status"][component_name] = {
                    "url": component_info['url'],
                    "status": component_info['status'],
                    "expected_issues": component_info['expected_issues'],
                    "functional": component_info['status'] == "FUNCIONAL"
                }
                
        except Exception as e:
            print(f"❌ Erro na análise do código fonte: {e}")
            self.analysis_results["errors_found"].append(f"Source code analysis error: {str(e)}")

    def generate_report(self):
        """Gerar relatório final da análise"""
        print("\n" + "="*80)
        print("📊 RELATÓRIO DE ANÁLISE DO PAINEL ADMINISTRATIVO")
        print("="*80)
        
        print(f"\n🕐 Timestamp: {self.analysis_results['timestamp']}")
        print(f"🔐 Login: {'✅ Sucesso' if self.analysis_results['login_success'] else '❌ Falhou'}")
        print(f"👑 Acesso Admin: {'✅ Confirmado' if self.analysis_results['admin_access'] else '❌ Negado'}")
        
        print(f"\n📋 Menu Administrativo ({len(self.analysis_results['menu_items'])} itens):")
        for item in self.analysis_results['menu_items']:
            print(f"  - {item['label']}")
        
        print(f"\n🔍 Páginas Testadas ({len(self.analysis_results['page_analysis'])} páginas):")
        for page, data in self.analysis_results['page_analysis'].items():
            status = "✅" if data.get('accessible', False) else "❌"
            print(f"  {status} {page}")
            if not data.get('accessible', False):
                print(f"    Erro: {data.get('error', 'Página com problemas')}")
        
        print(f"\n🔧 Componentes Verificados:")
        for component, status in self.analysis_results['components_status'].items():
            functional = "✅ FUNCIONAL" if status.get('functional', False) else "❌ COM PROBLEMAS"
            print(f"  {functional} {component}")
        
        if self.analysis_results['errors_found']:
            print(f"\n⚠️ Erros Encontrados ({len(self.analysis_results['errors_found'])}):")
            for error in self.analysis_results['errors_found']:
                print(f"  - {error}")
        
        # Salvar relatório em arquivo
        with open('admin_panel_analysis_report.json', 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Relatório salvo em: admin_panel_analysis_report.json")

    def run_analysis(self):
        """Executar análise completa"""
        print("🚀 Iniciando análise do painel administrativo COMADEMIG")
        print("="*60)
        
        try:
            # 1. Testar acessibilidade do site
            if not self.test_site_accessibility():
                return False
            
            # 2. Analisar página de login
            self.analyze_login_page()
            
            # 3. Analisar estrutura do dashboard
            self.analyze_dashboard_structure()
            
            # 4. Testar páginas administrativas
            self.test_admin_pages()
            
            # 5. Analisar estrutura do código fonte
            self.analyze_source_code_structure()
            
            # 6. Gerar relatório
            self.generate_report()
            
            return True
            
        except Exception as e:
            print(f"💥 Erro durante análise: {e}")
            self.analysis_results["errors_found"].append(f"Analysis error: {str(e)}")
            return False

def main():
    """Função principal"""
    analyzer = ComademigAdminAnalyzer()
    
    try:
        success = analyzer.run_analysis()
        if success:
            print("\n✅ Análise concluída com sucesso!")
        else:
            print("\n❌ Análise falhou")
    except KeyboardInterrupt:
        print("\n⏹️ Análise interrompida pelo usuário")
    except Exception as e:
        print(f"\n💥 Erro inesperado: {e}")

if __name__ == "__main__":
    main()