import React from 'react'
import { useRoleAccess, UserRole } from '@/hooks/useRoleAccess'

interface ConditionalRenderProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  requiredPermission?: string | string[]
  fallback?: React.ReactNode
  requireAll?: boolean // Se true, requer TODAS as permissões/roles
}

export default function ConditionalRender({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  requireAll = false
}: ConditionalRenderProps) {
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission, isLoading } = useRoleAccess()

  // Não renderizar nada durante o loading
  if (isLoading) {
    return null
  }

  // Verificar permissões de role
  let hasRoleAccess = true
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      hasRoleAccess = requireAll 
        ? requiredRole.every(role => hasRole(role))
        : hasAnyRole(requiredRole)
    } else {
      hasRoleAccess = hasRole(requiredRole)
    }
  }

  // Verificar permissões específicas
  let hasPermissionAccess = true
  if (requiredPermission) {
    if (Array.isArray(requiredPermission)) {
      hasPermissionAccess = requireAll
        ? requiredPermission.every(permission => hasPermission(permission))
        : hasAnyPermission(requiredPermission)
    } else {
      hasPermissionAccess = hasPermission(requiredPermission)
    }
  }

  // Determinar se deve renderizar baseado no modo (requireAll)
  const shouldRender = requireAll 
    ? hasRoleAccess && hasPermissionAccess
    : hasRoleAccess || hasPermissionAccess

  return shouldRender ? <>{children}</> : <>{fallback}</>
}