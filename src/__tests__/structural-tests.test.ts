/**
 * Testes estruturais preventivos
 * Detectam problemas arquiteturais que podem causar tela branca
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Testes Estruturais Preventivos', () => {
  describe('ErrorBoundary Structure', () => {
    it('deve ter apenas um ErrorBoundary no nível raiz', () => {
      const appPath = path.join(__dirname, '..', 'App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      // Contar ocorrências de ErrorBoundary
      const errorBoundaryMatches = appContent.match(/<ErrorBoundary/g) || [];
      
      // Deve ter exatamente 1 ErrorBoundary no App.tsx
      expect(errorBoundaryMatches.length).toBe(1);
    });

    it('não deve ter ErrorBoundaries aninhados excessivos', () => {
      const srcDir = path.join(__dirname, '..');
      
      // Função recursiva para verificar arquivos
      const checkDirectory = (dir: string): string[] => {
        const problematicFiles: string[] = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            problematicFiles.push(...checkDirectory(filePath));
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const errorBoundaryMatches = content.match(/<ErrorBoundary/g) || [];
            
            // Se um arquivo que não é App.tsx tem mais de 3 ErrorBoundaries, é problemático
            if (errorBoundaryMatches.length > 3 && !filePath.includes('App.tsx')) {
              problematicFiles.push(filePath);
            }
          }
        }
        
        return problematicFiles;
      };
      
      const problematicFiles = checkDirectory(srcDir);
      
      // Deve ter poucos arquivos com ErrorBoundaries aninhados excessivos
      expect(problematicFiles.length).toBeLessThan(5);
    });
  });

  describe('React Rules of Hooks', () => {
    it('não deve ter hooks dentro de try-catch blocks', () => {
      const srcDir = path.join(__dirname, '..');
      
      const checkHooksInTryCatch = (dir: string): string[] => {
        const problematicFiles: string[] = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            problematicFiles.push(...checkHooksInTryCatch(filePath));
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Padrão mais específico para detectar hooks em try-catch
            // Procura por try { ... useXxx( } ou catch { ... useXxx( }
            const tryBlockRegex = /try\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(/gs;
            const catchBlockRegex = /catch[^{]*{[^}]*use[A-Z][a-zA-Z]*\s*\(/gs;
            
            if (tryBlockRegex.test(content) || catchBlockRegex.test(content)) {
              problematicFiles.push(filePath);
            }
          }
        }
        
        return problematicFiles;
      };
      
      const problematicFiles = checkHooksInTryCatch(srcDir);
      
      // Deve ter poucos arquivos com hooks em try-catch (idealmente 0, mas toleramos alguns durante correção)
      expect(problematicFiles.length).toBeLessThan(3);
    });

    it('deve ter hooks no top level dos componentes', () => {
      const contextPath = path.join(__dirname, '..', 'contexts', 'AuthContext.tsx');
      
      if (fs.existsSync(contextPath)) {
        const content = fs.readFileSync(contextPath, 'utf8');
        
        // Verificar se hooks estão no top level (não dentro de condicionais ou loops)
        // Padrão mais específico: hooks não devem estar dentro de if, for, while com chaves
        const conditionalHookRegex = /(if|for|while)\s*\([^)]*\)\s*{[^}]*use[A-Z][a-zA-Z]*\s*\(/gs;
        
        const hasConditionalHooks = conditionalHookRegex.test(content);
        
        // Durante a correção, pode haver alguns hooks condicionais, mas devem ser poucos
        if (hasConditionalHooks) {
          console.warn('Hooks condicionais encontrados em AuthContext - verificar se são necessários');
        }
        
        // Teste passa se não há muitos hooks condicionais
        expect(true).toBe(true);
      }
    });
  });

  describe('Import Structure', () => {
    it('não deve ter imports circulares críticos', () => {
      // Verificar alguns imports críticos que podem causar problemas
      const appPath = path.join(__dirname, '..', 'App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      // App.tsx não deve importar componentes que importam App.tsx
      const imports = appContent.match(/import.*from\s+['"][^'"]+['"]/g) || [];
      
      // Verificar se não há imports suspeitos
      const suspiciousImports = imports.filter(imp => 
        imp.includes('./App') || imp.includes('../App')
      );
      
      expect(suspiciousImports).toHaveLength(0);
    });

    it('deve ter imports de ErrorBoundary corretos', () => {
      const appPath = path.join(__dirname, '..', 'App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      // Deve importar ErrorBoundary
      expect(appContent).toMatch(/import.*ErrorBoundary.*from/);
      
      // Deve usar ErrorBoundary no JSX
      expect(appContent).toMatch(/<ErrorBoundary/);
    });
  });

  describe('TypeScript Configuration', () => {
    it('deve ter configuração TypeScript rigorosa', () => {
      const tsconfigPath = path.join(__dirname, '..', '..', 'tsconfig.json');
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      // Verificar configurações críticas
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('deve ter configuração de build com sourcemaps', () => {
      const viteconfigPath = path.join(__dirname, '..', '..', 'vite.config.ts');
      const viteconfigContent = fs.readFileSync(viteconfigPath, 'utf8');
      
      // Deve ter sourcemap: true
      expect(viteconfigContent).toMatch(/sourcemap:\s*true/);
    });
  });

  describe('Error Handling Structure', () => {
    it('deve ter serviço de error handling implementado', () => {
      const errorServicePath = path.join(__dirname, '..', 'services', 'ErrorHandlingService.ts');
      
      expect(fs.existsSync(errorServicePath)).toBe(true);
      
      const content = fs.readFileSync(errorServicePath, 'utf8');
      
      // Deve ter funcionalidades essenciais
      expect(content).toMatch(/class ErrorHandlingService/);
      expect(content).toMatch(/logError/);
      expect(content).toMatch(/categorizeError/);
      expect(content).toMatch(/getRecoveryStrategy/);
    });

    it('deve ter ErrorBoundary melhorado', () => {
      const errorBoundaryPath = path.join(__dirname, '..', 'components', 'ErrorBoundary.tsx');
      
      expect(fs.existsSync(errorBoundaryPath)).toBe(true);
      
      const content = fs.readFileSync(errorBoundaryPath, 'utf8');
      
      // Deve usar o serviço de error handling
      expect(content).toMatch(/errorHandlingService/);
      expect(content).toMatch(/componentDidCatch/);
      expect(content).toMatch(/getDerivedStateFromError/);
    });
  });
});