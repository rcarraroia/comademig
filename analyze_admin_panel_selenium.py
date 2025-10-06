#!/usr/bin/env python3
"""
Análise Técnica do Painel Administrativo COMADEMIG usando Selenium
Para lidar com SPAs e JavaScript
"""

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service
except ImportError:
    print("❌ Dependências não instaladas. Tentando instalar...")
    import subprocess
    subprocess.check_call(["pip", "install", "selenium", "webdriver-manager"])
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service

import json
import time
import re
from datetime import datetime

class AdminPanelSeleniumAnalyzer:
    def __init__(self):
        self.base_url = "https://comademig.vercel.app"
        self.driver = None
        self.wait = None
        self.analysis_results = {
            'timestamp': datetime.now().isoformat(),
            'authentication': {},
            'dashboard_structure': {},
            'sidebar_menu': {},
            'components_analysis': {},
            'bugs_found': [],
            'admin_vs_user_issues': [],
            'recommendations': [],
            'screenshots': []
        }

    def setup_driver(self):
        """Configura o driver do Selenium"""
        print("🔧 Configurando driver do Selenium...")
        
        try:
            chrome_options = Options()
            # Remover headless para ver o que está acontecendo
            # chrome_options.add_argument('--headless')  
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # Usar webdriver-manager para baixar automaticamente o ChromeDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Remover indicadores de automação
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            self.wait = WebDriverWait(self.driver, 15)
            
            print("✅ Driver configurado com sucesso")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar driver: {str(e)}")
            return False

    def login(self, email, password):
        """Realiza login no sistema"""
        print("🔐 Iniciando processo de login...")
        
        try:
            # Acessar página inicial
            print(f"🌐 Acessando: {self.base_url}")
            self.driver.get(self.base_url)
            
            # Aguardar carregamento
            time.sleep(3)
            
            # Tirar screenshot da página inicial
            self.driver.save_screenshot("screenshot_inicial.png")
            print("📸 Screenshot inicial salvo")
            
            # Procurar por botão de login ou link para auth
            login_selectors = [
                "//a[contains(text(), 'Login')]",
                "//a[contains(text(), 'Entrar')]",
                "//button[contains(text(), 'Login')]",
                "//button[contains(text(), 'Entrar')]",
                "//a[@href='/auth']",
                "//a[@href='/login']"
            ]
            
            login_element = None
            for selector in login_selectors:
                try:
                    login_element = self.driver.find_element(By.XPATH, selector)
                    if login_element:
                        print(f"✅ Botão de login encontrado: {selector}")
                        break
                except NoSuchElementException:
                    continue
            
            if login_element:
                login_element.click()
                time.sleep(2)
            else:
                # Tentar acessar diretamente /auth
                auth_url = f"{self.base_url}/auth"
                print(f"🔍 Tentando acessar diretamente: {auth_url}")
                self.driver.get(auth_url)
                time.sleep(3)
            
            # Tirar screenshot da página de login
            self.driver.save_screenshot("screenshot_login.png")
            print("📸 Screenshot da página de login salvo")
            
            # Procurar campos de email e senha
            email_selectors = [
                "input[type='email']",
                "input[name='email']",
                "input[placeholder*='email']",
                "#email"
            ]
            
            password_selectors = [
                "input[type='password']",
                "input[name='password']", 
                "input[placeholder*='senha']",
                "#password"
            ]
            
            email_field = None
            password_field = None
            
            # Encontrar campo de email
            for selector in email_selectors:
                try:
                    email_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if email_field:
                        print(f"✅ Campo de email encontrado: {selector}")
                        break
                except NoSuchElementException:
                    continue
            
            # Encontrar campo de senha
            for selector in password_selectors:
                try:
                    password_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if password_field:
                        print(f"✅ Campo de senha encontrado: {selector}")
                        break
                except NoSuchElementException:
                    continue
            
            if not email_field or not password_field:
                print("❌ Campos de login não encontrados")
                # Analisar o que está na página
                page_source = self.driver.page_source
                print("📄 Analisando conteúdo da página...")
                
                if "login" in page_source.lower() or "auth" in page_source.lower():
                    print("🔍 Página contém elementos de login")
                else:
                    print("❌ Página não parece ser de login")
                
                return False
            
            # Preencher campos
            print("✏️ Preenchendo credenciais...")
            email_field.clear()
            email_field.send_keys(email)
            
            password_field.clear()
            password_field.send_keys(password)
            
            # Procurar botão de submit
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button:contains('Entrar')",
                "button:contains('Login')",
                ".login-button",
                ".submit-button"
            ]
            
            submit_button = None
            for selector in submit_selectors:
                try:
                    submit_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if submit_button:
                        print(f"✅ Botão de submit encontrado: {selector}")
                        break
                except NoSuchElementException:
                    continue
            
            if submit_button:
                submit_button.click()
                print("🔄 Login enviado...")
                
                # Aguardar mais tempo e verificar mudanças na página
                time.sleep(8)
                
                current_url = self.driver.current_url
                print(f"📍 URL atual após login: {current_url}")
                
                # Verificar se há elementos que indicam login bem-sucedido
                success_indicators = [
                    # Procurar por elementos que aparecem após login
                    self.driver.find_elements(By.XPATH, "//text()[contains(., 'Dashboard')]"),
                    self.driver.find_elements(By.XPATH, "//text()[contains(., 'Painel')]"),
                    self.driver.find_elements(By.XPATH, "//text()[contains(., 'Admin')]"),
                    self.driver.find_elements(By.CSS_SELECTOR, "[class*='dashboard']"),
                    self.driver.find_elements(By.CSS_SELECTOR, "[class*='sidebar']"),
                    self.driver.find_elements(By.CSS_SELECTOR, "[class*='admin']"),
                    # Procurar por botão de logout
                    self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Sair')]"),
                    self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout')]")
                ]
                
                has_success_indicators = any(len(indicator) > 0 for indicator in success_indicators)
                
                # Verificar se não há mais formulário de login
                login_forms = self.driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
                no_login_form = len(login_forms) == 0
                
                # Tirar screenshot após login
                self.driver.save_screenshot("screenshot_pos_login.png")
                print("📸 Screenshot pós-login salvo")
                
                if has_success_indicators or no_login_form or 'dashboard' in current_url:
                    print("✅ Login realizado com sucesso!")
                    self.analysis_results['authentication']['status'] = 'success'
                    self.analysis_results['authentication']['redirect_url'] = current_url
                    self.analysis_results['authentication']['success_indicators'] = sum(len(indicator) for indicator in success_indicators)
                    return True
                else:
                    print("❌ Login pode ter falhado")
                    # Verificar se há mensagem de erro
                    error_messages = self.driver.find_elements(By.XPATH, "//text()[contains(., 'erro') or contains(., 'inválid') or contains(., 'incorret')]")
                    if error_messages:
                        print(f"⚠️ Possível erro de login detectado: {len(error_messages)} mensagens")
                    return False
            else:
                print("❌ Botão de submit não encontrado")
                return False
                
        except Exception as e:
            print(f"❌ Erro durante login: {str(e)}")
            self.analysis_results['authentication']['error'] = str(e)
            return False

    def analyze_dashboard_structure(self):
        """Analisa a estrutura do dashboard"""
        print("📊 Analisando estrutura do dashboard...")
        
        try:
            # Tirar screenshot do dashboard
            self.driver.save_screenshot("screenshot_dashboard.png")
            print("📸 Screenshot do dashboard salvo")
            
            # Analisar elementos principais
            page_title = self.driver.title
            current_url = self.driver.current_url
            
            # Procurar elementos estruturais
            sidebar = self.driver.find_elements(By.CSS_SELECTOR, "aside, [class*='sidebar'], nav[class*='side']")
            header = self.driver.find_elements(By.CSS_SELECTOR, "header, [class*='header'], [class*='navbar']")
            main_content = self.driver.find_elements(By.CSS_SELECTOR, "main, [class*='content'], [class*='main']")
            
            self.analysis_results['dashboard_structure'] = {
                'title': page_title,
                'url': current_url,
                'sidebar_present': len(sidebar) > 0,
                'sidebar_count': len(sidebar),
                'header_present': len(header) > 0,
                'header_count': len(header),
                'main_content_present': len(main_content) > 0,
                'main_content_count': len(main_content)
            }
            
            print(f"✅ Estrutura analisada - Sidebar: {len(sidebar)}, Header: {len(header)}, Main: {len(main_content)}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao analisar estrutura: {str(e)}")
            self.analysis_results['dashboard_structure']['error'] = str(e)
            return False

    def analyze_sidebar_menu(self):
        """Analisa o menu lateral"""
        print("📋 Analisando menu lateral...")
        
        try:
            # Procurar sidebar
            sidebar_selectors = [
                "aside",
                "[class*='sidebar']",
                "nav[class*='side']",
                "[class*='navigation']"
            ]
            
            sidebar = None
            for selector in sidebar_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    sidebar = elements[0]
                    print(f"✅ Sidebar encontrada: {selector}")
                    break
            
            if not sidebar:
                print("❌ Sidebar não encontrada")
                return False
            
            # Extrair links do menu
            menu_links = sidebar.find_elements(By.TAG_NAME, "a")
            menu_items = []
            
            for link in menu_links:
                try:
                    item = {
                        'text': link.text.strip(),
                        'href': link.get_attribute('href'),
                        'classes': link.get_attribute('class'),
                        'visible': link.is_displayed(),
                        'enabled': link.is_enabled()
                    }
                    menu_items.append(item)
                except Exception as e:
                    print(f"⚠️ Erro ao processar link: {str(e)}")
            
            # Categorizar itens
            admin_keywords = ['admin', 'manage', 'config', 'settings', 'users', 'reports', 'analytics', 'gestão', 'configuração']
            user_keywords = ['profile', 'account', 'my', 'personal', 'carteira', 'certidao', 'perfil', 'minha']
            
            admin_items = []
            user_items = []
            unclear_items = []
            
            for item in menu_items:
                text_lower = item['text'].lower()
                href_lower = (item['href'] or '').lower()
                
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
                    'count': len(user_items),
                    'items': [item['text'] for item in user_items]
                })
            
            print(f"✅ Menu analisado: {len(menu_items)} itens ({len(admin_items)} admin, {len(user_items)} usuário)")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao analisar menu: {str(e)}")
            self.analysis_results['sidebar_menu']['error'] = str(e)
            return False

    def analyze_components(self):
        """Analisa componentes e identifica bugs"""
        print("🔍 Analisando componentes...")
        
        try:
            bugs_found = []
            
            # Verificar imagens quebradas
            images = self.driver.find_elements(By.TAG_NAME, "img")
            broken_images = []
            
            for img in images:
                src = img.get_attribute('src')
                if not src or src == '' or 'placeholder' in src.lower():
                    broken_images.append(src)
            
            if broken_images:
                bugs_found.append({
                    'type': 'broken_images',
                    'count': len(broken_images),
                    'description': 'Imagens com src vazio ou placeholder'
                })
            
            # Verificar links vazios
            links = self.driver.find_elements(By.TAG_NAME, "a")
            empty_links = []
            
            for link in links:
                href = link.get_attribute('href')
                if not href or href in ['', '#', 'javascript:void(0)']:
                    empty_links.append(link.text)
            
            if empty_links:
                bugs_found.append({
                    'type': 'empty_links',
                    'count': len(empty_links),
                    'description': 'Links vazios ou não funcionais'
                })
            
            # Verificar botões desabilitados
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            disabled_buttons = []
            
            for button in buttons:
                if not button.is_enabled():
                    disabled_buttons.append(button.text)
            
            if disabled_buttons:
                bugs_found.append({
                    'type': 'disabled_buttons',
                    'count': len(disabled_buttons),
                    'description': 'Botões desabilitados'
                })
            
            # Verificar erros de JavaScript no console
            logs = self.driver.get_log('browser')
            js_errors = [log for log in logs if log['level'] == 'SEVERE']
            
            if js_errors:
                bugs_found.append({
                    'type': 'javascript_errors',
                    'count': len(js_errors),
                    'description': 'Erros de JavaScript no console'
                })
            
            self.analysis_results['bugs_found'] = bugs_found
            self.analysis_results['components_analysis'] = {
                'total_images': len(images),
                'total_links': len(links),
                'total_buttons': len(buttons),
                'broken_images': len(broken_images),
                'empty_links': len(empty_links),
                'disabled_buttons': len(disabled_buttons),
                'js_errors': len(js_errors)
            }
            
            print(f"✅ Componentes analisados: {len(bugs_found)} tipos de problemas encontrados")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao analisar componentes: {str(e)}")
            self.analysis_results['components_analysis']['error'] = str(e)
            return False

    def generate_recommendations(self):
        """Gera recomendações"""
        print("💡 Gerando recomendações...")
        
        recommendations = []
        
        # Recomendações baseadas no menu
        admin_issues = self.analysis_results.get('admin_vs_user_issues', [])
        for issue in admin_issues:
            if issue['type'] == 'mixed_menu_items':
                recommendations.append({
                    'priority': 'high',
                    'category': 'menu_structure',
                    'issue': f"Menu administrativo contém {issue['count']} itens de usuário",
                    'recommendation': 'Separar completamente funcionalidades administrativas das de usuário',
                    'items_affected': issue['items']
                })
        
        # Recomendações baseadas em bugs
        bugs = self.analysis_results.get('bugs_found', [])
        for bug in bugs:
            if bug['type'] == 'broken_images':
                recommendations.append({
                    'priority': 'medium',
                    'category': 'ui_bugs',
                    'issue': f"{bug['count']} imagens quebradas",
                    'recommendation': 'Corrigir src das imagens ou implementar fallback'
                })
            elif bug['type'] == 'javascript_errors':
                recommendations.append({
                    'priority': 'high',
                    'category': 'functionality_bugs',
                    'issue': f"{bug['count']} erros de JavaScript",
                    'recommendation': 'Corrigir erros de JavaScript que podem afetar funcionalidade'
                })
        
        self.analysis_results['recommendations'] = recommendations
        print(f"✅ {len(recommendations)} recomendações geradas")

    def save_report(self):
        """Salva relatório"""
        report_file = 'admin_panel_selenium_report.json'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Relatório salvo em: {report_file}")

    def cleanup(self):
        """Limpa recursos"""
        if self.driver:
            self.driver.quit()
            print("🧹 Driver fechado")

    def run_analysis(self, email, password):
        """Executa análise completa"""
        print("🚀 Iniciando análise técnica do painel administrativo com Selenium...")
        print("=" * 70)
        
        try:
            # 1. Configurar driver
            if not self.setup_driver():
                return False
            
            # 2. Tentar login
            login_success = self.login(email, password)
            if not login_success:
                print("⚠️ Login falhou, mas continuando análise da página atual...")
            
            # 3. Analisar estrutura (independente do login)
            self.analyze_dashboard_structure()
            
            # 4. Analisar menu
            self.analyze_sidebar_menu()
            
            # 5. Analisar componentes
            self.analyze_components()
            
            # 6. Gerar recomendações
            self.generate_recommendations()
            
            # 7. Salvar relatório
            self.save_report()
            
            print("=" * 70)
            if login_success:
                print("✅ Análise concluída com sucesso!")
            else:
                print("⚠️ Análise concluída com limitações (login falhou)")
            return True
            
        except Exception as e:
            print(f"❌ Erro durante análise: {str(e)}")
            return False
        finally:
            self.cleanup()

def main():
    """Função principal"""
    analyzer = AdminPanelSeleniumAnalyzer()
    
    # Credenciais
    email = "rcarrarocoach@gmail.com"
    password = "M&151173c@"
    
    # Executar análise
    success = analyzer.run_analysis(email, password)
    
    if success:
        print("\n📊 RESUMO DA ANÁLISE:")
        print("-" * 50)
        
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
                print(f"  - {issue['description']}: {issue.get('count', 0)} itens")
        
        # Mostrar recomendações
        recommendations = analyzer.analysis_results.get('recommendations', [])
        if recommendations:
            print(f"💡 Recomendações: {len(recommendations)}")
            for rec in recommendations:
                print(f"  - [{rec['priority']}] {rec['recommendation']}")

if __name__ == "__main__":
    main()