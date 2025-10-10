
import { Profile } from './useAuthState';
import { useUserRoles } from './useUserRoles';
import { User } from '@supabase/supabase-js';

export const useAuthPermissions = (profile: Profile | null, user: User | null = null) => {
  const { hasRole, isAdmin: isAdminRole } = useUserRoles(user);

  const isSuperAdmin = () => {
    return profile?.tipo_membro === 'super_admin';
  };

  const isAdmin = () => {
    // Verificar tanto tipo_membro quanto user_roles para compatibilidade
    // Super admin também é admin
    return profile?.tipo_membro === 'admin' ||
      profile?.tipo_membro === 'super_admin' ||
      profile?.cargo?.toLowerCase().includes('admin') ||
      isAdminRole();
  };

  const hasPermission = (permission: string) => {
    if (!profile) return false;

    // Super admin tem todas as permissões
    if (isSuperAdmin()) return true;

    if (isAdmin()) return true;

    switch (permission) {
      case 'manage_events':
        return ['admin', 'moderador'].includes(profile.tipo_membro) ||
          hasRole('admin') || hasRole('moderador');
      case 'manage_finance':
        return ['admin', 'tesoureiro'].includes(profile.tipo_membro) ||
          hasRole('admin') || hasRole('tesoureiro');
      case 'view_reports':
        return ['admin', 'moderador', 'tesoureiro'].includes(profile.tipo_membro) ||
          hasRole('admin') || hasRole('moderador') || hasRole('tesoureiro');
      case 'manage_users':
        return profile.tipo_membro === 'admin' || hasRole('admin');
      default:
        return false;
    }
  };

  return {
    isAdmin,
    isSuperAdmin,
    hasPermission,
  };
};
