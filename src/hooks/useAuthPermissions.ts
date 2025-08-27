
import { Profile } from './useAuthState';
import { useUserRoles } from './useUserRoles';

export const useAuthPermissions = (profile: Profile | null) => {
  const { hasRole, isAdmin: isAdminRole } = useUserRoles();

  const isAdmin = () => {
    // Verificar tanto tipo_membro quanto user_roles para compatibilidade
    return profile?.tipo_membro === 'admin' ||
      profile?.cargo?.toLowerCase().includes('admin') ||
      isAdminRole();
  };

  const hasPermission = (permission: string) => {
    if (!profile) return false;

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
    hasPermission,
  };
};
