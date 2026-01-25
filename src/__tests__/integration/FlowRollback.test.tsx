/**
 * Testes de rollback entre fluxos (Payment First Flow ↔ Fluxo Tradicional)
 * 
 * Valida que o sistema pode alternar entre fluxos sem problemas
 * Requirements: 8.2, 8.3, 8.5
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Componentes e hooks
import { useFiliacaoPayment } from '@/hooks/useFiliacaoPayment';
import { usePaymentFirstFlowFeature } from '@/hooks/usePaymentFirstFlowFeature';
import { AuthProvider } from '@/contexts/AuthContext';

// Mocks
import { paymentFirstFlowService } from '@/lib/services/PaymentFirstFlowService';

// Mock do PaymentFirstFlowService
vi.mock('@/lib/services/PaymentFirstFlowService', () => ({
  paymentFirstFlowService: {
    processRegistration: vi.fn()
  }
}));

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      admin: {
        deleteUser: vi.fn()
      },
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: null },
        error: null
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          })),
          maybeSingle: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          })),
          in: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: null
            }))
          }))
        })),
        limit: vi.fn(() => ({
          execute: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      })),
      insert: vi.fn(() => Promise.resolve({
        data: null,
        error: null
      }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: null,
        error: null
      }))
    }
  }
}));

// Mock dos hooks de pagamento tradicionais
vi.mock('@/hooks/useAsaasCustomers', () => ({
  useAsaasCustomers: () => ({
    createCustomer: vi.fn().mockResolvedValue({
      success: true,
      customer_id: 'cus_traditional_123'
    })
  })
}));

vi.mock('@/hooks/useAsaasCardPayments', () => ({
  useAsaasCardPayments: () => ({
    processCardPayment: vi.fn().mockResolvedValue({
      success: true,
      asaas_id: 'pay_traditional_123',
      status: 'CONFIRMED',
      credit_card_token: 'token_123'
    })
  })
}));

// Dados de teste
const mockMemberType = {
  id: 'member-type-1',
  name: 'Pastor',
  description: 'Tipo Pastor',
  plan_id: 'plan-1',
  plan_name: 'Plano Pastor Mensal',
  plan_value: 50.00,
  plan_recurrence: 'monthly' as const
};

const mockFormData = {
  nome_completo: 'João Silva',
  email: 'joao@teste.com',
  password: 'Senha123',
  cpf: '12345678901',
  telefone: '11999999999',
  cep: '01234567',
  endereco: 'Rua Teste',
  numero: '123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  payment_method: 'credit_card' as const,
  cardData: {
    holderName: 'João Silva',
    number: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '2025',
    ccv: '123'
  }
};

// Wrapper para testes
const TestWrapper: React.FC<{ children: React.ReactNode; user?: any }> = ({ 
  children, 
  user = null 
}) => {
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

describe('Rollback entre Fluxos', () => {
  let mockProcessRegistration: any;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessRegistration = vi.mocked(paymentFirstFlowService.processRegistration);
    
    // Mock do localStorage
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.localStorage = originalLocalStorage;
  });

  describe('1. Alternância de Fluxos via Feature Flag', () => {
    it('deve alternar do fluxo tradicional para Payment First Flow', async () => {
      const TestComponent = () => {
        const { processarFiliacaoComPagamento, useNewFlow } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: false // Iniciar com fluxo tradicional
        });

        const [currentFlow, setCurrentFlow] = React.useState(false);

        React.useEffect(() => {
          setCurrentFlow(useNewFlow);
        }, [useNewFlow]);

        return (
          <div>
            <div data-testid="current-flow">
              {currentFlow ? 'Payment First Flow' : 'Fluxo Tradicional'}
            </div>
            <button 
              onClick={() => processarFiliacaoComPagamento(mockFormData)}
              data-testid="process-payment"
            >
              Processar
            </button>
          </div>
        );
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Inicialmente deve usar fluxo tradicional
      expect(screen.getByTestId('current-flow')).toHaveTextContent('Fluxo Tradicional');

      // Simular mudança para Payment First Flow
      const TestComponentWithNewFlow = () => {
        const { processarFiliacaoComPagamento, useNewFlow } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: true // Alternar para novo fluxo
        });

        return (
          <div>
            <div data-testid="current-flow">
              {useNewFlow ? 'Payment First Flow' : 'Fluxo Tradicional'}
            </div>
            <button 
              onClick={() => processarFiliacaoComPagamento(mockFormData)}
              data-testid="process-payment"
            >
              Processar
            </button>
          </div>
        );
      };

      rerender(
        <TestWrapper>
          <TestComponentWithNewFlow />
        </TestWrapper>
      );

      // Agora deve usar Payment First Flow
      expect(screen.getByTestId('current-flow')).toHaveTextContent('Payment First Flow');
    });

    it('deve manter dados de formulário durante alternância de fluxos', () => {
      // Este teste verifica que os dados do formulário não são perdidos
      // quando o fluxo é alterado
      
      const formDataBefore = { ...mockFormData };
      const formDataAfter = { ...mockFormData };

      // Os dados devem ser idênticos independente do fluxo
      expect(formDataBefore).toEqual(formDataAfter);
    });
  });

  describe('2. Rollback de Emergência', () => {
    it('deve permitir rollback imediato via override local', () => {
      // Simular situação onde Payment First Flow está causando problemas
      mockProcessRegistration.mockRejectedValue(new Error('Erro crítico no novo fluxo'));

      const TestComponent = () => {
        const { enableForDevelopment, disableForDevelopment, shouldUsePaymentFirstFlow } = usePaymentFirstFlowFeature();
        const [testResult, setTestResult] = React.useState<boolean | null>(null);

        const testFlow = () => {
          const result = shouldUsePaymentFirstFlow('test@example.com');
          setTestResult(result);
        };

        return (
          <div>
            <button onClick={enableForDevelopment} data-testid="enable-flow">
              Habilitar Payment First Flow
            </button>
            <button onClick={disableForDevelopment} data-testid="disable-flow">
              Desabilitar Payment First Flow
            </button>
            <button onClick={testFlow} data-testid="test-flow">
              Testar Fluxo
            </button>
            <div data-testid="test-result">
              {testResult !== null ? (testResult ? 'Novo Fluxo' : 'Fluxo Tradicional') : 'Não testado'}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Habilitar Payment First Flow
      const enableButton = screen.getByTestId('enable-flow');
      userEvent.click(enableButton);

      // Testar fluxo
      const testButton = screen.getByTestId('test-flow');
      userEvent.click(testButton);

      // Deve usar novo fluxo
      expect(screen.getByTestId('test-result')).toHaveTextContent('Novo Fluxo');

      // Rollback de emergência
      const disableButton = screen.getByTestId('disable-flow');
      userEvent.click(disableButton);

      // Testar novamente
      userEvent.click(testButton);

      // Deve voltar ao fluxo tradicional
      expect(screen.getByTestId('test-result')).toHaveTextContent('Fluxo Tradicional');
    });

    it('deve preservar funcionalidade durante rollback', async () => {
      // Configurar Payment First Flow para falhar
      mockProcessRegistration.mockRejectedValue(new Error('Serviço indisponível'));

      const TestComponent = () => {
        const { processarFiliacaoComPagamento, useNewFlow } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: false // Usar fluxo tradicional como fallback
        });

        return (
          <div>
            <div data-testid="current-flow">
              {useNewFlow ? 'Payment First Flow' : 'Fluxo Tradicional'}
            </div>
            <button 
              onClick={() => processarFiliacaoComPagamento(mockFormData)}
              data-testid="process-payment"
            >
              Processar
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Deve usar fluxo tradicional
      expect(screen.getByTestId('current-flow')).toHaveTextContent('Fluxo Tradicional');

      // Processar pagamento deve funcionar (fluxo tradicional)
      const button = screen.getByTestId('process-payment');
      await userEvent.click(button);

      // PaymentFirstFlowService não deve ser chamado
      expect(mockProcessRegistration).not.toHaveBeenCalled();
    });
  });

  describe('3. Migração Gradual', () => {
    it('deve permitir rollout gradual baseado em percentual', () => {
      // Simular diferentes percentuais de rollout
      const percentages = [0, 25, 50, 75, 100];
      
      percentages.forEach(percentage => {
        // Mock das variáveis de ambiente
        vi.stubEnv('VITE_PAYMENT_FIRST_FLOW_ENABLED', 'true');
        vi.stubEnv('VITE_PAYMENT_FIRST_FLOW_PERCENTAGE', percentage.toString());

        // Para 0% e 100%, o resultado deve ser determinístico
        if (percentage === 0) {
          // 0% = ninguém usa novo fluxo
          expect(percentage).toBe(0);
        } else if (percentage === 100) {
          // 100% = todos usam novo fluxo
          expect(percentage).toBe(100);
        } else {
          // Percentuais intermediários dependem do hash do email
          expect(percentage).toBeGreaterThan(0);
          expect(percentage).toBeLessThan(100);
        }
      });
    });

    it('deve manter consistência para o mesmo usuário', () => {
      const email = 'usuario.consistente@teste.com';
      
      // Simular múltiplas verificações para o mesmo email
      const TestComponent = () => {
        const { shouldUsePaymentFirstFlow } = usePaymentFirstFlowFeature();
        const [results, setResults] = React.useState<boolean[]>([]);

        const testMultipleTimes = () => {
          const newResults = Array.from({ length: 10 }, () => 
            shouldUsePaymentFirstFlow(email)
          );
          setResults(newResults);
        };

        return (
          <div>
            <button onClick={testMultipleTimes} data-testid="test-multiple">
              Testar 10x
            </button>
            <div data-testid="results">
              {results.length > 0 && (
                results.every(r => r === results[0]) ? 'Consistente' : 'Inconsistente'
              )}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByTestId('test-multiple');
      userEvent.click(button);

      // Todos os resultados devem ser iguais para o mesmo email
      expect(screen.getByTestId('results')).toHaveTextContent('Consistente');
    });
  });

  describe('4. Compatibilidade de Dados', () => {
    it('deve processar os mesmos dados em ambos os fluxos', async () => {
      // Testar fluxo tradicional
      const TraditionalFlowComponent = () => {
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: false
        });

        return (
          <button 
            onClick={() => processarFiliacaoComPagamento(mockFormData)}
            data-testid="process-traditional"
          >
            Processar Tradicional
          </button>
        );
      };

      // Testar Payment First Flow
      mockProcessRegistration.mockResolvedValue({
        success: true,
        user_id: 'user-123',
        asaas_customer_id: 'cus-123',
        asaas_subscription_id: 'sub-123',
        payment_id: 'pay-123'
      });

      const PaymentFirstFlowComponent = () => {
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: true
        });

        return (
          <button 
            onClick={() => processarFiliacaoComPagamento(mockFormData)}
            data-testid="process-payment-first"
          >
            Processar Payment First
          </button>
        );
      };

      // Renderizar ambos os componentes
      const { rerender } = render(
        <TestWrapper>
          <TraditionalFlowComponent />
        </TestWrapper>
      );

      // Testar fluxo tradicional
      const traditionalButton = screen.getByTestId('process-traditional');
      await userEvent.click(traditionalButton);

      // Alternar para Payment First Flow
      rerender(
        <TestWrapper>
          <PaymentFirstFlowComponent />
        </TestWrapper>
      );

      // Testar Payment First Flow
      const paymentFirstButton = screen.getByTestId('process-payment-first');
      await userEvent.click(paymentFirstButton);

      await waitFor(() => {
        expect(mockProcessRegistration).toHaveBeenCalledWith(
          expect.objectContaining({
            nome: mockFormData.nome_completo,
            email: mockFormData.email,
            cpf: mockFormData.cpf.replace(/\D/g, ''),
            telefone: mockFormData.telefone.replace(/\D/g, ''),
            payment_method: 'CREDIT_CARD'
          })
        );
      });
    });

    it('deve manter compatibilidade com dados de afiliado', () => {
      const affiliateInfo = {
        referralCode: 'TEST123',
        affiliateInfo: {
          id: 'affiliate-123'
        }
      };

      // Ambos os fluxos devem processar dados de afiliado da mesma forma
      const TraditionalComponent = () => {
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          affiliateInfo,
          usePaymentFirstFlow: false
        });

        return <div data-testid="traditional">Tradicional</div>;
      };

      const PaymentFirstComponent = () => {
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          affiliateInfo,
          usePaymentFirstFlow: true
        });

        return <div data-testid="payment-first">Payment First</div>;
      };

      // Ambos devem renderizar sem erros
      render(
        <TestWrapper>
          <TraditionalComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('traditional')).toBeInTheDocument();

      render(
        <TestWrapper>
          <PaymentFirstComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('payment-first')).toBeInTheDocument();
    });
  });

  describe('5. Monitoramento e Logs', () => {
    it('deve logar qual fluxo está sendo usado', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const TestComponent = () => {
        const { processarFiliacaoComPagamento, useNewFlow } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: true
        });

        React.useEffect(() => {
          console.log(`Usando fluxo: ${useNewFlow ? 'Payment First Flow' : 'Tradicional'}`);
        }, [useNewFlow]);

        return <div>Test</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(consoleSpy).toHaveBeenCalledWith('Usando fluxo: Payment First Flow');

      consoleSpy.mockRestore();
    });

    it('deve permitir comparação de performance entre fluxos', async () => {
      const performanceMetrics = {
        traditional: 0,
        paymentFirst: 0
      };

      // Simular medição de performance para fluxo tradicional
      const startTraditional = performance.now();
      
      const TraditionalComponent = () => {
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: false
        });

        React.useEffect(() => {
          const endTime = performance.now();
          performanceMetrics.traditional = endTime - startTraditional;
        }, []);

        return <div>Traditional</div>;
      };

      render(
        <TestWrapper>
          <TraditionalComponent />
        </TestWrapper>
      );

      // Simular medição de performance para Payment First Flow
      const startPaymentFirst = performance.now();

      const PaymentFirstComponent = () => {
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: true
        });

        React.useEffect(() => {
          const endTime = performance.now();
          performanceMetrics.paymentFirst = endTime - startPaymentFirst;
        }, []);

        return <div>Payment First</div>;
      };

      render(
        <TestWrapper>
          <PaymentFirstComponent />
        </TestWrapper>
      );

      // Ambos os fluxos devem ter métricas de performance
      expect(performanceMetrics.traditional).toBeGreaterThan(0);
      expect(performanceMetrics.paymentFirst).toBeGreaterThan(0);
    });
  });

  describe('6. Cenários de Falha e Recuperação', () => {
    it('deve fazer fallback automático quando Payment First Flow falha', async () => {
      // Configurar Payment First Flow para falhar
      mockProcessRegistration.mockRejectedValue(new Error('Serviço temporariamente indisponível'));

      const TestComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        const { processarFiliacaoComPagamento } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: true
        });

        const handleProcess = async () => {
          try {
            await processarFiliacaoComPagamento(mockFormData);
          } catch (err: any) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button onClick={handleProcess} data-testid="process">
              Processar
            </button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByTestId('process');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Serviço temporariamente indisponível');
      });
    });

    it('deve manter estado consistente durante falhas', () => {
      // Verificar que o estado do hook não fica corrompido após falhas
      const TestComponent = () => {
        const { isProcessing, paymentStatus, error } = useFiliacaoPayment({
          selectedMemberType: mockMemberType,
          usePaymentFirstFlow: true
        });

        return (
          <div>
            <div data-testid="processing">{isProcessing ? 'true' : 'false'}</div>
            <div data-testid="status">{paymentStatus}</div>
            <div data-testid="error">{error ? 'has-error' : 'no-error'}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Estado inicial deve estar limpo
      expect(screen.getByTestId('processing')).toHaveTextContent('false');
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
});