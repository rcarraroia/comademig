import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatus {
  id: string;
  status: string | null;
  nome_completo: string;
  tipo_membro: string | null;
}

export function useProfileStatus() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          status,
          nome_completo,
          tipo_membro
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        setError('Erro ao carregar perfil do usuário');
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao carregar perfil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const revalidateProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    revalidateProfile,
    isPending: profile?.status === 'pendente',
    isActive: profile?.status === 'ativo',
    isSuspended: profile?.status === 'suspenso',
    isInactive: profile?.status === 'inativo',
    hasProfile: !!profile
  };
}
