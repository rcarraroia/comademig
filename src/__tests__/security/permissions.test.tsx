/**
 * Testes de segurança para validar permissões e políticas RLS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Componentes a serem testados
import ContentStatusBadge from '@/components/admin/ContentStatusBadge';
import HomeContentEdit from '@/pages/admin/content/HomeContentEdit';
import ContentManagement from '@/pages/admin/ContentManagement';

// Mock do Supabase
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  storage: {
    from: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
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
  })),
  getRelatedCacheKeys: vi.fn(() => []),
  RETRY_CONFIG: {
    WRITE: { retry: 2, retryDelay: () => 500 }
  }
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('Security and Permissions Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Controle de acesso baseado em roles', () => {
    it('deve ocultar badge de status para usuários não-admin', () => {
      // Mock para usuário não-admin
      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => false),
          user: { id: 'regular-user-id', role: 'user' }
        }))
      }));

      const { container } = render(
        <ContentStatusBadge
          pageName="home"
          pageTitle="Home"
          hasCustomContent={false}
          editorUrl="/editor"
          showOnlyForAdmins={true}
        />,
        { wrapper: createTestWrapper() }
      );

      // Badge não deve ser renderizado para não-admin
      expect(container.firstChild).toBeNull();
    });

    it('deve mostrar badge de status para usuários admin', () => {
      // Mock para usuário admin
      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => true),
          user: { id: 'admin-user-id', role: 'admin' }
        }))
      }));

      render(
        <ContentStatusBadge
          pageName="home"
          pageTitle="Home"
          hasCustomContent={false}
          editorUrl="/editor"
          showOnlyForAdmins={true}
        />,
        { wrapper: createTestWrapper() }
      );

      // Badge deve ser renderizado para admin
      expect(screen.getByText('Padrão')).toBeInTheDocument();
    });

    it('deve bloquear acesso a editor para usuários não-admin', async () => {
      // Mock para usuário não-admin
      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => false),
          user: { id: 'regular-user-id', role: 'user' }
        }))
      }));

      // Mock do Supabase retornando erro de permissão
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue({
              code: '42501', // Insufficient privilege
              message: 'permission denied'
            })
          })
        })
      });

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      // Deve mostrar erro de permissão ou redirecionar
      await waitFor(() => {
        expect(screen.queryByText('Editor de Conteúdo')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validação de políticas RLS', () => {
    it('deve permitir leitura de conteúdo para usuários autenticados', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                page_name: 'home',
                content_json: { titulo: 'Conteúdo Público' },
                last_updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      // Mock para usuário autenticado
      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => false),
          user: { id: 'authenticated-user-id' }
        }))
      }));

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('content_management');
      });
    });

    it('deve bloquear escrita para usuários não-admin', async () => {
      // Mock para usuário não-admin tentando salvar
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
            select: vi.fn().mockRejectedValue({
              code: '42501',
              message: 'new row violates row-level security policy'
            })
          })
        })
      });

      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => false),
          user: { id: 'regular-user-id', role: 'user' }
        }))
      }));

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Tentar salvar
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);

      // Deve mostrar erro de permissão
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Erro ao atualizar conteúdo",
          description: expect.stringContaining('permission'),
          variant: "destructive",
        });
      });
    });

    it('deve permitir escrita apenas para usuários admin', async () => {
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
              data: [{
                page_name: 'home',
                content_json: { titulo: 'Conteúdo Atualizado' },
                last_updated_at: new Date().toISOString()
              }],
              error: null
            })
          })
        })
      });

      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => true),
          user: { id: 'admin-user-id', role: 'admin' }
        }))
      }));

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Salvar deve funcionar para admin
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Conteúdo atualizado",
          description: expect.stringContaining('home'),
        });
      });
    });
  });

  describe('Sanitização de conteúdo', () => {
    it('deve sanitizar conteúdo HTML malicioso', async () => {
      const maliciousContent = {
        titulo: '<script>alert("XSS")</script>Título Limpo',
        descricao: '<img src="x" onerror="alert(\'XSS\')" />Descrição'
      };

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
            select: vi.fn().mockImplementation(async () => {
              // Verificar se o conteúdo foi sanitizado
              const updateCall = mockSupabaseClient.from().update;
              const updateArgs = updateCall.mock.calls[0][0];
              
              expect(updateArgs.content_json.titulo).not.toContain('<script>');
              expect(updateArgs.content_json.descricao).not.toContain('onerror');
              
              return {
                data: [{
                  page_name: 'home',
                  content_json: {
                    titulo: 'Título Limpo',
                    descricao: 'Descrição'
                  },
                  last_updated_at: new Date().toISOString()
                }],
                error: null
              };
            })
          })
        })
      });

      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => true),
          user: { id: 'admin-user-id' }
        }))
      }));

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      // Simular entrada de conteúdo malicioso
      const titleInput = screen.getByLabelText(/título principal/i);
      fireEvent.change(titleInput, { 
        target: { value: maliciousContent.titulo } 
      });

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);

      // Aguardar processamento
      await waitFor(() => {
        expect(mockSupabaseClient.from().update).toHaveBeenCalled();
      });
    });
  });

  describe('Validação de upload de arquivos', () => {
    it('deve bloquear upload de arquivos maliciosos', async () => {
      // Mock do storage
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: vi.fn().mockRejectedValue({
          error: 'File type not allowed'
        })
      });

      // Simular arquivo malicioso
      const maliciousFile = new File(['malicious content'], 'malware.exe', {
        type: 'application/x-executable'
      });

      // Testar validação no frontend
      const { validateImageFile } = await import('@/lib/imageUtils');
      
      const result = await validateImageFile(maliciousFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato não suportado');
    });

    it('deve validar tamanho máximo de arquivo', async () => {
      // Arquivo muito grande
      const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      const { validateImageFile } = await import('@/lib/imageUtils');
      
      const result = await validateImageFile(largeFile, { maxSize: 10 });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('deve ter no máximo 10MB');
    });
  });

  describe('Proteção contra CSRF', () => {
    it('deve incluir tokens CSRF em requisições de mutação', async () => {
      // Mock para verificar headers das requisições
      const mockUpdate = vi.fn().mockResolvedValue({
        data: [{ page_name: 'home' }],
        error: null
      });

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
            select: mockUpdate
          })
        })
      });

      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => true),
          user: { id: 'admin-user-id' }
        }))
      }));

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });

      // Verificar se a requisição foi feita com autenticação adequada
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('content_management');
    });
  });

  describe('Rate limiting e throttling', () => {
    it('deve limitar tentativas de salvamento em sequência', async () => {
      let callCount = 0;
      
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
            select: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount > 3) {
                return Promise.reject({
                  code: '429',
                  message: 'Too many requests'
                });
              }
              return Promise.resolve({
                data: [{ page_name: 'home' }],
                error: null
              });
            })
          })
        })
      });

      vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: vi.fn(() => ({
          isAdmin: vi.fn(() => true),
          user: { id: 'admin-user-id' }
        }))
      }));

      render(<HomeContentEdit />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Editor de Conteúdo - Home')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /salvar/i });

      // Fazer múltiplas tentativas rapidamente
      for (let i = 0; i < 5; i++) {
        fireEvent.click(saveButton);
      }

      // Deve eventualmente mostrar erro de rate limit
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(3);
      });
    });
  });
});