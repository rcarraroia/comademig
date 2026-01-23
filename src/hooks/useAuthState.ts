
import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  
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
        // Em caso de erro, definir perfil como null mas não bloquear a aplicação
        setProfile(null);
        profileFetchedRef.current = true;
        lastUserIdRef.current = userId;
        return;
      }
      
      console.log('Profile fetched:', data);
      setProfile(data);
      profileFetchedRef.current = true;
      lastUserIdRef.current = userId;
      
      // Verificar acesso após buscar perfil - com try-catch
      if (data) {
        try {
          checkUserAccess(data);
        } catch (accessError) {
          console.error('Erro na verificação de acesso:', accessError);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      // Garantir que a aplicação não trave por erro de perfil
      setProfile(null);
      profileFetchedRef.current = true;
      lastUserIdRef.current = userId;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Forçar refresh resetando o flag
      profileFetchedRef.current = false;
      await fetchProfile(user.id);
    }
  };

  // Verificar se usuário deve ser redirecionado baseado no status
  const checkUserAccess = (profile: Profile | null) => {
    if (!profile || !user) return;

    try {
      // Super admins têm acesso total independente do status
      if (profile.tipo_membro === 'super_admin' || profile.tipo_membro === 'admin') {
        return;
      }

      // Páginas que não precisam de verificação de status
      const allowedPaths = [
        '/aguardando-confirmacao',
        '/auth',
        '/esqueci-senha',
        '/reset-password',
        '/filiacao',
        '/pagamento-sucesso',
        '/pagamento-pendente'
      ];

      const isAllowedPath = allowedPaths.some(path => 
        location.pathname.startsWith(path)
      );

      if (isAllowedPath) return;

      // Se status é pendente e não está na página de aguardo, redirecionar
      if (profile.status === 'pendente' && location.pathname !== '/aguardando-confirmacao') {
        console.log('Usuário com status pendente, redirecionando para aguardo...');
        navigate('/aguardando-confirmacao');
        return;
      }

      // Se status é ativo e está na página de aguardo, redirecionar para dashboard
      if (profile.status === 'ativo' && location.pathname === '/aguardando-confirmacao') {
        console.log('Pagamento confirmado, redirecionando para dashboard...');
        navigate('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Erro na verificação de acesso do usuário:', error);
      // Não bloquear a aplicação por erro de redirecionamento
    }
  };

  // Verificar acesso quando profile ou location mudar
  useEffect(() => {
    if (profile && user && !loading) {
      try {
        checkUserAccess(profile);
      } catch (error) {
        console.error('Erro no useEffect de verificação de acesso:', error);
      }
    }
  }, [profile, location.pathname, user, loading]);

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
