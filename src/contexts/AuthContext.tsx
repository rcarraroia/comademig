
import { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthState, Profile } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, user, profile, loading, error, setProfile, refreshProfile, clearError } = useAuthState();
  const { signIn, signUp, signOut, resetPassword, updateProfile: updateProfileImpl } = useAuthActions();
  const { isAdmin, isSuperAdmin, hasPermission } = useAuthPermissions(profile, user);

  const updateProfile = (data: Partial<Profile>) => {
    return updateProfileImpl(user, profile, setProfile, data);
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut: handleSignOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    clearError,
    isAdmin,
    isSuperAdmin,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
