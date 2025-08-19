
import { Profile } from './useAuthState';

export const useAuthPermissions = (profile: Profile | null) => {
  const isAdmin = () => {
    return profile?.tipo_membro === 'admin' || profile?.cargo?.toLowerCase().includes('admin');
  };

  const hasPermission = (permission: string) => {
    if (!profile) return false;
    
    if (isAdmin()) return true;
    
    switch (permission) {
      case 'manage_events':
        return ['admin', 'moderador'].includes(profile.tipo_membro);
      case 'manage_finance':
        return ['admin', 'tesoureiro'].includes(profile.tipo_membro);
      case 'view_reports':
        return ['admin', 'moderador', 'tesoureiro'].includes(profile.tipo_membro);
      case 'manage_users':
        return profile.tipo_membro === 'admin';
      default:
        return false;
    }
  };

  return {
    isAdmin,
    hasPermission,
  };
};
