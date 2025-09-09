/**
 * Testes unitários para hook de mutação de conteúdo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateContent } from '@/hooks/useContentMutation';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock do toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
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
    content: (pageName: string) => ['content', pageName]
  },
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
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

describe('useUpdateContent', () => {
  let mockSupabase: any;
  let mockToast: any;
  let mockValidation: any;

  beforeEach(() => {
    const { supabase } = require('@/integrations/supabase/client');
    const { useToast } = require('@/hooks/use-toast');
    const { validateContentByPage } = require('@/lib/validations/content');
    
    mockSupabase = supabase;
    mockToast = useToast().toast;
    mockValidation = validateContentByPage;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve atualizar conteúdo com sucesso', async () => {
    const mockData = {
      page_name: 'home',
      content_json: { titulo: 'Novo Título' },
      last_updated_at: new Date().toISOString()
    };

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [mockData],
            error: null
          })
        })
      })
    });

    mockValidation.mockReturnValue({ success: true });

    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        pageName: 'home',
        content: { titulo: 'Novo Título' }
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Conteúdo atualizado",
      description: 'O conteúdo da página "home" foi atualizado com sucesso.',
    });
  });

  it('deve lidar com erro de validação', async () => {
    mockValidation.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: 'Campo obrigatório' }]
      }
    });

    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        pageName: 'home',
        content: { titulo: '' } // Conteúdo inválido
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('deve lidar com erro de rede', async () => {
    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' }
          })
        })
      })
    });

    mockValidation.mockReturnValue({ success: true });

    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        pageName: 'home',
        content: { titulo: 'Novo Título' }
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Erro ao atualizar conteúdo",
      description: expect.any(String),
      variant: "destructive",
    });
  });

  it('deve invalidar cache relacionado após sucesso', async () => {
    const mockData = {
      page_name: 'home',
      content_json: { titulo: 'Novo Título' },
      last_updated_at: new Date().toISOString()
    };

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [mockData],
            error: null
          })
        })
      })
    });

    mockValidation.mockReturnValue({ success: true });

    const queryClient = new QueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateContent(), { wrapper });

    await act(async () => {
      result.current.mutate({
        pageName: 'home',
        content: { titulo: 'Novo Título' }
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verificar se o cache foi invalidado
    expect(invalidateQueriesSpy).toHaveBeenCalled();
    expect(setQueryDataSpy).toHaveBeenCalledWith(['content', 'home'], mockData);
  });
});