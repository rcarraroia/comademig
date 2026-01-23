import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { redirectService } from '@/services/RedirectService';

/**
 * Hook centralizado para gerenciar redirecionamentos
 * Substitui lógicas duplicadas em múltiplos componentes
 */
export const useRedirect = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const redirectCheck = redirectService.shouldRedirect(
      profile, 
      location.pathname, 
      loading
    );

    if (redirectCheck.shouldRedirect && redirectCheck.targetRoute) {
      console.log(`🔄 Redirecting: ${redirectCheck.reason}`);
      
      // Registrar redirecionamento para prevenção de loops
      redirectService.recordRedirect(location.pathname, redirectCheck.targetRoute);
      
      // Executar redirecionamento
      navigate(redirectCheck.targetRoute, { replace: true });
    }
  }, [profile, location.pathname, loading, navigate]);

  return {
    canAccessRoute: (route: string) => redirectService.canAccessRoute(profile, route),
    getDefaultRoute: () => redirectService.getDefaultRouteAfterLogin(profile),
    clearHistory: () => redirectService.clearRedirectHistory(),
  };
};

/**
 * Hook para redirecionamento após login
 * Usado especificamente na página de autenticação
 */
export const useLoginRedirect = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const redirectAfterLogin = () => {
    if (!profile) return;

    const targetRoute = redirectService.getDefaultRouteAfterLogin(profile);
    
    console.log(`🔐 Login successful for ${profile.tipo_membro}, redirecting to ${targetRoute}`);
    
    // Registrar redirecionamento
    redirectService.recordRedirect('/auth', targetRoute);
    
    // Executar redirecionamento
    navigate(targetRoute, { replace: true });
  };

  return { redirectAfterLogin };
};