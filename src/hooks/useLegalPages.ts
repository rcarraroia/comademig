import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LegalPageSection {
  title: string;
  content: string;
  items: string[];
}

interface LegalPageContent {
  title: string;
  sections: LegalPageSection[];
}

interface LegalPageData {
  page_name: string;
  content_json: LegalPageContent;
  last_updated_at: string;
  created_at: string;
}

/**
 * Hook para buscar conteúdo da Política de Privacidade
 */
export const usePrivacidadeContent = () => {
  return useQuery({
    queryKey: ['content', 'privacidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_management')
        .select('page_name, content_json, last_updated_at, created_at')
        .eq('page_name', 'privacidade')
        .single();

      if (error) {
        console.error('Erro ao carregar Política de Privacidade:', error);
        throw error;
      }

      return data as LegalPageData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
};

/**
 * Hook para buscar conteúdo dos Termos de Uso
 */
export const useTermosContent = () => {
  return useQuery({
    queryKey: ['content', 'termos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_management')
        .select('page_name, content_json, last_updated_at, created_at')
        .eq('page_name', 'termos')
        .single();

      if (error) {
        console.error('Erro ao carregar Termos de Uso:', error);
        throw error;
      }

      return data as LegalPageData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
};

/**
 * Hook genérico para buscar qualquer página legal
 */
export const useLegalPage = (pageName: 'privacidade' | 'termos') => {
  return useQuery({
    queryKey: ['content', pageName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_management')
        .select('page_name, content_json, last_updated_at, created_at')
        .eq('page_name', pageName)
        .single();

      if (error) {
        console.error(`Erro ao carregar ${pageName}:`, error);
        throw error;
      }

      return data as LegalPageData;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!pageName,
  });
};

// Exportar tipos para uso em outros arquivos
export type { LegalPageSection, LegalPageContent, LegalPageData };
