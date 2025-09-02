import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContentData {
  page_name: string;
  content_json: any;
  updated_at?: string;
}

export const useContent = (pageName: string) => {
  return useQuery({
    queryKey: ['content', pageName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_management')
        .select('*')
        .eq('page_name', pageName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`Erro ao carregar conteúdo da página ${pageName}:`, error);
        throw error;
      }

      return data as ContentData | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook específico para conteúdo da home
export const useHomeContent = () => {
  const { data, isLoading, error } = useContent('home');
  
  // Estrutura padrão caso não haja conteúdo
  const defaultContent = {
    banner_principal: {
      titulo_principal: 'Fortalecendo o Reino de Deus',
      subtitulo: 'Convenção de Ministros das Assembleias de Deus em Minas Gerais',
      texto_botao: 'Conheça a COMADEMIG',
      link_botao: '/sobre'
    },
    cards_acao: [
      {
        titulo: 'Inscreva-se',
        descricao: 'Participe dos nossos eventos e congressos',
        link_botao: '/eventos'
      },
      {
        titulo: 'Filie-se',
        descricao: 'Torne-se membro da COMADEMIG',
        link_botao: '/filiacao'
      },
      {
        titulo: 'Regularização',
        descricao: 'Regularize sua igreja e documentação',
        link_botao: '/dashboard/regularizacao'
      },
      {
        titulo: 'Ao Vivo',
        descricao: 'Acompanhe nossos cultos e eventos',
        link_botao: '/eventos'
      }
    ],
    destaques_convencao: [],
    noticias_recentes: [],
    junte_se_missao: {
      titulo_principal: 'Junte-se à Nossa Missão',
      subtitulo: 'Faça parte da família COMADEMIG e fortaleça o Reino de Deus em Minas Gerais',
      texto_botao: 'Filie-se Agora',
      link_botao: '/filiacao'
    }
  };

  const content = data?.content_json || defaultContent;

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};

// Hook específico para conteúdo da página sobre
export const useAboutContent = () => {
  const { data, isLoading, error } = useContent('about');
  
  const defaultContent = {
    titulo: 'Sobre a COMADEMIG',
    descricao: 'Conheça nossa história, missão e compromisso com o Reino de Deus',
    missao: {
      titulo: 'Nossa Missão',
      texto: 'Fortalecer e unir os ministros das Assembleias de Deus em Minas Gerais, promovendo a comunhão fraternal, o crescimento espiritual e a expansão do Reino de Deus através da pregação do Evangelho e da formação ministerial.'
    },
    visao: {
      titulo: 'Nossa Visão',
      texto: 'Ser reconhecida como uma organização de excelência na formação e capacitação ministerial, contribuindo para o crescimento das Assembleias de Deus em Minas Gerais e para a expansão do Reino de Deus.'
    },
    historia: {
      titulo: 'Nossa História',
      texto: 'A COMADEMIG foi fundada com o propósito de unir e fortalecer os ministros das Assembleias de Deus em todo o estado de Minas Gerais, promovendo a comunhão, o crescimento espiritual e a capacitação ministerial.'
    }
  };

  const content = data?.content_json || defaultContent;

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};

// Hook específico para conteúdo da liderança
export const useLeadershipContent = () => {
  const { data, isLoading, error } = useContent('lideranca');
  
  const defaultContent = {
    titulo: 'Nossa Liderança',
    descricao: 'Conheça os líderes que conduzem a COMADEMIG',
    lideres: []
  };

  const content = data?.content_json || defaultContent;

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};

// Hook específico para conteúdo de contato
export const useContactContent = () => {
  const { data, isLoading, error } = useContent('contato');
  
  const defaultContent = {
    titulo: 'Entre em Contato',
    descricao: 'Estamos aqui para ajudar você',
    endereco: {
      rua: 'Rua das Assembleias, 123',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30000-000'
    },
    telefones: [
      { tipo: 'Principal', numero: '(31) 3333-4444' },
      { tipo: 'WhatsApp', numero: '(31) 99999-8888' }
    ],
    emails: [
      { tipo: 'Geral', email: 'contato@comademig.org.br' },
      { tipo: 'Secretaria', email: 'secretaria@comademig.org.br' }
    ],
    horario_funcionamento: {
      dias: 'Segunda a Sexta',
      horario: '8h às 17h'
    }
  };

  const content = data?.content_json || defaultContent;

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};