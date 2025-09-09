/**
 * Testes de performance para verificar tempos de carregamento
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { performance } from 'perf_hooks';

// Componentes a serem testados
import Home from '@/pages/Home';
import Sobre from '@/pages/Sobre';
import Lideranca from '@/pages/Lideranca';
import Contato from '@/pages/Contato';

// Mock do Supabase com delays simulados
const mockSupabaseClient = {
  from: vi.fn(),
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

// Mock do prefetch
vi.mock('@/hooks/useContentPrefetch', () => ({
  useContentPrefetch: vi.fn()
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

// Mock do sistema de erro
vi.mock('@/lib/errorHandling', () => ({
  withAutoRetry: vi.fn((fn) => fn),
  createContextualError: vi.fn((error, context) => error)
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
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

// Função para simular delay de rede
const createMockWithDelay = (data: any, delay: number = 0) => {
  return vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              data,
              error: data ? null : { code: 'PGRST116' }
            }), delay)
          )
        )
      })
    })
  });
};

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tempos de carregamento inicial', () => {
    it('deve carregar página Home em menos de 2 segundos', async () => {
      mockSupabaseClient.from = createMockWithDelay(null, 100); // 100ms de delay

      const startTime = performance.now();
      
      const { container } = render(<Home />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(container.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(2000); // Menos de 2 segundos
    });

    it('deve carregar página Sobre em menos de 2 segundos', async () => {
      mockSupabaseClient.from = createMockWithDelay(null, 150);

      const startTime = performance.now();
      
      render(<Sobre />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(2000);
    });

    it('deve carregar página Liderança em menos de 2 segundos', async () => {
      mockSupabaseClient.from = createMockWithDelay(null, 200);

      const startTime = performance.now();
      
      render(<Lideranca />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(2000);
    });

    it('deve carregar página Contato em menos de 2 segundos', async () => {
      mockSupabaseClient.from = createMockWithDelay(null, 120);

      const startTime = performance.now();
      
      render(<Contato />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(2000);
    });
  });

  describe('Performance com conteúdo customizado', () => {
    it('deve carregar conteúdo customizado sem degradação significativa', async () => {
      const customContent = {
        banner_principal: {
          titulo_principal: 'Título Customizado',
          subtitulo: 'Subtítulo Customizado',
          texto_botao: 'Botão Customizado',
          link_botao: '/custom'
        },
        cards_acao: Array(10).fill(0).map((_, i) => ({
          titulo: `Card ${i}`,
          descricao: `Descrição do card ${i}`,
          link_botao: `/card-${i}`
        })),
        destaques_convencao: Array(5).fill(0).map((_, i) => ({
          titulo: `Destaque ${i}`,
          descricao: `Descrição do destaque ${i}`,
          imagem: `https://example.com/image-${i}.jpg`,
          link: `/destaque-${i}`
        })),
        noticias_recentes: Array(8).fill(0).map((_, i) => ({
          titulo: `Notícia ${i}`,
          resumo: `Resumo da notícia ${i}`,
          imagem: `https://example.com/news-${i}.jpg`,
          data: new Date().toISOString(),
          link: `/noticia-${i}`
        })),
        junte_se_missao: {
          titulo_principal: 'Missão Customizada',
          subtitulo: 'Subtítulo da Missão',
          texto_botao: 'Junte-se',
          link_botao: '/join'
        }
      };

      mockSupabaseClient.from = createMockWithDelay({
        page_name: 'home',
        content_json: customContent,
        last_updated_at: new Date().toISOString()
      }, 200);

      const startTime = performance.now();
      
      render(<Home />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      }, { timeout: 4000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Mesmo com muito conteúdo, deve carregar em menos de 3 segundos
      expect(loadTime).toBeLessThan(3000);
    });
  });

  describe('Performance com falhas de rede', () => {
    it('deve mostrar fallback rapidamente quando há erro de rede', async () => {
      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => 
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Network error')), 500)
              )
            )
          })
        })
      });

      const startTime = performance.now();
      
      render(<Home />, { wrapper: createTestWrapper() });

      // Deve mostrar conteúdo padrão mesmo com erro
      await waitFor(() => {
        expect(document.querySelector('h1')).toBeInTheDocument();
      }, { timeout: 2000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Deve mostrar fallback rapidamente
      expect(loadTime).toBeLessThan(1500);
    });
  });

  describe('Performance de cache', () => {
    it('deve carregar mais rapidamente na segunda visita (cache hit)', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 10 * 60 * 1000, // 10 minutos
            staleTime: 5 * 60 * 1000, // 5 minutos
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      );

      mockSupabaseClient.from = createMockWithDelay(null, 200);

      // Primeira renderização
      const { unmount } = render(<Home />, { wrapper });
      
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });

      unmount();

      // Segunda renderização (deve usar cache)
      const startTime = performance.now();
      
      render(<Home />, { wrapper });

      await waitFor(() => {
        expect(document.querySelector('h1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Segunda visita deve ser muito mais rápida (cache hit)
      expect(loadTime).toBeLessThan(100);
    });
  });

  describe('Performance de imagens', () => {
    it('deve carregar imagens com lazy loading sem bloquear renderização', async () => {
      const contentWithImages = {
        page_name: 'home',
        content_json: {
          banner_principal: {
            titulo_principal: 'Título com Imagens',
            subtitulo: 'Subtítulo',
            texto_botao: 'Botão',
            link_botao: '/test'
          },
          cards_acao: [],
          destaques_convencao: Array(20).fill(0).map((_, i) => ({
            titulo: `Destaque ${i}`,
            descricao: `Descrição ${i}`,
            imagem: `https://example.com/large-image-${i}.jpg`,
            link: `/destaque-${i}`
          })),
          noticias_recentes: [],
          junte_se_missao: {
            titulo_principal: 'Missão',
            subtitulo: 'Subtítulo',
            texto_botao: 'Botão',
            link_botao: '/join'
          }
        },
        last_updated_at: new Date().toISOString()
      };

      mockSupabaseClient.from = createMockWithDelay(contentWithImages, 100);

      const startTime = performance.now();
      
      render(<Home />, { wrapper: createTestWrapper() });

      // Deve renderizar o texto rapidamente, mesmo com muitas imagens
      await waitFor(() => {
        expect(document.querySelector('h1')).toHaveTextContent('Título com Imagens');
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Renderização inicial não deve ser bloqueada pelas imagens
      expect(loadTime).toBeLessThan(1000);
    });
  });
});