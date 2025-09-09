import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateContentByPage, getFirstValidationError } from '@/lib/validations/content';
import { withAutoRetry, createContextualError, useErrorHandler } from '@/lib/errorHandling';
import { CACHE_KEYS, getRelatedCacheKeys, RETRY_CONFIG } from '@/lib/cache';

interface UpdateContentParams {
  pageName: string;
  content: any;
}

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  // Função com retry automático para operações de rede
  const updateContentWithRetry = withAutoRetry(
    async ({ pageName, content }: UpdateContentParams) => {
      console.log('🔍 Atualizando conteúdo:', { pageName, content });
      
      // Validar conteúdo antes de salvar
      const validationResult = validateContentByPage(pageName, content);
      if (!validationResult.success) {
        const errorMessage = getFirstValidationError(validationResult.error?.issues || []);
        throw new Error(`Erro de validação: ${errorMessage}`);
      }
      
      const { data, error } = await supabase
        .from('content_management')
        .update({
          content_json: content,
          last_updated_at: new Date().toISOString()
        })
        .eq('page_name', pageName)
        .select('page_name, content_json, last_updated_at');

      if (error) {
        console.error('❌ Erro no update:', error);
        throw createContextualError(error, {
          operation: 'save',
          resource: `conteúdo da página ${pageName}`,
          userMessage: `Erro ao salvar conteúdo da página ${pageName}. Tente novamente.`
        });
      }

      console.log('✅ Conteúdo atualizado:', data);
      return data?.[0] || data;
    },
    RETRY_CONFIG.WRITE
  );

  return useMutation({
    mutationFn: updateContentWithRetry,
    onSuccess: (data, variables) => {
      // Invalidação inteligente de cache relacionado
      const relatedKeys = getRelatedCacheKeys(variables.pageName);
      relatedKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      // Atualizar cache com os novos dados imediatamente
      queryClient.setQueryData(CACHE_KEYS.content(variables.pageName), data);
      
      toast({
        title: "Conteúdo atualizado",
        description: `O conteúdo da página "${variables.pageName}" foi atualizado com sucesso.`,
      });
    },
    onError: (error: any, variables) => {
      console.error('Erro ao atualizar conteúdo:', error);
      
      // Usar o sistema de tratamento de erros
      const appError = handleError(error, {
        showToast: false, // Vamos mostrar toast customizado
        onRetry: () => {
          // Implementar retry manual se necessário
          console.log('Retry solicitado pelo usuário');
        }
      });
      
      // Toast customizado baseado no tipo de erro
      toast({
        title: "Erro ao atualizar conteúdo",
        description: appError.message,
        variant: "destructive",
      });
    }
  });
};

// Hook para limpar cache de conteúdo
export const useClearContentCache = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['content'] });
  };
};

// Hook para pré-carregar conteúdo
export const usePrefetchContent = () => {
  const queryClient = useQueryClient();
  
  return (pageName: string) => {
    queryClient.prefetchQuery({
      queryKey: ['content', pageName],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('content_management')
          .select('page_name, content_json, last_updated_at, created_at')
          .eq('page_name', pageName)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };
};