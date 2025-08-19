
import { supabase } from "@/integrations/supabase/client";
import { Profile } from './useAuthState';

export const useAuthActionsImpl = () => {
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      return { error };
    } catch (error) {
      console.error('Erro no signIn:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?confirmed=true`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.nome_completo,
          }
        }
      });
      
      return { error };
    } catch (error) {
      console.error('Erro no signUp:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro no signOut:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      return { error };
    } catch (error) {
      console.error('Erro no resetPassword:', error);
      return { error };
    }
  };

  const updateProfile = async (user: any, profile: Profile | null, setProfile: (profile: Profile | null) => void, data: Partial<Profile>) => {
    if (!user) return { error: { message: 'Usuário não autenticado' } };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (!error && profile) {
        setProfile({ ...profile, ...data });
      }
      
      return { error };
    } catch (error) {
      console.error('Erro no updateProfile:', error);
      return { error };
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
};
