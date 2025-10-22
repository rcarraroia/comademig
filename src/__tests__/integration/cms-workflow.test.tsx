/**
 * Testes de integração end-to-end para fluxo completo do CMS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Componentes a serem testados
import Home from '@/pages/Home';
import HomeContentEdit from '@/pages/admin/content/HomeContentEdit';
import ContentManagement from '@/pages/admin/ContentManagement';

// Mock do Supabase
const mockSupabaseClient = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
    createBucket: vi.fn(),
    listBuckets: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

// Mock do contexto de autenticação
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAdmin: vi.fn(() => true),
    user: { id: 'test-user-id' }
  }))
}));

// Mock do toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast
  }))
}));

// Mock das validações
vi.mock('@/lib/validations/content', () => ({
  validateContentByPage: vi.fn(() => ({ success: true })),
  getFirstValidationError: vi.fn(() => 'Erro de validação')
}));

// Mock do sistema de erro
vi.mock('@/lib/errorHandling', () => ({
  withAutoRetry: vi.fn((fn) => fn),
  createContextualError: vi.fn((error, context) => error),
  useErrorHandler: vi.fn(() => ({
    handleError: vi.fn((error) => ({ message: error.message }))
  }))
}));

// Mock das configurações de cache
vi.mock('@/lib/cache', () => ({
  CACHE_KEYS: {
    content: (pageName: string) => ['content', pageName],
    contentList: () => ['content', 'list']
  },
  getCacheConfigForContent: vi.fn(() => ({
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  })),
  shouldRefetchContent: vi.fn(() => false),
  getRelatedCacheKeys: vi.fn((pageName) => [
    ['content', pageName],
    ['content', 'list']
  ]),
  RETRY_CONFIG: {
    WRITE: {
      retry: 2,
      retryDelay: () => 500
    }
  }
}));

// Mock do prefetch
vi.mock('@/hooks/useContentPrefetch', () => ({
  useContentPrefetch: vi.fn()
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CMS Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup padrão do mock do Supabase
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        }),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              page_name: 'home',
              content_json: { titulo: 'Novo Título' },
              last_updated_at: new Date().toISOString()
            }],
            error: null
          })
        })
      }),
      upsert: vi.fn().mockResolvedValue({
        data: [{
          page_name: 'home',
          content_json: { titulo: 'Novo Título' },
          last_updated_at: new Date().toISOString()
        }],
        error: null
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fluxo completo: Visualizar → Editar → Salvar → Visualizar', () => {
    it('deve permitir visualizar página com conteúdo padrão', async () => {
      render(<Home />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fortalecendo o Reino de Deus')).toBeInTheDocument();
      });

      // Verificar se o badge de status está presente para admin
      expect(screen.getByText('Padrão')).toBeInTheDocument();
    });

    it('deve permitir navegar para editor e editar conteúdo', async () => {
      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Encontrar campo de título e alterar
      const titleInput = screen.getByLabelText(/título principal/i);
      fireEvent.change(titleInput, { target: { value: 'Novo Título Customizado' } });

      expect(titleInput).toHaveValue('Novo Título Customizado');
    });

    it('deve salvar alterações e mostrar feedback', async () => {
      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Alterar conteúdo
      const titleInput = screen.getByLabelText(/título principal/i);
      fireEvent.change(titleInput, { target: { value: 'Título Atualizado' } });

      // Salvar
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      
      await act(async () => {
        fireEvent.click(saveButton);
      });

      // Verificar se toast de sucesso foi chamado
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Conteúdo atualizado",
          description: expect.stringContaining('home'),
        });
      });
    });

    it('deve mostrar conteúdo atualizado na página pública', async () => {
      // Mock para retornar conteúdo customizado
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                page_name: 'home',
                content_json: {
                  banner_principal: {
                    titulo_principal: 'Título Customizado',
                    subtitulo: 'Subtítulo Customizado',
                    texto_botao: 'Botão Customizado',
                    link_botao: '/custom'
                  },
                  cards_acao: [],
                  destaques_convencao: [],
                  noticias_recentes: [],
                  junte_se_missao: {
                    titulo_principal: 'Missão Customizada',
                    subtitulo: 'Subtítulo da Missão',
                    texto_botao: 'Junte-se',
                    link_botao: '/join'
                  }
                },
                last_updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      render(<Home />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Título Customizado')).toBeInTheDocument();
      });

      // Verificar se o badge mostra "Personalizado"
      expect(screen.getByText('Personalizado')).toBeInTheDocument();
    });
  });

  describe('Fluxo de gerenciamento de conteúdo', () => {
    it('deve listar todas as páginas disponíveis', async () => {
      // Mock da lista de conteúdos
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { page_name: 'home', last_updated_at: new Date().toISOString() },
              { page_name: 'sobre', last_updated_at: new Date().toISOString() },
              { page_name: 'lideranca', last_updated_at: new Date().toISOString() },
              { page_name: 'contato', last_updated_at: new Date().toISOString() }
            ],
            error: null
          })
        })
      });

      render(<ContentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Gerenciamento de Conteúdo')).toBeInTheDocument();
      });

      // Verificar se todas as páginas estão listadas
      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/sobre/i)).toBeInTheDocument();
      expect(screen.getByText(/liderança/i)).toBeInTheDocument();
      expect(screen.getByText(/contato/i)).toBeInTheDocument();
    });

    it('deve permitir navegar para editores específicos', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { page_name: 'home', last_updated_at: new Date().toISOString() }
            ],
            error: null
          })
        })
      });

      render(<ContentManagement />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Gerenciamento de Conteúdo')).toBeInTheDocument();
      });

      // Verificar se links para editores estão presentes
      const editLinks = screen.getAllByText(/editar/i);
      expect(editLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve lidar com erro de rede graciosamente', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      });

      render(<Home />, { wrapper: createTestWrapper() });

      // Deve mostrar conteúdo padrão mesmo com erro
      await waitFor(() => {
        expect(screen.getByText('Fortalecendo o Reino de Deus')).toBeInTheDocument();
      });
    });

    it('deve mostrar erro ao falhar no salvamento', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Save failed' }
            })
          })
        })
      });

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Tentar salvar
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      
      await act(async () => {
        fireEvent.click(saveButton);
      });

      // Verificar se toast de erro foi chamado
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Erro ao atualizar conteúdo",
          description: expect.any(String),
          variant: "destructive",
        });
      });
    });
  });

  describe('Performance e cache', () => {
    it('deve fazer prefetch de conteúdo relacionado', async () => {
      const { useContentPrefetch } = require('@/hooks/useContentPrefetch');
      
      render(<Home />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(useContentPrefetch).toHaveBeenCalledWith('home');
      });
    });

    it('deve invalidar cache após atualização', async () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      );

      render(<HomeContentEdit />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Salvar alterações
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      
      await act(async () => {
        fireEvent.click(saveButton);
      });

      // Verificar se cache foi invalidado
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalled();
      });
    });
  });
});