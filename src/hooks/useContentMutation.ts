import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateContentParams {
  pageName: string;
  content: any;
}

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pageName, content }: UpdateContentParams) => {
      const { data, error } = await supabase
        .from('content_management')
        .upsert({
          page_name: pageName,
          content_json: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_name'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar cache da página específica
      queryClient.invalidateQueries({ queryKey: ['content', variables.pageName] });
      
      // Invalidar cache geral de conteúdo
      queryClient.invalidateQueries({ queryKey: ['content'] });
      
      toast({
        title: "Conteúdo atualizado",
        description: `O conteúdo da página "${variables.pageName}" foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar conteúdo:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Erro inesperado ao atualizar o conteúdo",
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
          .select('*')
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