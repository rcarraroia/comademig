
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderador' | 'tesoureiro' | 'membro';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRoles = () => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao buscar roles:', error);
          // Se a tabela user_roles não existir ou houver erro de política,
          // continuar sem roles (fallback para tipo_membro)
          setRoles([]);
          setLoading(false);
          return;
        }

        setRoles(data?.map(r => r.role) || []);
      } catch (error) {
        console.error('Erro ao buscar roles:', error);
        // Fallback gracioso em caso de erro
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isModerador = (): boolean => {
    return hasRole('moderador') || isAdmin();
  };

  const isTesoureiro = (): boolean => {
    return hasRole('tesoureiro') || isAdmin();
  };

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerador,
    isTesoureiro,
  };
};
