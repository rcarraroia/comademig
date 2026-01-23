import { Profile } from '@/hooks/useAuthState';
import { User } from '@supabase/supabase-js';

export interface RedirectConfig {
  defaultRoutes: Record<string, string>;
  protectedRoutes: string[];
  publicRoutes: string[];
  adminRoutes: string[];
}

/**
 * Serviço centralizado para gerenciar redirecionamentos
 * Previne loops e mantém consistência na navegação
 */
export class RedirectService {
  private static instance: RedirectService;
  private redirectHistory: string[] = [];
  private maxHistorySize = 5;

  private config: RedirectConfig = {
    defaultRoutes: {
      'super_admin': '/admin/users',
      'admin': '/admin/users',
      'user': '/dashboard',
      'membro': '/dashboard',
      'pastor': '/dashboard',
      'diácono': '/dashboard',
      'bispo': '/dashboard',
    },
    protectedRoutes: ['/dashboard', '/admin'],
    publicRoutes: ['/', '/home', '/sobre', '/auth', '/filiacao'],
    adminRoutes: ['/admin'],
  };

  private constructor() {}

  public static getInstance(): RedirectService {
    if (!RedirectService.instance) {
      RedirectService.instance = new RedirectService();
    }
    return RedirectService.instance;
  }

  /**
   * Determina a rota padrão após login baseada no perfil do usuário
   */
  public getDefaultRouteAfterLogin(profile: Profile | null): string {
    if (!profile) return '/auth';

    const userType = profile.tipo_membro;
    return this.config.defaultRoutes[userType] || this.config.defaultRoutes['user'];
  }

  /**
   * Determina se usuário deve ser redirecionado baseado na rota atual
   */
  public shouldRedirect(
    profile: Profile | null, 
    currentPath: string, 
    loading: boolean = false
  ): { shouldRedirect: boolean; targetRoute?: string; reason?: string } {
    
    // Não redirecionar durante loading
    if (loading || !profile) {
      return { shouldRedirect: false };
    }

    // Prevenir loops - se já redirecionamos recentemente para esta rota
    if (this.isRecentRedirect(currentPath)) {
      return { shouldRedirect: false, reason: 'Loop prevention' };
    }

    const userType = profile.tipo_membro;
    const isAdmin = userType === 'admin' || userType === 'super_admin';

    // Admin/Super Admin tentando acessar dashboard comum
    if (isAdmin && currentPath.startsWith('/dashboard') && !currentPath.startsWith('/dashboard/admin')) {
      const targetRoute = this.config.defaultRoutes[userType];
      return { 
        shouldRedirect: true, 
        targetRoute,
        reason: `Admin user accessing regular dashboard, redirecting to ${targetRoute}`
      };
    }

    // Usuário comum tentando acessar área admin
    if (!isAdmin && currentPath.startsWith('/admin')) {
      const targetRoute = this.config.defaultRoutes['user'];
      return { 
        shouldRedirect: true, 
        targetRoute,
        reason: `Regular user accessing admin area, redirecting to ${targetRoute}`
      };
    }

    // Usuário com status pendente
    if (profile.status === 'pendente' && !this.isAllowedForPendingUser(currentPath)) {
      return { 
        shouldRedirect: true, 
        targetRoute: '/aguardando-confirmacao',
        reason: 'User with pending status'
      };
    }

    // Usuário ativo na página de aguardo
    if (profile.status === 'ativo' && currentPath === '/aguardando-confirmacao') {
      const targetRoute = this.getDefaultRouteAfterLogin(profile);
      return { 
        shouldRedirect: true, 
        targetRoute,
        reason: 'Active user on waiting page'
      };
    }

    return { shouldRedirect: false };
  }

  /**
   * Verifica se usuário pode acessar rota específica
   */
  public canAccessRoute(profile: Profile | null, route: string): boolean {
    if (!profile) {
      return this.config.publicRoutes.some(publicRoute => 
        route.startsWith(publicRoute)
      );
    }

    const userType = profile.tipo_membro;
    const isAdmin = userType === 'admin' || userType === 'super_admin';

    // Admin pode acessar tudo
    if (isAdmin) return true;

    // Usuário comum não pode acessar área admin
    if (route.startsWith('/admin')) return false;

    // Usuário com status pendente tem acesso limitado
    if (profile.status === 'pendente') {
      return this.isAllowedForPendingUser(route);
    }

    return true;
  }

  /**
   * Registra redirecionamento para prevenção de loops
   */
  public recordRedirect(fromRoute: string, toRoute: string): void {
    const redirectRecord = `${fromRoute}->${toRoute}`;
    this.redirectHistory.push(redirectRecord);
    
    // Manter histórico limitado
    if (this.redirectHistory.length > this.maxHistorySize) {
      this.redirectHistory.shift();
    }

    console.log(`🔄 Redirect recorded: ${redirectRecord}`);
  }

  /**
   * Limpa histórico de redirecionamentos
   */
  public clearRedirectHistory(): void {
    this.redirectHistory = [];
  }

  /**
   * Verifica se houve redirecionamento recente para evitar loops
   */
  private isRecentRedirect(targetRoute: string): boolean {
    const recentRedirects = this.redirectHistory.slice(-2);
    return recentRedirects.some(redirect => redirect.endsWith(`->${targetRoute}`));
  }

  /**
   * Verifica se rota é permitida para usuário com status pendente
   */
  private isAllowedForPendingUser(route: string): boolean {
    const allowedPaths = [
      '/aguardando-confirmacao',
      '/auth',
      '/esqueci-senha',
      '/reset-password',
      '/filiacao',
      '/pagamento-sucesso',
      '/pagamento-pendente',
      '/dashboard/meus-dados', // Permitir edição de dados
      '/dashboard/suporte', // Permitir suporte
    ];

    return allowedPaths.some(path => route.startsWith(path));
  }
}

// Export singleton instance
export const redirectService = RedirectService.getInstance();