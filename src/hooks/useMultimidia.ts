import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createContextualError } from '@/lib/errorHandling';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoData {
    id: string;
    titulo: string;
    descricao: string | null;
    url_youtube: string;
    duracao: string | null;
    categoria: string;
    thumbnail_url: string | null;
    data_publicacao: string | null;
    visualizacoes: number;
    destaque: boolean;
    ativo: boolean;
    autor_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface AlbumData {
    id: string;
    titulo: string;
    descricao: string | null;
    categoria: string;
    data_evento: string | null;
    capa_url: string | null;
    ativo: boolean;
    autor_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface FotoData {
    id: string;
    album_id: string;
    url: string;
    legenda: string | null;
    ordem: number;
    created_at: string;
}

export interface AlbumWithPhotos extends AlbumData {
    fotos?: FotoData[];
    fotos_count?: number;
}

export interface UseVideosOptions {
    categoria?: string;
    destaque?: boolean;
    limit?: number;
    ativo?: boolean;
}

export interface UseAlbunsOptions {
    categoria?: string;
    limit?: number;
    ativo?: boolean;
}


export const useVideos = (options: UseVideosOptions = {}) => {
    const { categoria, destaque, limit = 50, ativo } = options;
    return useQuery({
        queryKey: ['videos', { categoria, destaque, limit, ativo }],
        queryFn: async () => {
            let query = supabase
                .from('videos')
                .select('*')
                .order('data_publicacao', { ascending: false });

            // Só filtra por ativo se for explicitamente definido
            if (ativo !== undefined) {
                query = query.eq('ativo', ativo);
            }

            if (categoria) query = query.eq('categoria', categoria);
            if (destaque !== undefined) query = query.eq('destaque', destaque);
            if (limit) query = query.limit(limit);

            const { data, error } = await query;
            if (error) throw createContextualError(error, { operation: 'load', resource: 'vídeos', userMessage: 'Erro ao carregar vídeos.' });
            return data as VideoData[];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

export const useAlbuns = (options: UseAlbunsOptions = {}) => {
    const { categoria, limit = 50, ativo } = options;
    return useQuery({
        queryKey: ['albuns', { categoria, limit, ativo }],
        queryFn: async () => {
            let query = supabase
                .from('albuns_fotos')
                .select('*, fotos(count)')
                .order('data_evento', { ascending: false });

            // Só filtra por ativo se for explicitamente definido
            if (ativo !== undefined) {
                query = query.eq('ativo', ativo);
            }

            if (categoria) query = query.eq('categoria', categoria);
            if (limit) query = query.limit(limit);

            const { data, error } = await query;
            if (error) throw createContextualError(error, { operation: 'load', resource: 'álbuns', userMessage: 'Erro ao carregar álbuns.' });

            // Processar contagem de fotos
            const albunsComContagem = data?.map(album => ({
                ...album,
                fotos_count: album.fotos?.[0]?.count || 0
            }));

            return albunsComContagem as AlbumWithPhotos[];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

export const useAlbum = (id: string) => {
    return useQuery({
        queryKey: ['album', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('albuns_fotos').select('*, fotos(*)').eq('id', id).single();
            if (error) throw createContextualError(error, { operation: 'load', resource: 'álbum', userMessage: 'Erro ao carregar álbum.' });
            return data as AlbumWithPhotos;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!id,
    });
};

export const useFotos = (albumId: string) => {
    return useQuery({
        queryKey: ['fotos', albumId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('fotos')
                .select('*')
                .eq('album_id', albumId)
                .order('ordem', { ascending: true });
            if (error) throw createContextualError(error, { operation: 'load', resource: 'fotos', userMessage: 'Erro ao carregar fotos.' });
            return data as FotoData[];
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!albumId,
    });
};


export const useMultimidiaMutations = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const createVideo = useMutation({
        mutationFn: async (videoData: Partial<VideoData>) => {
            const { data, error } = await supabase.from('videos').insert([{ ...videoData, autor_id: user?.id }]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
    });

    const updateVideo = useMutation({
        mutationFn: async ({ id, ...videoData }: Partial<VideoData> & { id: string }) => {
            const { data, error } = await supabase.from('videos').update(videoData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
    });

    const deleteVideo = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('videos').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos'] }),
    });

    const createAlbum = useMutation({
        mutationFn: async (albumData: Partial<AlbumData>) => {
            const { data, error } = await supabase.from('albuns_fotos').insert([{ ...albumData, autor_id: user?.id }]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['albuns'] }),
    });

    const updateAlbum = useMutation({
        mutationFn: async ({ id, ...albumData }: Partial<AlbumData> & { id: string }) => {
            const { data, error } = await supabase.from('albuns_fotos').update(albumData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['albuns'] }),
    });

    const deleteAlbum = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('albuns_fotos').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['albuns'] }),
    });

    const addFoto = useMutation({
        mutationFn: async (fotoData: Partial<FotoData>) => {
            const { data, error } = await supabase.from('fotos').insert([fotoData]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['fotos', variables.album_id] });
            queryClient.invalidateQueries({ queryKey: ['album', variables.album_id] });
            queryClient.invalidateQueries({ queryKey: ['albuns'] });
        },
    });

    const updateFoto = useMutation({
        mutationFn: async ({ id, ...fotoData }: Partial<FotoData> & { id: string }) => {
            const { data, error } = await supabase.from('fotos').update(fotoData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['fotos', data.album_id] });
            queryClient.invalidateQueries({ queryKey: ['album', data.album_id] });
            queryClient.invalidateQueries({ queryKey: ['albuns'] });
        },
    });

    const deleteFoto = useMutation({
        mutationFn: async ({ id, album_id }: { id: string; album_id: string }) => {
            const { error } = await supabase.from('fotos').delete().eq('id', id);
            if (error) throw error;
            return album_id;
        },
        onSuccess: (album_id) => {
            queryClient.invalidateQueries({ queryKey: ['fotos', album_id] });
            queryClient.invalidateQueries({ queryKey: ['album', album_id] });
            queryClient.invalidateQueries({ queryKey: ['albuns'] });
        },
    });

    return {
        createVideo,
        updateVideo,
        deleteVideo,
        createAlbum,
        updateAlbum,
        deleteAlbum,
        addFoto,
        updateFoto,
        deleteFoto
    };
};
