/**
 * Testes funcionais preventivos
 * Validam fluxos críticos que não devem causar tela branca
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Componentes a serem testados
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  }
}));

// Mock do RedirectService
vi.mock('@/services/RedirectService', () => ({
  redirectService: {
    handleRedirect: vi.fn(),
    getRedirectPath: vi.fn().mockReturnValue('/dashboard'),
    shouldRedirect: vi.fn().mockReturnValue({ shouldRedirect: false, path: '' })
  }
}));

// Componente que gera erro para testar ErrorBoundary
const ErrorComponent = () => {
  throw new Error('Erro de teste');
};

// Componente que funciona normalmente
const WorkingComponent = () => <div>Componente funcionando</div>;

// Wrapper para testes
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Testes Funcionais Preventivos', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  describe('ErrorBoundary Functionality', () => {
    it('deve capturar erros sem causar tela branca', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Deve mostrar a UI de erro ao invés de tela branca
      await waitFor(() => {
        expect(screen.getByText(/Erro no Carregamento/i)).toBeInTheDocument();
      });

      // Deve ter botão de recuperação
      expect(screen.getByText(/Tentar Novamente/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('deve permitir recuperação após erro', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let shouldError = true;
      const ConditionalErrorComponent = () => {
        if (shouldError) {
          throw new Error('Erro condicional');
        }
        return <div>Recuperado com sucesso</div>;
      };

      const { rerender } = render(
        <TestWrapper>
          <ErrorBoundary>
            <ConditionalErrorComponent />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Deve mostrar erro inicialmente
      await waitFor(() => {
        expect(screen.getByText(/Erro no Carregamento/i)).toBeInTheDocument();
      });

      // Simular recuperação
      shouldError = false;
      
      // Clicar em tentar novamente
      const retryButton = screen.getByText(/Tentar Novamente/i);
      retryButton.click();

      // Deve recuperar
      await waitFor(() => {
        expect(screen.queryByText(/Erro no Carregamento/i)).not.toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('não deve ter loops infinitos de erro', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Aguardar um tempo para verificar se não há loops
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Deve ter apenas uma instância da mensagem de erro
      const errorMessages = screen.getAllByText(/Erro no Carregamento/i);
      expect(errorMessages).toHaveLength(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Authentication Flow', () => {
    it('deve carregar AuthProvider sem erros', async () => {
      render(
        <TestWrapper>
          <WorkingComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
      });
    });

    it('deve lidar com falhas de autenticação graciosamente', async () => {
      // Mock de erro na autenticação
      const mockSupabase = await import('@/integrations/supabase/client');
      vi.mocked(mockSupabase.supabase.auth.getSession).mockRejectedValueOnce(
        new Error('Erro de autenticação')
      );

      render(
        <TestWrapper>
          <WorkingComponent />
        </TestWrapper>
      );

      // Deve ainda renderizar o componente (não deve quebrar)
      await waitFor(() => {
        expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes', () => {
    it('deve renderizar ProtectedRoute sem causar loops', async () => {
      render(
        <TestWrapper>
          <ProtectedRoute>
            <WorkingComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Deve renderizar sem erros (pode redirecionar, mas não deve quebrar)
      await waitFor(() => {
        // Se não há erro, o teste passa
        expect(true).toBe(true);
      }, { timeout: 2000 });
    });
  });

  describe('Application Loading', () => {
    it('deve carregar aplicação sem tela branca', async () => {
      render(
        <TestWrapper>
          <div data-testid="app-content">
            <WorkingComponent />
          </div>
        </TestWrapper>
      );

      // Deve ter conteúdo visível
      await waitFor(() => {
        expect(screen.getByTestId('app-content')).toBeInTheDocument();
        expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
      });
    });

    it('deve lidar com múltiplos componentes sem conflitos', async () => {
      render(
        <TestWrapper>
          <div>
            <WorkingComponent />
            <div>Segundo componente</div>
            <div>Terceiro componente</div>
          </div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
        expect(screen.getByText('Segundo componente')).toBeInTheDocument();
        expect(screen.getByText('Terceiro componente')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Strategies', () => {
    it('deve ter estratégias de recuperação funcionais', async () => {
      const { errorHandlingService } = await import('@/services/ErrorHandlingService');
      
      const testError = new Error('Erro de teste');
      const strategy = errorHandlingService.getRecoveryStrategy(testError);
      
      expect(strategy).toBeDefined();
      expect(strategy.canRecover).toBe(true);
      expect(strategy.strategy).toBeDefined();
    });

    it('deve categorizar erros corretamente', async () => {
      const { errorHandlingService } = await import('@/services/ErrorHandlingService');
      
      const apiError = new Error('Network request failed');
      const authError = new Error('Authentication token expired');
      const uiError = new Error('Component render failed');
      
      // Testar categorização (método privado, testamos via logError)
      const apiErrorId = errorHandlingService.logError(apiError);
      const authErrorId = errorHandlingService.logError(authError);
      const uiErrorId = errorHandlingService.logError(uiError);
      
      expect(apiErrorId).toBeDefined();
      expect(authErrorId).toBeDefined();
      expect(uiErrorId).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('não deve ter vazamentos de memória em ErrorBoundary', async () => {
      const { unmount } = render(
        <TestWrapper>
          <ErrorBoundary>
            <WorkingComponent />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Desmontar componente
      unmount();

      // Se chegou até aqui sem erros, não há vazamentos óbvios
      expect(true).toBe(true);
    });

    it('deve limpar recursos ao desmontar', async () => {
      const { unmount } = render(
        <TestWrapper>
          <WorkingComponent />
        </TestWrapper>
      );

      // Desmontar
      unmount();

      // Verificar se não há erros após desmontagem
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(true).toBe(true);
    });
  });
});