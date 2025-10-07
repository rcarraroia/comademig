import { useAuthState } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'

type UserRole = 'user' | 'admin' | 'super_admin' | 'moderator'

interface RolePermissions {
  [key: string]: UserRole[]
}

// Definir permissões por funcionalidade
const ROLE_PERMISSIONS: RolePermissions = {
  // Gestão de usuários
  'users.view': ['admin', 'super_admin'],
  'users.edit': ['admin', 'super_admin'],
  'users.delete': ['super_admin'],
  'users.create': ['admin', 'super_admin'],
  
  // Perfis e permissões
  'profiles.view': ['super_admin'],
  'profiles.edit': ['super_admin'],
  
  // Tipos de membro
  'member_types.view': ['admin', 'super_admin'],
  'member_types.edit': ['admin', 'super_admin'],
  'member_types.create': ['admin', 'super_admin'],
  'member_types.delete': ['super_admin'],
  
  // Financeiro
  'financial.view': ['admin', 'super_admin'],
  'financial.edit': ['admin', 'super_admin'],
  'financial.refund': ['super_admin'],
  'financial.cancel': ['admin', 'super_admin'],
  
  // Transações
  'transactions.view': ['admin', 'super_admin'],
  'transactions.export': ['admin', 'super_admin'],
  
  // Planos de assinatura
  'subscription_plans.view': ['admin', 'super_admin'],
  'subscription_plans.edit': ['admin', 'super_admin'],
  'subscription_plans.create': ['admin', 'super_admin'],
  'subscription_plans.delete': ['super_admin'],
  
  // Certidões
  'certidoes.view': ['admin', 'super_admin', 'moderator'],
  'certidoes.approve': ['admin', 'super_admin'],
  'certidoes.reject': ['admin', 'super_admin'],
  
  // Eventos
  'events.view': ['admin', 'super_admin', 'moderator'],
  'events.edit': ['admin', 'super_admin'],
  'events.create': ['admin', 'super_admin'],
  'events.delete': ['super_admin'],
  
  // Suporte
  'support.view': ['admin', 'super_admin', 'moderator'],
  'support.respond': ['admin', 'super_admin', 'moderator'],
  'support.assign': ['admin', 'super_admin'],
  'support.close': ['admin', 'super_admin'],
  
  // Auditoria
  'audit.view': ['admin', 'super_admin'],
  'audit.export': ['super_admin'],
  
  // Configurações do sistema
  'settings.view': ['super_admin'],
  'settings.edit': ['super_admin'],
  
  // Banco de dados
  'database.view': ['super_admin'],
  'database.backup': ['super_admin'],
  'database.restore': ['super_admin'],
  
  // Carteiras digitais
  'carteiras.view': ['admin', 'super_admin', 'moderator'],
  'carteiras.approve': ['admin', 'super_admin'],
  'carteiras.reject': ['admin', 'super_admin'],
}

export function useRoleAccess() {
  const { profile, isLoading } = useAuthState()

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (isLoading || !profile?.role) return false
    
    const allowedRoles = ROLE_PERMISSIONS[permission]
    if (!allowedRoles) return false
    
    return allowedRoles.includes(profile.role as UserRole)
  }

  // Verificar se o usuário tem pelo menos uma das permissões
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Verificar se o usuário tem todas as permissões
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Verificar se o usuário tem um role específico
  const hasRole = (role: UserRole): boolean => {
    if (isLoading || !profile?.role) return false
    return profile.role === role
  }

  // Verificar se o usuário tem pelo menos um dos roles
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (isLoading || !profile?.role) return false
    return roles.includes(profile.role as UserRole)
  }

  // Verificar se é admin (admin ou super_admin)
  const isAdmin = (): boolean => {
    return hasAnyRole(['admin', 'super_admin'])
  }

  // Verificar se é super admin
  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin')
  }

  // Verificar se é moderador ou superior
  const isModerator = (): boolean => {
    return hasAnyRole(['moderator', 'admin', 'super_admin'])
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isModerator,
    currentRole: profile?.role as UserRole,
    isLoading
  }
}

// Hook para proteger rotas baseado em permissões
export function useRequirePermission(
  permission: string | string[], 
  redirectTo: string = '/dashboard'
) {
  const { hasPermission, hasAnyPermission, isLoading } = useRoleAccess()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    const hasAccess = Array.isArray(permission) 
      ? hasAnyPermission(permission)
      : hasPermission(permission)

    if (!hasAccess) {
      toast.error('Você não tem permissão para acessar esta página')
      navigate(redirectTo, { replace: true })
    }
  }, [permission, hasPermission, hasAnyPermission, isLoading, navigate, redirectTo])

  return {
    hasAccess: Array.isArray(permission) 
      ? hasAnyPermission(permission)
      : hasPermission(permission),
    isLoading
  }
}

// Hook para proteger rotas baseado em roles
export function useRequireRole(
  role: UserRole | UserRole[], 
  redirectTo: string = '/dashboard'
) {
  const { hasRole, hasAnyRole, isLoading } = useRoleAccess()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    const hasAccess = Array.isArray(role) 
      ? hasAnyRole(role)
      : hasRole(role)

    if (!hasAccess) {
      toast.error('Você não tem permissão para acessar esta página')
      navigate(redirectTo, { replace: true })
    }
  }, [role, hasRole, hasAnyRole, isLoading, navigate, redirectTo])

  return {
    hasAccess: Array.isArray(role) 
      ? hasAnyRole(role)
      : hasRole(role),
    isLoading
  }
}

// Componente HOC para proteger componentes baseado em permissões
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  permission: string | string[],
  fallback?: React.ComponentType
) {
  return function ProtectedComponent(props: T) {
    const { hasPermission, hasAnyPermission, isLoading } = useRoleAccess()

    if (isLoading) {
      return <div>Carregando...</div>
    }

    const hasAccess = Array.isArray(permission) 
      ? hasAnyPermission(permission)
      : hasPermission(permission)

    if (!hasAccess) {
      if (fallback) {
        const FallbackComponent = fallback
        return <FallbackComponent />
      }
      return (
        <div className="p-4 text-center">
          <p className="text-gray-500">Você não tem permissão para ver este conteúdo.</p>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Componente HOC para proteger componentes baseado em roles
export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  role: UserRole | UserRole[],
  fallback?: React.ComponentType
) {
  return function ProtectedComponent(props: T) {
    const { hasRole, hasAnyRole, isLoading } = useRoleAccess()

    if (isLoading) {
      return <div>Carregando...</div>
    }

    const hasAccess = Array.isArray(role) 
      ? hasAnyRole(role)
      : hasRole(role)

    if (!hasAccess) {
      if (fallback) {
        const FallbackComponent = fallback
        return <FallbackComponent />
      }
      return (
        <div className="p-4 text-center">
          <p className="text-gray-500">Você não tem permissão para ver este conteúdo.</p>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export type { UserRole, RolePermissions }