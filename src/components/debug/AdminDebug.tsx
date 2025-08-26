import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';

export const AdminDebug = () => {
  const { roles, loading: rolesLoading, isAdmin } = useUserRoles();
  const { user, profile, isAdmin: authIsAdmin, hasPermission } = useAuth();

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="font-bold mb-2">🔍 DEBUG ADMIN ACCESS</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>User ID:</strong> {user?.id}</div>
        <div><strong>Profile tipo_membro:</strong> {profile?.tipo_membro}</div>
        <div><strong>Profile status:</strong> {profile?.status}</div>
        
        <hr className="my-2" />
        
        <div><strong>useUserRoles loading:</strong> {rolesLoading ? 'true' : 'false'}</div>
        <div><strong>useUserRoles roles:</strong> {JSON.stringify(roles)}</div>
        <div><strong>useUserRoles isAdmin():</strong> {isAdmin() ? 'true' : 'false'}</div>
        
        <hr className="my-2" />
        
        <div><strong>useAuth isAdmin():</strong> {authIsAdmin() ? 'true' : 'false'}</div>
        <div><strong>useAuth hasPermission('manage_users'):</strong> {hasPermission('manage_users') ? 'true' : 'false'}</div>
      </div>
    </div>
  );
};