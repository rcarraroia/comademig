import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CACHE_KEYS, PREFETCH_CONFIG, getRelatedCacheKeys } from '@/lib/cache';
import { supabase } from '@/integrations/supabase/client';
import { withAutoRetry, createContextualError } from '@/lib/errorHandling';

// Função para prefetch de conteúdo
const prefetchContent = withAutoRetry(
  async (pageName: string) => {
    const { data, error } = await supabase
      .from('content_management')
      .select('page_name, content_json, last_updated_at, created_at')
      .eq('page_name', pageName)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`Aviso: Falha no prefetch do conteúdo da página ${pageName}:`, error);
      return null; // Não lançar erro para prefetch
    }

    return data;
  },
  {
    maxAttempts: 2, // Menos tentativas para prefetch
    delay: 500,
    backoff: true
  }
);

/**
 * Hook para prefetch inteligente de conteúdo relacionado
 */
export const useContentPrefetch = (currentPage: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Definir páginas relacionadas para prefetch
    const relatedPages = getRelatedPagesForPrefetch(currentPage);
    
    // Prefetch das páginas relacionadas
    relatedPages.forEach(pageName => {
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.content(pageName),
        queryFn: () => prefetchContent(pageName),
        ...PREFETCH_CONFIG.RELATED_CONTENT,
      });
    });
  }, [currentPage, queryClient]);
};

/**
 * Determina quais páginas devem ser prefetchadas baseado na página atual
 */
const getRelatedPagesForPrefetch = (currentPage: string): string[] => {
  const prefetchMap: Record<string, string[]> = {
    'home': ['sobre', 'contato'], // Na home, prefetch sobre e contato
    'sobre': ['lideranca', 'contato'], // Na sobre, prefetch liderança e contato
    'lideranca': ['sobre', 'contato'], // Na liderança, prefetch sobre e contato
    'contato': ['sobre'], // No contato, prefetch sobre
  };

  return prefetchMap[currentPage] || [];
};

/**
 * Hook para prefetch de lista de conteúdos (para admin)
 */
export const useContentListPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchContentList = () => {
    queryClient.prefetchQuery({
      queryKey: CACHE_KEYS.contentList(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('content_management')
          .select('page_name, last_updated_at, created_at')
          .order('page_name');

        if (error) {
          console.warn('Aviso: Falha no prefetch da lista de conteúdos:', error);
          return [];
        }

        return data || [];
      },
      ...PREFETCH_CONFIG.RELATED_CONTENT,
    });
  };

  return { prefetchContentList };
};

/**
 * Hook para invalidação inteligente de cache
 */
export const useContentCacheInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateContentCache = (pageName: string) => {
    // Invalidar cache da página específica
    const relatedKeys = getRelatedCacheKeys(pageName);
    
    relatedKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };

  const invalidateAllContentCache = () => {
    queryClient.invalidateQueries({ queryKey: ['content'] });
  };

  const refreshContentCache = async (pageName: string) => {
    // Forçar refetch imediato
    await queryClient.refetchQueries({ 
      queryKey: CACHE_KEYS.content(pageName),
      type: 'active'
    });
  };

  return {
    invalidateContentCache,
    invalidateAllContentCache,
    refreshContentCache,
  };
};