/**
 * Testes unitários para hooks de conteúdo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHomeContent, useAboutContent, useLeadershipContent, useContactContent } from '@/hooks/useContent';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock do sistema de erro
vi.mock('@/lib/errorHandling', () => ({
  withAutoRetry: vi.fn((fn) => fn),
  createContextualError: vi.fn((error, context) => error)
}));

// Mock das configurações de cache
vi.mock('@/lib/cache', () => ({
  CACHE_KEYS: {
    content: (pageName: string) => ['content', pageName]
  },
  getCacheConfigForContent: vi.fn(() => ({
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  })),
  shouldRefetchContent: vi.fn(() => false)
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useContent hooks', () => {
  let mockSupabase: any;

  beforeEach(() => {
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useHomeContent', () => {
    it('deve retornar conteúdo padrão quando não há dados customizados', async () => {
      // Mock da resposta do Supabase (sem dados)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Não encontrado
            })
          })
        })
      });

      const { result } = renderHook(() => useHomeContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content).toBeDefined();
      expect(result.current.content.banner_principal).toBeDefined();
      expect(result.current.content.banner_principal.titulo_principal).toBe('Fortalecendo o Reino de Deus');
      expect(result.current.hasCustomContent).toBe(false);
    });

    it('deve retornar conteúdo customizado quando há dados', async () => {
      const customContent = {
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
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                page_name: 'home',
                content_json: customContent,
                last_updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      const { result } = renderHook(() => useHomeContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content.banner_principal.titulo_principal).toBe('Título Customizado');
      expect(result.current.hasCustomContent).toBe(true);
    });

    it('deve lidar com erro de rede graciosamente', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      });

      const { result } = renderHook(() => useHomeContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deve retornar conteúdo padrão mesmo com erro
      expect(result.current.content).toBeDefined();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useAboutContent', () => {
    it('deve retornar estrutura padrão da página sobre', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const { result } = renderHook(() => useAboutContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content.titulo).toBe('Sobre a COMADEMIG');
      expect(result.current.content.missao).toBeDefined();
      expect(result.current.content.visao).toBeDefined();
      expect(result.current.content.historia).toBeDefined();
      expect(result.current.hasCustomContent).toBe(false);
    });

    it('deve converter texto único da história para array de parágrafos', async () => {
      const contentWithSingleText = {
        titulo: 'Sobre Customizado',
        descricao: 'Descrição customizada',
        missao: { titulo: 'Missão', texto: 'Texto da missão' },
        visao: { titulo: 'Visão', texto: 'Texto da visão' },
        historia: {
          titulo: 'História',
          texto: 'História em texto único'
        }
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                page_name: 'sobre',
                content_json: contentWithSingleText,
                last_updated_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      });

      const { result } = renderHook(() => useAboutContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content.historia.paragrafos).toEqual(['História em texto único']);
      expect(result.current.hasCustomContent).toBe(true);
    });
  });

  describe('useLeadershipContent', () => {
    it('deve retornar líderes padrão quando não há dados customizados', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const { result } = renderHook(() => useLeadershipContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content.titulo).toBe('Nossa Liderança');
      expect(result.current.content.lideres).toBeDefined();
      expect(Array.isArray(result.current.content.lideres)).toBe(true);
      expect(result.current.content.lideres.length).toBeGreaterThan(0);
      expect(result.current.hasCustomContent).toBe(false);
    });
  });

  describe('useContactContent', () => {
    it('deve retornar informações de contato padrão', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const { result } = renderHook(() => useContactContent(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content.titulo).toBe('Entre em Contato');
      expect(result.current.content.endereco).toBeDefined();
      expect(result.current.content.telefones).toBeDefined();
      expect(result.current.content.emails).toBeDefined();
      expect(Array.isArray(result.current.content.telefones)).toBe(true);
      expect(Array.isArray(result.current.content.emails)).toBe(true);
      expect(result.current.hasCustomContent).toBe(false);
    });
  });
});