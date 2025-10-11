#!/usr/bin/env python3
"""
Script de Diagnóstico Completo do Sistema COMADEMIG
Verifica: rotas, componentes, banco de dados, hooks e integrações
"""

import os
import re
import json
from pathlib import Path

class SystemDiagnostic:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.info = []
        
    def add_issue(self, category, file, line, message):
        self.issues.append({
            'category': category,
            'file': file,
            'line': line,
            'message': message,
            'severity': 'ERROR'
        })
    
    def add_warning(self, category, file, line, message):
        self.warnings.append({
            'category': category,
            'file': file,
            'line': line,
            'message': message,
            'severity': 'WARNING'
        })
    
    def add_info(self, category, message):
        self.info.append({
            'category': category,
            'message': message
        })
    
    def check_imports(self, file_path, content):
        """Verifica se todos os imports existem"""
        import_pattern = r"import\s+.*?\s+from\s+['\"](@/[^'\"]+|\.\.?/[^'\"]+)['\"]"
        imports = re.findall(import_pattern, content)
        
        for imp in imports:
            # Converter @ para src/
            if imp.startswith('@/'):
                imp = imp.replace('@/', 'src/')
            elif imp.startswith('./') or imp.startswith('../'):
                # Resolver caminho relativo
                base_dir = os.path.dirname(file_path)
                imp = os.path.normpath(os.path.join(base_dir, imp))
            
            # Adicionar extensões possíveis
            possible_files = [
                f"{imp}.tsx",
                f"{imp}.ts",
                f"{imp}.jsx",
                f"{imp}.js",
                f"{imp}/index.tsx",
                f"{imp}/index.ts"
            ]
            
            exists = any(os.path.exists(f) for f in possible_files)
            
            if not exists:
                self.add_issue(
                    'IMPORT',
                    file_path,
                    0,
                    f"Import não encontrado: {imp}"
                )
    
    def check_routes(self):
        """Verifica se todas as rotas apontam para componentes existentes"""
        app_tsx = Path('src/App.tsx')
        if not app_tsx.exists():
            self.add_issue('ROUTES', 'src/App.tsx', 0, 'Arquivo App.tsx não encontrado')
            return
        
        content = app_tsx.read_text(encoding='utf-8')
        
        # Extrair imports de páginas
        import_pattern = r"import\s+(\w+)\s+from\s+['\"](@/pages/[^'\"]+)['\"]"
        imports = re.findall(import_pattern, content)
        
        # Extrair rotas
        route_pattern = r'<Route\s+path="([^"]+)"\s+element={<(\w+)[^>]*>}'
        routes = re.findall(route_pattern, content)
        
        imported_components = {name: path for name, path in imports}
        
        for path, component in routes:
            if component not in imported_components:
                self.add_warning(
                    'ROUTES',
                    'src/App.tsx',
                    0,
                    f"Rota '{path}' usa componente '{component}' que não está importado"
                )
    
    def check_buttons_and_forms(self, file_path, content):
        """Verifica botões sem ação e formulários sem handler"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Verificar botões sem onClick
            if '<Button' in line or '<button' in line:
                # Verificar se tem onClick, type="submit", ou asChild
                if 'onClick' not in line and 'type="submit"' not in line and 'asChild' not in line:
                    # Verificar próximas 3 linhas
                    next_lines = '\n'.join(lines[i:i+3])
                    if 'onClick' not in next_lines and 'type="submit"' not in next_lines:
                        self.add_warning(
                            'BUTTON',
                            file_path,
                            i,
                            'Botão sem ação (onClick ou type="submit")'
                        )
            
            # Verificar formulários sem onSubmit
            if '<form' in line and 'onSubmit' not in line:
                self.add_warning(
                    'FORM',
                    file_path,
                    i,
                    'Formulário sem handler onSubmit'
                )
    
    def check_hooks_usage(self, file_path, content):
        """Verifica uso correto de hooks"""
        # Verificar useQuery sem queryKey
        if 'useQuery' in content:
            if 'queryKey:' not in content:
                self.add_issue(
                    'HOOKS',
                    file_path,
                    0,
                    'useQuery sem queryKey definido'
                )
        
        # Verificar useMutation sem onSuccess/onError
        if 'useMutation' in content:
            if 'onSuccess' not in content and 'onError' not in content:
                self.add_warning(
                    'HOOKS',
                    file_path,
                    0,
                    'useMutation sem tratamento de sucesso/erro'
                )
    
    def scan_file(self, file_path):
        """Escaneia um arquivo em busca de problemas"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Verificar imports
            self.check_imports(file_path, content)
            
            # Verificar botões e formulários
            self.check_buttons_and_forms(file_path, content)
            
            # Verificar hooks
            self.check_hooks_usage(file_path, content)
            
        except Exception as e:
            self.add_warning('FILE', file_path, 0, f'Erro ao ler arquivo: {str(e)}')
    
    def scan_directory(self, directory):
        """Escaneia um diretório recursivamente"""
        for root, dirs, files in os.walk(directory):
            # Ignorar node_modules, .git, etc
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
            
            for file in files:
                if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                    file_path = os.path.join(root, file)
                    self.scan_file(file_path)
    
    def generate_report(self):
        """Gera relatório final"""
        print("\n" + "="*80)
        print("RELATÓRIO DE DIAGNÓSTICO DO SISTEMA COMADEMIG")
        print("="*80 + "\n")
        
        # Estatísticas
        print(f"📊 ESTATÍSTICAS:")
        print(f"   ❌ Erros Críticos: {len(self.issues)}")
        print(f"   ⚠️  Avisos: {len(self.warnings)}")
        print(f"   ℹ️  Informações: {len(self.info)}")
        print()
        
        # Erros críticos
        if self.issues:
            print("❌ ERROS CRÍTICOS (precisam ser corrigidos):")
            print("-" * 80)
            for issue in self.issues[:20]:  # Mostrar primeiros 20
                print(f"\n📁 {issue['file']}")
                if issue['line']:
                    print(f"   Linha {issue['line']}")
                print(f"   [{issue['category']}] {issue['message']}")
            
            if len(self.issues) > 20:
                print(f"\n... e mais {len(self.issues) - 20} erros")
            print()
        
        # Avisos
        if self.warnings:
            print("\n⚠️  AVISOS (recomendado corrigir):")
            print("-" * 80)
            for warning in self.warnings[:20]:  # Mostrar primeiros 20
                print(f"\n📁 {warning['file']}")
                if warning['line']:
                    print(f"   Linha {warning['line']}")
                print(f"   [{warning['category']}] {warning['message']}")
            
            if len(self.warnings) > 20:
                print(f"\n... e mais {len(self.warnings) - 20} avisos")
            print()
        
        # Resumo por categoria
        print("\n📋 RESUMO POR CATEGORIA:")
        print("-" * 80)
        
        categories = {}
        for item in self.issues + self.warnings:
            cat = item['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"   {cat}: {count} problema(s)")
        
        print("\n" + "="*80)
        
        # Salvar em arquivo JSON
        report = {
            'issues': self.issues,
            'warnings': self.warnings,
            'info': self.info,
            'summary': {
                'total_issues': len(self.issues),
                'total_warnings': len(self.warnings),
                'categories': categories
            }
        }
        
        with open('diagnostic_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print("\n✅ Relatório completo salvo em: diagnostic_report.json")
        print()

def main():
    print("🔍 Iniciando diagnóstico do sistema...")
    print()
    
    diagnostic = SystemDiagnostic()
    
    # Verificar rotas
    print("📍 Verificando rotas...")
    diagnostic.check_routes()
    
    # Escanear diretórios principais
    print("📂 Escaneando src/pages...")
    diagnostic.scan_directory('src/pages')
    
    print("📂 Escaneando src/components...")
    diagnostic.scan_directory('src/components')
    
    print("📂 Escaneando src/hooks...")
    diagnostic.scan_directory('src/hooks')
    
    # Gerar relatório
    diagnostic.generate_report()

if __name__ == '__main__':
    main()
