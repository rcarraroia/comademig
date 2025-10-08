#!/usr/bin/env python3
"""
Exploração ao vivo do painel administrativo COMADEMIG
Acesso real com navegação pelos menus e análise das páginas
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
    from selenium.webdriver.common.action_chains import ActionChains
except ImportError:
    print("❌ Instalando dependências...")
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
    from selenium.webdriver.common.action_chains import ActionChains

import json
import time
from datetime import datetime

class LiveAdminPanelExplorer:
    def __init__(self):
        self.base_url = "https://comademig.vercel.app"
        self.driver = None
        self.wait = None
        self.exploration_results = {
            'timestamp': datetime.now().isoformat(),
            'login_success': False,
            'menu_items_found': [],
            'pages_explored': {},
            'admin_features_found': [],
            'user_features_found': [],
            'broken_links': [],
            'functional_analysis': {},
            'screenshots_taken': []
        }

    def setup_driver(self):
        """Configura o driver do Selenium"""
        print("🔧 Configurando driver do Selenium...")
        
        try:
            chrome_options = Options()
            # Não usar headless para ver o que está acontecendo
            # chrome_options.add_argument('--headless')  
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
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
        print("🔐 Fazendo login no sistema...")
        
        try:
            # Acessar página inicial
            print(f"🌐 Acessando: {self.base_url}")
            self.driver.get(self.base_url)
            time.sleep(3)
            
            # Procurar botão de login
            login_selectors = [
                "//a[contains(text(), 'Login')]",
                "//a[contains(text(), 'Entrar')]",
                "//button[contains(text(), 'Login')]",
                "//button[contains(text(), 'Entrar')]",
                "//a[@href='/auth']"
            ]
            
            login_element = None
            for selector in login_selectors:
                try:
                    login_element = self.driver.find_element(By.XPATH, selector)
                    if login_element and login_element.is_displayed():
                        print(f"✅ Botão de login encontrado: {login_element.text}")
                        break
                except NoSuchElementException:
                    continue
            
            if login_element:
                login_element.click()
                time.sleep(3)
            else:
                # Tentar acessar diretamente /auth
                auth_url = f"{self.base_url}/auth"
                print(f"🔍 Acessando diretamente: {auth_url}")
                self.driver.get(auth_url)
                time.sleep(3)
            
            # Preencher formulário de login
            email_field = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
            password_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            
            print("✏️ Preenchendo credenciais...")
            email_field.clear()
            email_field.send_keys(email)
            
            password_field.clear()
            password_field.send_keys(password)
            
            # Submeter formulário
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_button.click()
            
            print("🔄 Aguardando login...")
            time.sleep(5)
            
            # Verificar se chegou ao dashboard
            current_url = self.driver.current_url
            print(f"📍 URL atual: {current_url}")
            
            if 'dashboard' in current_url:
                print("✅ Login realizado com sucesso!")
                self.exploration_results['login_success'] = True
                self.take_screenshot("login_success")
                return True
            else:
                print("❌ Login falhou")
                return False
                
        except Exception as e:
            print(f"❌ Erro durante login: {str(e)}")
            return False

    def extract_menu_items(self):
        """Extrai todos os itens do menu lateral"""
        print("📋 Extraindo itens do menu lateral...")
        
        try:
            # Procurar pelo menu lateral
            menu_items = []
            
            # Aguardar o menu carregar
            time.sleep(3)
            
            # Procurar links no menu
            menu_links = self.driver.find_elements(By.CSS_SELECTOR, "nav a, aside a, [class*='sidebar'] a")
            
            for link in menu_links:
                try:
                    href = link.get_attribute('href')
                    text = link.text.strip()
                    is_visible = link.is_displayed()
                    
                    if href and text and is_visible:
                        # Classificar o item
                        classification = self.classify_menu_item(href, text)
                        
                        menu_item = {
                            'text': text,
                            'href': href,
                            'classification': classification,
                            'is_visible': is_visible
                        }
                        
                        menu_items.append(menu_item)
                        print(f"  📌 {text} → {href} ({classification})")
                        
                except Exception as e:
                    continue
            
            self.exploration_results['menu_items_found'] = menu_items
            print(f"✅ {len(menu_items)} itens de menu encontrados")
            
            return menu_items
            
        except Exception as e:
            print(f"❌ Erro ao extrair menu: {str(e)}")
            return []

    def classify_menu_item(self, href, text):
        """Classifica um item de menu como admin, usuário ou misto"""
        
        admin_indicators = [
            '/admin/', 'gerenciar', 'gestão', 'administr', 'config', 'diagnóstico',
            'usuários', 'conteúdo', 'sistema'
        ]
        
        user_indicators = [
            'perfil', 'carteira', 'meus', 'minhas', 'afiliados', 'regularização',
            'financeiro', 'certidões', 'suporte'
        ]
        
        href_lower = href.lower()
        text_lower = text.lower()
        
        is_admin = any(indicator in href_lower or indicator in text_lower for indicator in admin_indicators)
        is_user = any(indicator in href_lower or indicator in text_lower for indicator in user_indicators)
        
        if is_admin and not is_user:
            return 'admin'
        elif is_user and not is_admin:
            return 'user'
        elif is_admin and is_user:
            return 'mixed'
        else:
            return 'unclear'

    def explore_page(self, menu_item):
        """Explora uma página específica"""
        print(f"🔍 Explorando: {menu_item['text']} ({menu_item['href']})")
        
        try:
            # Navegar para a página
            self.driver.get(menu_item['href'])
            time.sleep(4)
            
            # Analisar conteúdo da página
            page_analysis = {
                'url': menu_item['href'],
                'title': self.driver.title,
                'loaded_successfully': True,
                'has_forms': False,
                'has_tables': False,
                'has_buttons': False,
                'has_admin_features': False,
                'has_user_features': False,
                'error_messages': [],
                'main_content': '',
                'functionality_detected': []
            }
            
            # Verificar se a página carregou corretamente
            if "404" in self.driver.page_source or "Not Found" in self.driver.page_source:
                page_analysis['loaded_successfully'] = False
                page_analysis['error_messages'].append("Página não encontrada (404)")
                print(f"  ❌ Página não encontrada")
                return page_analysis
            
            # Analisar elementos da página
            forms = self.driver.find_elements(By.TAG_NAME, "form")
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            
            page_analysis['has_forms'] = len(forms) > 0
            page_analysis['has_tables'] = len(tables) > 0
            page_analysis['has_buttons'] = len(buttons) > 0
            
            # Procurar por funcionalidades específicas
            page_text = self.driver.page_source.lower()
            
            # Funcionalidades administrativas
            admin_features = [
                'gerenciar', 'administrar', 'configurar', 'deletar', 'remover',
                'aprovar', 'rejeitar', 'moderar', 'sistema', 'diagnóstico'
            ]
            
            # Funcionalidades de usuário
            user_features = [
                'meu perfil', 'meus dados', 'carteira', 'certificado', 'pagamento',
                'solicitar', 'baixar', 'visualizar', 'atualizar perfil'
            ]
            
            found_admin = [feature for feature in admin_features if feature in page_text]
            found_user = [feature for feature in user_features if feature in page_text]
            
            page_analysis['has_admin_features'] = len(found_admin) > 0
            page_analysis['has_user_features'] = len(found_user) > 0
            page_analysis['functionality_detected'] = found_admin + found_user
            
            # Capturar conteúdo principal
            try:
                main_content = self.driver.find_element(By.TAG_NAME, "main")
                page_analysis['main_content'] = main_content.text[:500]  # Primeiros 500 caracteres
            except:
                page_analysis['main_content'] = "Conteúdo principal não encontrado"
            
            # Tirar screenshot
            screenshot_name = f"page_{menu_item['text'].replace(' ', '_').lower()}"
            self.take_screenshot(screenshot_name)
            
            print(f"  ✅ Página analisada - Forms: {page_analysis['has_forms']}, Tables: {page_analysis['has_tables']}")
            
            return page_analysis
            
        except Exception as e:
            print(f"  ❌ Erro ao explorar página: {str(e)}")
            return {
                'url': menu_item['href'],
                'loaded_successfully': False,
                'error_messages': [str(e)]
            }

    def take_screenshot(self, name):
        """Tira screenshot da página atual"""
        try:
            filename = f"screenshot_{name}_{int(time.time())}.png"
            self.driver.save_screenshot(filename)
            self.exploration_results['screenshots_taken'].append(filename)
            print(f"📸 Screenshot salvo: {filename}")
        except Exception as e:
            print(f"⚠️ Erro ao tirar screenshot: {str(e)}")

    def analyze_admin_vs_user_separation(self):
        """Analisa a separação entre funcionalidades admin e usuário"""
        print("🔍 Analisando separação admin vs usuário...")
        
        menu_items = self.exploration_results['menu_items_found']
        pages_explored = self.exploration_results['pages_explored']
        
        admin_count = len([item for item in menu_items if item['classification'] == 'admin'])
        user_count = len([item for item in menu_items if item['classification'] == 'user'])
        mixed_count = len([item for item in menu_items if item['classification'] == 'mixed'])
        unclear_count = len([item for item in menu_items if item['classification'] == 'unclear'])
        
        # Analisar páginas com funcionalidades mistas
        mixed_pages = []
        for page_name, page_data in pages_explored.items():
            if page_data.get('has_admin_features') and page_data.get('has_user_features'):
                mixed_pages.append(page_name)
        
        separation_analysis = {
            'menu_classification': {
                'admin_items': admin_count,
                'user_items': user_count,
                'mixed_items': mixed_count,
                'unclear_items': unclear_count
            },
            'separation_score': round((admin_count + user_count) / len(menu_items) * 100, 2) if menu_items else 0,
            'mixed_functionality_pages': mixed_pages,
            'recommendations': []
        }
        
        # Gerar recomendações
        if mixed_count > 0:
            separation_analysis['recommendations'].append(f"Revisar {mixed_count} itens de menu com classificação mista")
        
        if len(mixed_pages) > 0:
            separation_analysis['recommendations'].append(f"Separar funcionalidades em {len(mixed_pages)} páginas mistas")
        
        self.exploration_results['functional_analysis'] = separation_analysis
        
        print(f"✅ Análise concluída - Score: {separation_analysis['separation_score']}%")

    def generate_live_report(self):
        """Gera relatório da exploração ao vivo"""
        print("📊 Gerando relatório da exploração...")
        
        # Salvar dados completos
        with open('live_admin_panel_exploration.json', 'w', encoding='utf-8') as f:
            json.dump(self.exploration_results, f, indent=2, ensure_ascii=False)
        
        # Gerar resumo
        menu_items = self.exploration_results['menu_items_found']
        pages_explored = self.exploration_results['pages_explored']
        functional_analysis = self.exploration_results['functional_analysis']
        
        print("\n" + "="*80)
        print("📊 RELATÓRIO DA EXPLORAÇÃO AO VIVO DO PAINEL ADMINISTRATIVO")
        print("="*80)
        
        print(f"\n🕐 Timestamp: {self.exploration_results['timestamp']}")
        print(f"🔐 Login: {'✅ Sucesso' if self.exploration_results['login_success'] else '❌ Falhou'}")
        
        if menu_items:
            print(f"\n📋 Menu Lateral ({len(menu_items)} itens encontrados):")
            for item in menu_items:
                icon = {
                    'admin': '👑',
                    'user': '👤', 
                    'mixed': '⚠️',
                    'unclear': '❓'
                }.get(item['classification'], '❓')
                print(f"  {icon} {item['text']} → {item['classification']}")
        
        if pages_explored:
            print(f"\n📄 Páginas Exploradas ({len(pages_explored)}):")
            for page_name, page_data in pages_explored.items():
                status = "✅" if page_data.get('loaded_successfully', False) else "❌"
                features = []
                if page_data.get('has_admin_features'): features.append("Admin")
                if page_data.get('has_user_features'): features.append("User")
                feature_text = f" ({', '.join(features)})" if features else ""
                print(f"  {status} {page_name}{feature_text}")
        
        if functional_analysis:
            classification = functional_analysis.get('menu_classification', {})
            print(f"\n🎯 Análise Funcional:")
            print(f"  👑 Itens Admin: {classification.get('admin_items', 0)}")
            print(f"  👤 Itens User: {classification.get('user_items', 0)}")
            print(f"  ⚠️ Itens Mistos: {classification.get('mixed_items', 0)}")
            print(f"  📊 Score de Separação: {functional_analysis.get('separation_score', 0)}%")
        
        screenshots = self.exploration_results['screenshots_taken']
        if screenshots:
            print(f"\n📸 Screenshots Capturados ({len(screenshots)}):")
            for screenshot in screenshots:
                print(f"  📷 {screenshot}")
        
        print(f"\n💾 Relatório completo salvo em: live_admin_panel_exploration.json")

    def cleanup(self):
        """Limpa recursos"""
        if self.driver:
            self.driver.quit()
            print("🧹 Driver fechado")

    def run_live_exploration(self, email, password):
        """Executa exploração completa ao vivo"""
        print("🚀 Iniciando exploração ao vivo do painel administrativo...")
        print("🎯 Objetivo: Navegar pelos menus e analisar funcionalidades reais")
        print("=" * 80)
        
        try:
            # 1. Configurar driver
            if not self.setup_driver():
                return False
            
            # 2. Fazer login
            if not self.login(email, password):
                print("❌ Não foi possível fazer login. Exploração interrompida.")
                return False
            
            # 3. Extrair itens do menu
            menu_items = self.extract_menu_items()
            
            # 4. Explorar cada página
            print(f"\n🔍 Explorando {len(menu_items)} páginas...")
            for i, menu_item in enumerate(menu_items, 1):
                print(f"\n[{i}/{len(menu_items)}] ", end="")
                page_analysis = self.explore_page(menu_item)
                self.exploration_results['pages_explored'][menu_item['text']] = page_analysis
                
                # Pequena pausa entre páginas
                time.sleep(2)
            
            # 5. Analisar separação admin vs usuário
            self.analyze_admin_vs_user_separation()
            
            # 6. Gerar relatório
            self.generate_live_report()
            
            print("\n✅ Exploração ao vivo concluída com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro durante exploração: {str(e)}")
            return False
        finally:
            self.cleanup()

def main():
    """Função principal"""
    explorer = LiveAdminPanelExplorer()
    
    # Credenciais
    email = "rcarrarocoach@gmail.com"
    password = "M&151173c@"
    
    # Executar exploração
    success = explorer.run_live_exploration(email, password)
    
    if success:
        print("\n🎉 Exploração concluída! Verifique os screenshots e o relatório JSON.")
    else:
        print("\n❌ Exploração falhou.")

if __name__ == "__main__":
    main()