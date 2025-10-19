import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createContextualError } from '@/lib/errorHandling';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// INTERFACES
// ============================================

export interface NoticiaData {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo_completo: string | null;
  autor: string | null;
  autor_id: string | null;
  data_publicacao: string | null;
  categoria: string | null;
  imagem_url: string | null;
  visualizacoes: number;
  destaque: boolean;
  ativo: boolean;
  exibir_na_home: boolean;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  moderado_por: string | null;
  moderado_em: string | null;
  motivo_rejeicao: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticiaWithAuthor extends NoticiaData {
  autor_profile?: {
    nome_completo: string;
    email: string;
  };
}

export interface UseNoticiasOptions {
  categoria?: string;
  destaque?: boolean;
  exibir_na_home?: boolean;
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  autor_id?: string;
  limit?: number;
  ativo?: boolean;
}

// ============================================
// HOOK: Listar Notícias (Público)
// ============================================
export const useNoticias = (options: UseNoticiasOptions = {}) => {
  const { 
    categoria, 
    destaque, 
    exibir_na_home,
    status = 'aprovado', // Padrão: apenas aprovadas
    limit = 50, 
    ativo = true 
  } = options;

  return useQuery({
    queryKey: ['noticias', { categoria, destaque, exibir_na_home, status, limit, ativo }],
    queryFn: async () => {
      let query = supabase
        .from('noticias')
        .select('*')
        .eq('status', status)
        .eq('ativo', ativo)
        .order('data_publicacao', { ascending: false });

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      if (destaque !== undefined) {
        query = query.eq('destaque', destaque);
      }

      if (exibir_na_home !== undefined) {
        query = query.eq('exibir_na_home', exibir_na_home);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar notícias:', error);
        throw createContextualError(error, {
          operation: 'load',
          resource: 'notícias',
          userMessage: 'Erro ao carregar notícias. Tente novamente.'
        });
      }

      return data as NoticiaData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// ============================================
// HOOK: Notícias para Home (3 últimas aprovadas para carrossel de cards)
// ============================================
export const useNoticiasHome = (limit: number = 3) => {
  return useQuery({
    queryKey: ['noticias', 'home', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('status', 'aprovado')
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao carregar notícias da home:', error);
        throw createContextualError(error, {
          operation: 'load',
          resource: 'notícias da home',
          userMessage: 'Erro ao carregar notícias. Tente novamente.'
        });
      }

      return data as NoticiaData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// ============================================
// HOOK: Notícias Recentes (25 últimas para carrossel de títulos)
// ============================================
export const useNoticiasRecentes = (limit: number = 25) => {
  return useQuery({
    queryKey: ['noticias', 'recentes', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias')
        .select('id, titulo, slug, data_publicacao')
        .eq('status', 'aprovado')
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao carregar notícias recentes:', error);
        throw createContextualError(error, {
          operation: 'load',
          resource: 'notícias recentes',
          userMessage: 'Erro ao carregar notícias recentes. Tente novamente.'
        });
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// ============================================
// HOOK: Minhas Notícias (Usuário)
// ============================================
export const useMinhasNoticias = (status?: 'pendente' | 'aprovado' | 'rejeitado') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['minhas-noticias', user?.id, status],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      let query = supabase
        .from('noticias')
        .select('*')
        .eq('autor_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar minhas notícias:', error);
        throw createContextualError(error, {
          operation: 'load',
          resource: 'minhas notícias',
          userMessage: 'Erro ao carregar suas notícias. Tente novamente.'
        });
      }

      return data as NoticiaData[];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// ============================================
// HOOK: Notícias Pendentes (Admin)
// ============================================
export const useNoticiasPendentes = () => {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['noticias-pendentes'],
    queryFn: async () => {
      // Buscar notícias pendentes
      const { data: noticias, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar notícias pendentes:', error);
        throw createContextualError(error, {
          operation: 'load',
          resource: 'notícias pendentes',
          userMessage: 'Erro ao carregar notícias pendentes. Tente novamente.'
        });
      }

      // Buscar perfis dos autores (se tiverem autor_id)
      const noticiasComPerfil = await Promise.all(
        (noticias || []).map(async (noticia) => {
          if (noticia.autor_id) {
            try {
              const { data: perfil } = await supabase
                .from('profiles')
                .select('nome_completo, email')
                .eq('id', noticia.autor_id)
                .single();
              
              return {
                ...noticia,
                autor_profile: perfil
              };
            } catch (e) {
              return noticia;
            }
          }
          return noticia;
        })
      );

      return noticiasComPerfil as NoticiaWithAuthor[];
    },
    enabled: isAdmin(),
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });
};

// ============================================
// HOOK: Todas as Notícias (Admin)
// ============================================
export const useTodasNoticias = (filters?: {
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  categoria?: string;
  busca?: string;
}) => {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['todas-noticias', filters],
    queryFn: async () => {
      let query = supabase
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      if (filters?.busca) {
        query = query.or(`titulo.ilike.%${filters.busca}%,resumo.ilike.%${filters.busca}%`);
      }

      const { data: noticias, error } = await query;

      if (error) {
        console.error('Erro ao carregar todas as notícias:', error);
        throw createContextualError(error, {
          operation: 'load',
          resource: 'todas as notícias',
          userMessage: 'Erro ao carregar notícias. Tente novamente.'
        });
      }

      // Buscar perfis dos autores
      const noticiasComPerfil = await Promise.all(
        (noticias || []).map(async (noticia) => {
          if (noticia.autor_id) {
            try {
              const { data: perfil } = await supabase
                .from('profiles')
                .select('nome_completo, email')
                .eq('id', noticia.autor_id)
                .single();
              
              return {
                ...noticia,
                autor_profile: perfil
              };
            } catch (e) {
              return noticia;
            }
          }
          return noticia;
        })
      );

      return noticiasComPerfil as NoticiaWithAuthor[];
    },
    enabled: isAdmin(),
    staleTime: 2 * 60 * 1000,
  });
};

// ============================================
// HOOK: Buscar Notícia por Slug
// ============================================
export const useNoticia = (slug: string) => {
  return useQuery({
    queryKey: ['noticia', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'aprovado')
        .eq('ativo', true)
        .single();

      if (error) {
        console.error(`Erro ao carregar notícia ${slug}:`, error);
        throw createContextualError(error, {
          operation: 'load',
          resource: `notícia ${slug}`,
          userMessage: 'Erro ao carregar notícia. Tente novamente.'
        });
      }

      // Incrementar visualizações (fire and forget)
      if (data) {
        const incrementViews = async () => {
          try {
            await supabase
              .from('noticias')
              .update({ visualizacoes: (data.visualizacoes || 0) + 1 })
              .eq('id', data.id);
          } catch (err) {
            console.warn('Erro ao incrementar visualizações:', err);
          }
        };
        incrementViews();
      }

      return data as NoticiaData;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
};

// ============================================
// HOOK: Buscar Notícia por ID (Admin/Autor)
// ============================================
export const useNoticiaById = (id: string) => {
  return useQuery({
    queryKey: ['noticia-by-id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Erro ao carregar notícia ${id}:`, error);
        throw createContextualError(error, {
          operation: 'load',
          resource: `notícia`,
          userMessage: 'Erro ao carregar notícia. Tente novamente.'
        });
      }

      return data as NoticiaData;
    },
    enabled: !!id,
  });
};

// ============================================
// MUTATIONS
// ============================================
export const useNoticiasMutations = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  // Criar Notícia
  const createNoticia = useMutation({
    mutationFn: async (noticia: Omit<NoticiaData, 'id' | 'created_at' | 'updated_at' | 'visualizacoes' | 'status' | 'moderado_por' | 'moderado_em' | 'motivo_rejeicao'>) => {
      const noticiaData: any = {
        ...noticia,
        autor_id: user?.id,
        // Usuários comuns criam com status pendente
        // Admins podem criar já aprovado
        status: isAdmin() ? 'aprovado' : 'pendente',
        // Usuários comuns não podem marcar exibir_na_home ou destaque
        exibir_na_home: isAdmin() ? noticia.exibir_na_home : false,
        destaque: isAdmin() ? noticia.destaque : false,
      };

      const { data, error } = await supabase
        .from('noticias')
        .insert([noticiaData])
        .select()
        .single();

      if (error) {
        throw createContextualError(error, {
          operation: 'create',
          resource: 'notícia',
          userMessage: 'Erro ao criar notícia. Verifique os dados e tente novamente.'
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noticias'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['noticias-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-noticias'] });
    },
  });

  // Atualizar Notícia
  const updateNoticia = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NoticiaData> & { id: string }) => {
      // Se não for admin, não pode alterar status, exibir_na_home ou destaque
      const updateData: any = { ...updates };
      
      if (!isAdmin()) {
        delete updateData.status;
        delete updateData.exibir_na_home;
        delete updateData.destaque;
        delete updateData.moderado_por;
        delete updateData.moderado_em;
        delete updateData.motivo_rejeicao;
      }

      const { data, error } = await supabase
        .from('noticias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createContextualError(error, {
          operation: 'update',
          resource: 'notícia',
          userMessage: 'Erro ao atualizar notícia. Tente novamente.'
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['noticias'] });
      queryClient.invalidateQueries({ queryKey: ['noticia', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['noticia-by-id', data.id] });
      queryClient.invalidateQueries({ queryKey: ['minhas-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['noticias-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-noticias'] });
    },
  });

  // Deletar Notícia
  const deleteNoticia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('noticias')
        .delete()
        .eq('id', id);

      if (error) {
        throw createContextualError(error, {
          operation: 'delete',
          resource: 'notícia',
          userMessage: 'Erro ao deletar notícia. Tente novamente.'
        });
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noticias'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['noticias-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-noticias'] });
    },
  });

  // Aprovar Notícia (Admin)
  const aprovarNoticia = useMutation({
    mutationFn: async ({ 
      id, 
      exibir_na_home = false, 
      destaque = false 
    }: { 
      id: string; 
      exibir_na_home?: boolean; 
      destaque?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('aprovar_noticia', {
        p_noticia_id: id,
        p_exibir_na_home: exibir_na_home,
        p_destaque: destaque
      });

      if (error) {
        throw createContextualError(error, {
          operation: 'approve',
          resource: 'notícia',
          userMessage: 'Erro ao aprovar notícia. Tente novamente.'
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noticias'] });
      queryClient.invalidateQueries({ queryKey: ['noticias-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-noticias'] });
    },
  });

  // Rejeitar Notícia (Admin)
  const rejeitarNoticia = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase.rpc('rejeitar_noticia', {
        p_noticia_id: id,
        p_motivo: motivo
      });

      if (error) {
        throw createContextualError(error, {
          operation: 'reject',
          resource: 'notícia',
          userMessage: 'Erro ao rejeitar notícia. Tente novamente.'
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noticias'] });
      queryClient.invalidateQueries({ queryKey: ['noticias-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-noticias'] });
    },
  });

  return {
    createNoticia,
    updateNoticia,
    deleteNoticia,
    aprovarNoticia,
    rejeitarNoticia,
  };
};
