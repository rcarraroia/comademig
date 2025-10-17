import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleAccess, UserRole } from '@/hooks/useRoleAccess'
import { useProfileStatus } from '@/hooks/useProfileStatus'
import AccessDenied from './AccessDenied'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredPermission?: string | string[]
  fallback?: React.ComponentType
  redirectTo?: string
  showAccessDenied?: boolean
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback: Fallback,
  redirectTo = '/dashboard',
  showAccessDenied = true
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission } = useRoleAccess()
  const { profile, loading: profileLoading, isPending } = useProfileStatus()
  const location = useLocation()

  // Mostrar loading enquanto carrega
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ✅ NOVA VERIFICAÇÃO: Redirecionar usuários PENDING para página de pagamento pendente
  if (isPending) {
    return <Navigate to="/pagamento-pendente" replace />
  }

  // Verificar permissões de role
  let hasRoleAccess = true
  if (requiredRole) {
    hasRoleAccess = Array.isArray(requiredRole) 
      ? hasAnyRole(requiredRole)
      : hasRole(requiredRole)
  }

  // Verificar permissões específicas
  let hasPermissionAccess = true
  if (requiredPermission) {
    hasPermissionAccess = Array.isArray(requiredPermission)
      ? hasAnyPermission(requiredPermission)
      : hasPermission(requiredPermission)
  }

  // Se não tem acesso
  if (!hasRoleAccess || !hasPermissionAccess) {
    // Usar componente de fallback se fornecido
    if (Fallback) {
      return <Fallback />
    }

    // Mostrar página de acesso negado
    if (showAccessDenied) {
      return (
        <AccessDenied
          title="Acesso Restrito"
          message="Você não tem permissão para acessar esta funcionalidade."
          backTo={redirectTo}
        />
      )
    }

    // Redirecionar para página especificada
    return <Navigate to={redirectTo} replace />
  }

  // Renderizar conteúdo se tem acesso
  return <>{children}</>
}

// Componente específico para rotas administrativas
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute
      requiredRole={['admin', 'super_admin']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  )
}

// Componente específico para rotas de super admin
export function SuperAdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute
      requiredRole="super_admin"
      {...props}
    >
      {children}
    </ProtectedRoute>
  )
}

// Componente específico para rotas de moderador
export function ModeratorRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute
      requiredRole={['moderator', 'admin', 'super_admin']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  )
}