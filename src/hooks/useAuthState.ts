
import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  nome_completo: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  igreja?: string;
  cargo?: string;
  data_ordenacao?: string;
  tempo_ministerio?: string;
  status: string;
  tipo_membro: string;
  foto_url?: string;
}

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Usar useRef para persistir estado entre re-renderizações
  const profileFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    // Evitar chamadas duplicadas
    if (profileFetchedRef.current && lastUserIdRef.current === userId) {
      return;
    }
    
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
        return;
      }
      
      console.log('Profile fetched:', data);
      setProfile(data);
      profileFetchedRef.current = true;
      lastUserIdRef.current = userId;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Forçar refresh resetando o flag
      profileFetchedRef.current = false;
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Só buscar perfil se for um usuário diferente ou ainda não foi buscado
          if (lastUserIdRef.current !== session.user.id) {
            profileFetchedRef.current = false;
            lastUserIdRef.current = session.user.id;
          }
          
          if (!profileFetchedRef.current) {
            // Debounce para evitar múltiplas chamadas
            setTimeout(() => {
              if (mounted && !profileFetchedRef.current) {
                fetchProfile(session.user.id);
              }
            }, 200);
          }
        } else {
          profileFetchedRef.current = false;
          lastUserIdRef.current = null;
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && !profileFetchedRef.current) {
        fetchProfile(session.user.id);
      } else if (!session?.user) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    profile,
    loading,
    setProfile,
    refreshProfile,
  };
};
