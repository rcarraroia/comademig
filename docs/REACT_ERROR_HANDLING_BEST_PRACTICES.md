# Guia de Boas Práticas: Error Handling em React

**Versão:** 1.0  
**Data:** 23 de Janeiro de 2026  
**Aplicável a:** Projetos React com TypeScript  

## 🎯 Objetivo

Este guia estabelece padrões e boas práticas para implementação de error handling em aplicações React, baseado nas lições aprendidas durante as correções críticas do sistema COMADEMIG.

## 📋 Princípios Fundamentais

### 1. **Princípio da Responsabilidade Única**
- Um ErrorBoundary por nível de responsabilidade
- Evitar ErrorBoundaries aninhados desnecessários
- Cada ErrorBoundary deve ter um propósito específico

### 2. **Princípio da Recuperação Graceful**
- Sempre fornecer uma forma de recuperação
- UI de fallback deve ser útil, não apenas informativa
- Permitir que o usuário continue usando a aplicação

### 3. **Princípio da Transparência**
- Logs detalhados para debugging
- Informações suficientes para reproduzir problemas
- Categorização clara de tipos de erro

## 🚫 Anti-Padrões a Evitar

### ❌ ErrorBoundaries Aninhados Excessivos
```jsx
// NUNCA FAZER
<ErrorBoundary>
  <ErrorBoundary>
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>
```

**Por que é problemático:**
- Loops infinitos de renderização
- Dificuldade para determinar qual boundary capturou o erro
- Performance degradada

### ❌ Hooks em Try-Catch
```jsx
// NUNCA FAZER
function Component() {
  try {
    const data = useQuery(); // ❌ Viola Rules of Hooks
    const state = useState(); // ❌ Viola Rules of Hooks
  } catch (error) {
    // Tratamento de erro
  }
}
```

**Por que é problemático:**
- Viola as Rules of Hooks do React
- Comportamento imprevisível
- Pode causar crashes da aplicação

### ❌ Error Handling Silencioso
```jsx
// NUNCA FAZER
try {
  riskyOperation();
} catch (error) {
  // Silenciosamente ignora o erro
}
```

**Por que é problemático:**
- Problemas não são detectados
- Debugging impossível
- Experiência do usuário degradada

## ✅ Padrões Recomendados

### 1. ErrorBoundary no Nível Raiz

```jsx
// ✅ PADRÃO CORRETO
function App() {
  return (
    <ErrorBoundary componentName="App">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Rotas da aplicação */}
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

**Benefícios:**
- Captura todos os erros não tratados
- Ponto único de controle
- Evita loops infinitos

### 2. Error States em Hooks

```jsx
// ✅ PADRÃO CORRETO
export const useAuthState = () => {
  const [error, setError] = useState<string | null>(null);
  
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      try {
        const result = await authService.getSession();
        setError(null); // Limpar erro anterior
        return result;
      } catch (err) {
        setError(err.message);
        throw err; // Re-throw para ErrorBoundary
      }
    }
  });
  
  return { session, isLoading, error };
};
```

**Benefícios:**
- Hooks no top level
- Error states explícitos
- Compatível com ErrorBoundaries

### 3. Serviço Centralizado de Error Handling

```typescript
// ✅ PADRÃO CORRETO
class ErrorHandlingService {
  public logError(
    error: Error, 
    context: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    const errorReport = this.createErrorReport(error, context, severity);
    
    // Log local
    this.logToConsole(errorReport);
    
    // Log remoto para erros críticos
    if (severity === 'critical') {
      this.sendToExternalService(errorReport);
    }
    
    return errorReport.id;
  }
  
  public getRecoveryStrategy(error: Error): RecoveryStrategy {
    const category = this.categorizeError(error);
    return this.getStrategyForCategory(category);
  }
}
```

**Benefícios:**
- Logging consistente
- Categorização automática
- Estratégias de recuperação

### 4. ErrorBoundary com Recuperação

```jsx
// ✅ PADRÃO CORRETO
class ErrorBoundary extends Component {
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = errorHandlingService.logError(
      error,
      { component: this.props.componentName },
      'high'
    );
    
    this.setState({ errorId });
  }
  
  private handleRetry = () => {
    this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
  };
  
  public render() {
    if (this.state.hasError) {
      const strategy = errorHandlingService.getRecoveryStrategy(this.state.error);
      
      return (
        <ErrorFallbackUI 
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onGoHome={() => window.location.href = '/'}
          recoveryStrategy={strategy}
        />
      );
    }
    
    return this.props.children;
  }
}
```

**Benefícios:**
- UI de recuperação útil
- Múltiplas opções de recuperação
- Logging integrado

## 🏗️ Arquitetura Recomendada

### Estrutura de Camadas

```
App (ErrorBoundary raiz)
├── QueryClientProvider
├── AuthProvider
├── Router
    ├── PublicRoutes
    └── ProtectedRoutes (ErrorBoundary específico)
        ├── DashboardLayout
        └── AdminLayout (ErrorBoundary específico)
```

### Quando Usar ErrorBoundaries Adicionais

1. **Seções Críticas Isoladas**
   ```jsx
   <ErrorBoundary componentName="PaymentForm">
     <PaymentForm />
   </ErrorBoundary>
   ```

2. **Componentes de Terceiros**
   ```jsx
   <ErrorBoundary componentName="ThirdPartyWidget">
     <ThirdPartyWidget />
   </ErrorBoundary>
   ```

3. **Funcionalidades Opcionais**
   ```jsx
   <ErrorBoundary componentName="OptionalFeature" fallback={null}>
     <OptionalFeature />
   </ErrorBoundary>
   ```

## 🧪 Estratégias de Teste

### 1. Testes Estruturais

```typescript
// Verificar estrutura de ErrorBoundaries
describe('ErrorBoundary Structure', () => {
  it('deve ter apenas um ErrorBoundary no nível raiz', () => {
    const appContent = fs.readFileSync('src/App.tsx', 'utf8');
    const errorBoundaryMatches = appContent.match(/<ErrorBoundary/g) || [];
    expect(errorBoundaryMatches.length).toBe(1);
  });
});
```

### 2. Testes Funcionais

```tsx
// Testar captura e recuperação de erros
describe('Error Handling', () => {
  it('deve capturar erros e mostrar UI de recuperação', async () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Erro no Carregamento/i)).toBeInTheDocument();
      expect(screen.getByText(/Tentar Novamente/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Testes de Integração

```typescript
// Testar fluxos completos com error handling
describe('Error Recovery Flows', () => {
  it('deve recuperar de erro de autenticação', async () => {
    // Simular erro de auth
    mockAuthService.mockRejectedValueOnce(new Error('Auth failed'));
    
    // Verificar recuperação
    // ...
  });
});
```

## 📊 Monitoramento e Métricas

### Métricas Importantes

1. **Taxa de Erro por Componente**
   - Identificar componentes problemáticos
   - Priorizar correções

2. **Taxa de Recuperação**
   - Quantos usuários conseguem se recuperar
   - Eficácia das estratégias de recuperação

3. **Tempo de Resolução**
   - Quanto tempo leva para resolver erros
   - Impacto na experiência do usuário

### Implementação de Monitoramento

```typescript
// ErrorMonitor component para admins
export const ErrorMonitor: React.FC = () => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  
  useEffect(() => {
    const updateErrors = () => {
      const recentErrors = errorHandlingService.getRecentErrors();
      setErrors(recentErrors);
    };
    
    const interval = setInterval(updateErrors, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor de Erros</CardTitle>
      </CardHeader>
      <CardContent>
        {errors.map(error => (
          <ErrorReportCard key={error.id} error={error} />
        ))}
      </CardContent>
    </Card>
  );
};
```

## 🔧 Ferramentas e Configuração

### TypeScript Rigoroso

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Rules

```json
// .eslintrc.js
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true, // Sempre habilitar para debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
});
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

### Ferramentas Recomendadas
- [Sentry](https://sentry.io/) - Monitoramento de erros
- [LogRocket](https://logrocket.com/) - Session replay
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debugging

### Bibliotecas Úteis
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary) - ErrorBoundary simplificado
- [use-error-handler](https://github.com/bvaughn/react-error-boundary#useerrorhandler-hook) - Hook para error handling

## ✅ Checklist de Implementação

### Antes de Implementar Error Handling

- [ ] Identificar pontos críticos da aplicação
- [ ] Definir estratégias de recuperação
- [ ] Configurar logging e monitoramento
- [ ] Implementar testes estruturais

### Durante a Implementação

- [ ] Seguir padrões estabelecidos
- [ ] Evitar anti-padrões conhecidos
- [ ] Implementar testes para cada ErrorBoundary
- [ ] Documentar decisões de design

### Após a Implementação

- [ ] Executar testes preventivos
- [ ] Validar em ambiente de staging
- [ ] Monitorar métricas em produção
- [ ] Ajustar estratégias conforme necessário

## 🎯 Conclusão

O error handling eficaz em React requer:

1. **Arquitetura bem planejada** com ErrorBoundaries estratégicos
2. **Conformidade com padrões** React e TypeScript
3. **Testes abrangentes** estruturais e funcionais
4. **Monitoramento contínuo** de erros e recuperação
5. **Documentação clara** de padrões e práticas

Seguindo estas práticas, você pode construir aplicações React robustas que se recuperam graciosamente de erros e fornecem uma excelente experiência do usuário.

---

**Autor:** Kiro AI  
**Baseado em:** Correções críticas do sistema COMADEMIG  
**Última atualização:** 23/01/2026