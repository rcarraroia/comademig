import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withAutoRetry, createContextualError } from '@/lib/errorHandling';
import { CACHE_KEYS, getCacheConfigForContent, shouldRefetchContent } from '@/lib/cache';

export interface ContentData {
  page_name: string;
  content_json: any;
  last_updated_at?: string;
}

// Função com retry automático para carregar conteúdo
const loadContentWithRetry = withAutoRetry(
  async (pageName: string) => {
    const { data, error } = await supabase
      .from('content_management')
      .select('page_name, content_json, last_updated_at, created_at')
      .eq('page_name', pageName)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`Erro ao carregar conteúdo da página ${pageName}:`, error);
      throw createContextualError(error, {
        operation: 'load',
        resource: `conteúdo da página ${pageName}`,
        userMessage: `Erro ao carregar conteúdo da página ${pageName}. Verifique sua conexão.`
      });
    }

    return data as ContentData | null;
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: true
  }
);

export const useContent = (pageName: string, options?: { isUserSpecific?: boolean }) => {
  const cacheConfig = getCacheConfigForContent(pageName, options?.isUserSpecific);
  
  return useQuery({
    queryKey: CACHE_KEYS.content(pageName),
    queryFn: () => loadContentWithRetry(pageName),
    ...cacheConfig,
    // Configuração inteligente de refetch baseada em timestamp
    refetchInterval: (data) => {
      if (!data?.last_updated_at) return false;
      
      // Se o conteúdo foi atualizado recentemente, verificar mais frequentemente
      const shouldRefetch = shouldRefetchContent(data.last_updated_at);
      return shouldRefetch ? 30000 : false; // 30 segundos se precisa refetch
    },
    // Retry customizado - não fazer retry automático do React Query
    retry: false,
    retryDelay: undefined,
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

  // Função para garantir estrutura segura
  const ensureSafeContent = (content: any) => {
    if (!content || typeof content !== 'object') {
      return defaultContent;
    }

    return {
      banner_principal: {
        titulo_principal: content.banner_principal?.titulo_principal || defaultContent.banner_principal.titulo_principal,
        subtitulo: content.banner_principal?.subtitulo || defaultContent.banner_principal.subtitulo,
        texto_botao: content.banner_principal?.texto_botao || defaultContent.banner_principal.texto_botao,
        link_botao: content.banner_principal?.link_botao || defaultContent.banner_principal.link_botao
      },
      cards_acao: Array.isArray(content.cards_acao) ? content.cards_acao : defaultContent.cards_acao,
      destaques_convencao: Array.isArray(content.destaques_convencao) ? content.destaques_convencao : defaultContent.destaques_convencao,
      noticias_recentes: Array.isArray(content.noticias_recentes) ? content.noticias_recentes : defaultContent.noticias_recentes,
      junte_se_missao: {
        titulo_principal: content.junte_se_missao?.titulo_principal || defaultContent.junte_se_missao.titulo_principal,
        subtitulo: content.junte_se_missao?.subtitulo || defaultContent.junte_se_missao.subtitulo,
        texto_botao: content.junte_se_missao?.texto_botao || defaultContent.junte_se_missao.texto_botao,
        link_botao: content.junte_se_missao?.link_botao || defaultContent.junte_se_missao.link_botao
      }
    };
  };

  // Se content_json existe e não está vazio, usar ele, senão usar defaultContent
  const rawContent = (data?.content_json && Object.keys(data.content_json).length > 0) 
    ? data.content_json 
    : defaultContent;

  // Garantir que todas as propriedades necessárias existem
  const safeContent = ensureSafeContent(rawContent);

  return {
    content: safeContent,
    isLoading,
    error,
    hasCustomContent: !!(data?.content_json && Object.keys(data.content_json).length > 0)
  };
};

// Hook específico para conteúdo da página sobre
// Interface para dados da página Sobre
export interface AboutContentData {
  titulo: string;
  descricao: string;
  missao: {
    titulo: string;
    texto: string;
  };
  visao: {
    titulo: string;
    texto: string;
  };
  historia: {
    titulo: string;
    texto?: string;
    paragrafos?: string[];
  };
}

export const useAboutContent = () => {
  const { data, isLoading, error } = useContent('sobre');
  
  const defaultContent: AboutContentData = {
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
      paragrafos: [
        'A COMADEMIG foi fundada em 1962 com o propósito de unir e fortalecer os ministros das Assembleias de Deus em todo o estado de Minas Gerais, promovendo a comunhão fraternal, o crescimento espiritual e a expansão do Reino de Deus.',
        'Ao longo de mais de 60 anos de história, a convenção tem sido um instrumento fundamental na formação ministerial, capacitação de líderes e fortalecimento das igrejas locais em todo o estado.',
        'Hoje, a COMADEMIG representa mais de 500 ministros e 1.200 igrejas locais, distribuídas em 20 campos regionais, mantendo sempre o compromisso com a pregação do Evangelho e o crescimento do Reino de Deus em Minas Gerais.'
      ]
    }
  };

  // Garantir compatibilidade com formato antigo (texto único) e novo (parágrafos)
  const content: AboutContentData = data?.content_json || defaultContent;
  
  // Se história tem apenas texto, converter para array de parágrafos
  if (content.historia.texto && !content.historia.paragrafos) {
    content.historia.paragrafos = [content.historia.texto];
  }

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};

// Interface para dados da página Liderança
export interface LeaderData {
  id: string;
  nome: string;
  cargo: string;
  bio: string;
  imagem?: string;
  email?: string;
  telefone?: string;
  ordem: number;
  categoria: 'presidencia' | 'diretoria' | 'conselho' | 'campos';
}

export interface LeadershipContentData {
  titulo: string;
  descricao: string;
  lideres: LeaderData[];
}

export const useLeadershipContent = () => {
  const { data, isLoading, error } = useContent('lideranca');
  
  const defaultContent: LeadershipContentData = {
    titulo: 'Nossa Liderança',
    descricao: 'Conheça os líderes que conduzem a COMADEMIG',
    lideres: [
      {
        id: '1',
        nome: 'Pastor João Silva Santos',
        cargo: 'Presidente da COMADEMIG',
        bio: 'Pastor há mais de 30 anos, formado em Teologia e Administração Eclesiástica. Lidera a Igreja Assembleia de Deus Central de Belo Horizonte desde 1995. Casado com a Irmã Maria Santos, pai de 3 filhos.',
        email: 'presidencia@comademig.org.br',
        telefone: '(31) 3333-4444',
        ordem: 1,
        categoria: 'presidencia'
      },
      {
        id: '2',
        nome: 'Pastor Carlos Oliveira',
        cargo: 'Vice-Presidente',
        bio: 'Pastor há 25 anos, responsável pelo campo de Juiz de Fora. Especialista em Missões e Evangelismo.',
        ordem: 2,
        categoria: 'diretoria'
      },
      {
        id: '3',
        nome: 'Pastor Roberto Lima',
        cargo: 'Secretário Geral',
        bio: 'Pastor há 20 anos, formado em Teologia e Direito. Atua na área jurídica da convenção.',
        ordem: 3,
        categoria: 'diretoria'
      },
      {
        id: '4',
        nome: 'Pastor Antônio Pereira',
        cargo: 'Tesoureiro',
        bio: 'Pastor há 28 anos, contador formado. Responsável pela gestão financeira da convenção.',
        ordem: 4,
        categoria: 'diretoria'
      },
      {
        id: '5',
        nome: 'Pastor José Martins',
        cargo: 'Conselheiro Fiscal',
        bio: 'Pastor veterano com mais de 40 anos de ministério. Pioneiro em várias igrejas do interior.',
        ordem: 5,
        categoria: 'conselho'
      },
      {
        id: '6',
        nome: 'Pastor Francisco Costa',
        cargo: 'Conselheiro Doutrinário',
        bio: 'Doutor em Teologia, professor do seminário. Especialista em doutrina bíblica.',
        ordem: 6,
        categoria: 'conselho'
      }
    ]
  };

  // Garantir que o conteúdo tenha a estrutura correta
  const content: LeadershipContentData = data?.content_json || defaultContent;
  
  // Ordenar líderes por ordem
  if (content.lideres && Array.isArray(content.lideres)) {
    content.lideres.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};

// Interface para dados da página Contato
export interface ContactPhone {
  id: string;
  tipo: string;
  numero: string;
  ordem: number;
}

export interface ContactEmail {
  id: string;
  tipo: string;
  email: string;
  ordem: number;
}

export interface ContactContentData {
  titulo: string;
  descricao: string;
  endereco: {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
    complemento?: string;
  };
  telefones: ContactPhone[];
  emails: ContactEmail[];
  horario_funcionamento: {
    dias: string;
    horario: string;
    observacoes?: string;
  };
  redes_sociais?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
  };
}

export const useContactContent = () => {
  const { data, isLoading, error } = useContent('contato');
  
  const defaultContent: ContactContentData = {
    titulo: 'Entre em Contato',
    descricao: 'Estamos aqui para ajudar você',
    endereco: {
      rua: 'Rua das Assembleias, 123',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30000-000'
    },
    telefones: [
      { id: '1', tipo: 'Principal', numero: '(31) 3333-4444', ordem: 1 },
      { id: '2', tipo: 'WhatsApp', numero: '(31) 99999-8888', ordem: 2 }
    ],
    emails: [
      { id: '1', tipo: 'Geral', email: 'contato@comademig.org.br', ordem: 1 },
      { id: '2', tipo: 'Secretaria', email: 'secretaria@comademig.org.br', ordem: 2 }
    ],
    horario_funcionamento: {
      dias: 'Segunda a Sexta',
      horario: '8h às 17h',
      observacoes: 'Sábados: 8h às 12h'
    },
    redes_sociais: {
      facebook: 'https://facebook.com/comademig',
      instagram: 'https://instagram.com/comademig',
      youtube: 'https://youtube.com/comademig'
    }
  };

  // Garantir que o conteúdo tenha a estrutura correta
  const content: ContactContentData = data?.content_json || defaultContent;
  
  // Ordenar telefones e emails por ordem
  if (content.telefones && Array.isArray(content.telefones)) {
    content.telefones.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }
  
  if (content.emails && Array.isArray(content.emails)) {
    content.emails.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  return {
    content,
    isLoading,
    error,
    hasCustomContent: !!data?.content_json
  };
};