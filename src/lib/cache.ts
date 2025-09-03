/**
 * Configurações de cache otimizadas para o sistema CMS
 */

// Tempos de cache em milissegundos
export const CACHE_TIMES = {
  // Conteúdo estático (raramente muda)
  STATIC_CONTENT: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  },
  
  // Conteúdo dinâmico (pode mudar frequentemente)
  DYNAMIC_CONTENT: {
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  },
  
  // Dados de usuário (sessão, perfil)
  USER_DATA: {
    staleTime: 2 * 60 * 1000,  // 2 minutos
    gcTime: 5 * 60 * 1000,     // 5 minutos
  },
  
  // Dados críticos (sempre fresh)
  CRITICAL_DATA: {
    staleTime: 0,              // Sempre stale
    gcTime: 1 * 60 * 1000,     // 1 minuto
  }
} as const;

// Chaves de cache padronizadas
export const CACHE_KEYS = {
  content: (pageName: string) => ['content', pageName],
  contentList: () => ['content', 'list'],
  contentMeta: (pageName: string) => ['content', 'meta', pageName],
  userContent: (userId: string, pageName: string) => ['user', userId, 'content', pageName],
} as const;

// Configurações de retry otimizadas
export const RETRY_CONFIG = {
  // Para operações de leitura
  READ: {
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Para operações de escrita
  WRITE: {
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 5000),
  },
  
  // Para operações críticas
  CRITICAL: {
    retry: 1,
    retryDelay: () => 1000,
  }
} as const;

// Configurações de prefetch
export const PREFETCH_CONFIG = {
  // Prefetch conteúdo relacionado
  RELATED_CONTENT: {
    staleTime: CACHE_TIMES.STATIC_CONTENT.staleTime,
    gcTime: CACHE_TIMES.STATIC_CONTENT.gcTime,
  },
  
  // Prefetch dados do usuário
  USER_PREFETCH: {
    staleTime: CACHE_TIMES.USER_DATA.staleTime,
    gcTime: CACHE_TIMES.USER_DATA.gcTime,
  }
} as const;

// Função para invalidar cache relacionado
export const getRelatedCacheKeys = (pageName: string): string[][] => {
  const related: string[][] = [
    CACHE_KEYS.content(pageName),
    CACHE_KEYS.contentMeta(pageName),
    CACHE_KEYS.contentList(),
  ];
  
  // Adicionar chaves relacionadas baseadas no tipo de página
  switch (pageName) {
    case 'home':
      // Home pode afetar outras páginas que mostram destaques
      related.push(CACHE_KEYS.content('destaques'));
      break;
    case 'lideranca':
      // Liderança pode afetar página sobre
      related.push(CACHE_KEYS.content('sobre'));
      break;
    case 'contato':
      // Contato pode afetar footer de outras páginas
      related.push(['layout', 'footer']);
      break;
  }
  
  return related;
};

// Configuração de background refetch
export const BACKGROUND_REFETCH_CONFIG = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: true,
  refetchInterval: false, // Desabilitado por padrão, pode ser habilitado por hook específico
} as const;

// Função para determinar configuração de cache baseada no tipo de conteúdo
export const getCacheConfigForContent = (pageName: string, isUserSpecific = false) => {
  // Conteúdo específico do usuário tem cache mais curto
  if (isUserSpecific) {
    return {
      ...CACHE_TIMES.USER_DATA,
      ...RETRY_CONFIG.READ,
      ...BACKGROUND_REFETCH_CONFIG,
    };
  }
  
  // Páginas que mudam raramente
  const staticPages = ['sobre', 'lideranca'];
  if (staticPages.includes(pageName)) {
    return {
      ...CACHE_TIMES.STATIC_CONTENT,
      ...RETRY_CONFIG.READ,
      ...BACKGROUND_REFETCH_CONFIG,
    };
  }
  
  // Páginas dinâmicas (home, contato)
  return {
    ...CACHE_TIMES.DYNAMIC_CONTENT,
    ...RETRY_CONFIG.READ,
    ...BACKGROUND_REFETCH_CONFIG,
  };
};

// Função para cache inteligente baseado em timestamp
export const shouldRefetchContent = (lastUpdated?: string, cacheTime = CACHE_TIMES.DYNAMIC_CONTENT.staleTime): boolean => {
  if (!lastUpdated) return true;
  
  const lastUpdatedTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  
  return (now - lastUpdatedTime) > cacheTime;
};