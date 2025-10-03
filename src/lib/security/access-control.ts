import { supabase } from '@/integrations/supabase/client'
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logger'

/**
 * Sistema de controle de acesso baseado em roles (RBAC)
 * Implementa permissões granulares e políticas de segurança
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  AFFILIATE = 'affiliate',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum Permission {
  // Administração de usuários
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  MANAGE_ROLES = 'manage_roles',

  // Pagamentos
  CREATE_PAYMENT = 'create_payment',
  READ_PAYMENT = 'read_payment',
  UPDATE_PAYMENT = 'update_payment',
  CANCEL_PAYMENT = 'cancel_payment',
  REFUND_PAYMENT = 'refund_payment',
  READ_ALL_PAYMENTS = 'read_all_payments',

  // Dados financeiros
  READ_FINANCIAL_DATA = 'read_financial_data',
  EXPORT_FINANCIAL_DATA = 'export_financial_data',
  READ_COMMISSION_DATA = 'read_commission_data',

  // Webhooks
  MANAGE_WEBHOOKS = 'manage_webhooks',
  READ_WEBHOOK_LOGS = 'read_webhook_logs',

  // Auditoria
  READ_AUDIT_LOGS = 'read_audit_logs',
  EXPORT_AUDIT_LOGS = 'export_audit_logs',
  MANAGE_AUDIT_SETTINGS = 'manage_audit_settings',

  // Sistema
  MANAGE_SYSTEM_CONFIG = 'manage_system_config',
  READ_SYSTEM_HEALTH = 'read_system_health',
  MANAGE_BACKUPS = 'manage_backups',

  // Dados sensíveis
  ACCESS_SENSITIVE_DATA = 'access_sensitive_data',
  EXPORT_SENSITIVE_DATA = 'export_sensitive_data',
  ENCRYPT_DECRYPT_DATA = 'encrypt_decrypt_data',

  // Afiliados
  MANAGE_AFFILIATES = 'manage_affiliates',
  READ_AFFILIATE_DATA = 'read_affiliate_data',
  PROCESS_COMMISSIONS = 'process_commissions'
}

export interface UserPermissions {
  userId: string
  role: UserRole
  permissions: Permission[]
  restrictions?: {
    ipWhitelist?: string[]
    timeRestrictions?: {
      startTime: string
      endTime: string
      timezone: string
    }
    resourceLimits?: {
      maxPaymentValue?: number
      maxDailyOperations?: number
    }
  }
}

export interface AccessContext {
  userId: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  resource?: {
    type: string
    id: string
  }
  action: string
}

// Mapeamento de roles para permissões
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // Todas as permissões

  [UserRole.ADMIN]: [
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.MANAGE_ROLES,
    Permission.READ_PAYMENT,
    Permission.UPDATE_PAYMENT,
    Permission.CANCEL_PAYMENT,
    Permission.READ_ALL_PAYMENTS,
    Permission.READ_FINANCIAL_DATA,
    Permission.EXPORT_FINANCIAL_DATA,
    Permission.READ_COMMISSION_DATA,
    Permission.MANAGE_WEBHOOKS,
    Permission.READ_WEBHOOK_LOGS,
    Permission.READ_AUDIT_LOGS,
    Permission.READ_SYSTEM_HEALTH,
    Permission.MANAGE_AFFILIATES,
    Permission.READ_AFFILIATE_DATA,
    Permission.PROCESS_COMMISSIONS
  ],

  [UserRole.MODERATOR]: [
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.READ_PAYMENT,
    Permission.UPDATE_PAYMENT,
    Permission.READ_ALL_PAYMENTS,
    Permission.READ_FINANCIAL_DATA,
    Permission.READ_COMMISSION_DATA,
    Permission.READ_WEBHOOK_LOGS,
    Permission.READ_AUDIT_LOGS,
    Permission.READ_AFFILIATE_DATA
  ],

  [UserRole.AFFILIATE]: [
    Permission.READ_USER,
    Permission.CREATE_PAYMENT,
    Permission.READ_PAYMENT,
    Permission.READ_COMMISSION_DATA,
    Permission.READ_AFFILIATE_DATA
  ],

  [UserRole.MEMBER]: [
    Permission.READ_USER,
    Permission.CREATE_PAYMENT,
    Permission.READ_PAYMENT
  ],

  [UserRole.GUEST]: [
    Permission.READ_USER
  ]
}

export class AccessController {
  private static instance: AccessController
  private permissionCache = new Map<string, UserPermissions>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutos

  static getInstance(): AccessController {
    if (!AccessController.instance) {
      AccessController.instance = new AccessController()
    }
    return AccessController.instance
  }

  /**
   * Verifica se usuário tem permissão para executar ação
   */
  async hasPermission(
    userId: string, 
    permission: Permission, 
    context?: Partial<AccessContext>
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId)
      
      if (!userPermissions) {
        await this.logAccessDenied(userId, permission, 'User not found', context)
        return false
      }

      // Verificar se tem a permissão
      if (!userPermissions.permissions.includes(permission)) {
        await this.logAccessDenied(userId, permission, 'Permission not granted', context)
        return false
      }

      // Verificar restrições adicionais
      const restrictionCheck = await this.checkRestrictions(userPermissions, context)
      if (!restrictionCheck.allowed) {
        await this.logAccessDenied(userId, permission, restrictionCheck.reason, context)
        return false
      }

      // Log de acesso autorizado
      await auditLogger.logEvent({
        event_type: AuditEventType.SENSITIVE_DATA_ACCESS,
        severity: AuditSeverity.INFO,
        user_id: userId,
        session_id: context?.sessionId,
        ip_address: context?.ipAddress,
        user_agent: context?.userAgent,
        resource_type: context?.resource?.type,
        resource_id: context?.resource?.id,
        action: `check_permission_${permission}`,
        success: true,
        details: { permission, granted: true }
      })

      return true

    } catch (error) {
      console.error('Error checking permission:', error)
      await this.logAccessDenied(userId, permission, 'System error', context)
      return false
    }
  }

  /**
   * Verifica múltiplas permissões
   */
  async hasAnyPermission(
    userId: string, 
    permissions: Permission[], 
    context?: Partial<AccessContext>
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, context)) {
        return true
      }
    }
    return false
  }

  /**
   * Verifica se tem todas as permissões
   */
  async hasAllPermissions(
    userId: string, 
    permissions: Permission[], 
    context?: Partial<AccessContext>
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission, context))) {
        return false
      }
    }
    return true
  }

  /**
   * Obtém permissões do usuário
   */
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    // Verificar cache
    const cached = this.permissionCache.get(userId)
    if (cached) {
      return cached
    }

    try {
      // Buscar dados do usuário
      const { data: user, error } = await supabase
        .from('profiles' as any)
        .select('id, role, permissions, restrictions')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return null
      }

      // Obter permissões baseadas no role
      const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole] || []
      
      // Combinar com permissões específicas do usuário
      const customPermissions = user.permissions || []
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])]

      const userPermissions: UserPermissions = {
        userId: user.id,
        role: user.role,
        permissions: allPermissions,
        restrictions: user.restrictions
      }

      // Cachear por tempo limitado
      this.permissionCache.set(userId, userPermissions)
      setTimeout(() => {
        this.permissionCache.delete(userId)
      }, this.cacheTimeout)

      return userPermissions

    } catch (error) {
      console.error('Error getting user permissions:', error)
      return null
    }
  }

  /**
   * Verifica restrições adicionais
   */
  private async checkRestrictions(
    userPermissions: UserPermissions, 
    context?: Partial<AccessContext>
  ): Promise<{ allowed: boolean; reason?: string }> {
    const restrictions = userPermissions.restrictions

    if (!restrictions) {
      return { allowed: true }
    }

    // Verificar whitelist de IPs
    if (restrictions.ipWhitelist && context?.ipAddress) {
      if (!restrictions.ipWhitelist.includes(context.ipAddress)) {
        return { allowed: false, reason: 'IP address not in whitelist' }
      }
    }

    // Verificar restrições de horário
    if (restrictions.timeRestrictions) {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5) // HH:MM
      
      if (currentTime < restrictions.timeRestrictions.startTime || 
          currentTime > restrictions.timeRestrictions.endTime) {
        return { allowed: false, reason: 'Access outside allowed time window' }
      }
    }

    // Verificar limites de recursos
    if (restrictions.resourceLimits) {
      // Implementar verificações específicas conforme necessário
      // Por exemplo, verificar se não excedeu limite diário de operações
    }

    return { allowed: true }
  }

  /**
   * Log de acesso negado
   */
  private async logAccessDenied(
    userId: string, 
    permission: Permission, 
    reason: string, 
    context?: Partial<AccessContext>
  ): Promise<void> {
    await auditLogger.logEvent({
      event_type: AuditEventType.PERMISSION_DENIED,
      severity: AuditSeverity.WARNING,
      user_id: userId,
      session_id: context?.sessionId,
      ip_address: context?.ipAddress,
      user_agent: context?.userAgent,
      resource_type: context?.resource?.type,
      resource_id: context?.resource?.id,
      action: `check_permission_${permission}`,
      success: false,
      error_message: reason,
      details: { permission, reason }
    })
  }

  /**
   * Atualiza role do usuário
   */
  async updateUserRole(
    adminUserId: string, 
    targetUserId: string, 
    newRole: UserRole
  ): Promise<boolean> {
    // Verificar se admin tem permissão
    const hasPermission = await this.hasPermission(adminUserId, Permission.MANAGE_ROLES)
    if (!hasPermission) {
      return false
    }

    try {
      const { error } = await supabase
        .from('profiles' as any)
        .update({ role: newRole })
        .eq('id', targetUserId)

      if (error) {
        console.error('Error updating user role:', error)
        return false
      }

      // Limpar cache
      this.permissionCache.delete(targetUserId)

      // Log da alteração
      await auditLogger.logEvent({
        event_type: AuditEventType.ROLE_CHANGED,
        severity: AuditSeverity.WARNING,
        user_id: adminUserId,
        resource_type: 'user',
        resource_id: targetUserId,
        action: 'update_role',
        success: true,
        details: { newRole, targetUserId }
      })

      return true

    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  }

  /**
   * Limpa cache de permissões
   */
  clearPermissionCache(userId?: string): void {
    if (userId) {
      this.permissionCache.delete(userId)
    } else {
      this.permissionCache.clear()
    }
  }

  /**
   * Obtém todas as permissões disponíveis
   */
  getAllPermissions(): Permission[] {
    return Object.values(Permission)
  }

  /**
   * Obtém permissões por role
   */
  getPermissionsByRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }
}

// Instância singleton
export const accessController = AccessController.getInstance()

// Decorador para verificar permissões em funções
export function requirePermission(permission: Permission) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const userId = this.userId || args[0]?.userId
      
      if (!userId) {
        throw new Error('User ID required for permission check')
      }

      const hasPermission = await accessController.hasPermission(userId, permission)
      
      if (!hasPermission) {
        throw new Error(`Permission denied: ${permission}`)
      }

      return method.apply(this, args)
    }
  }
}

// Hook para React components
export function usePermissions(userId: string) {
  const [permissions, setPermissions] = React.useState<Permission[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (userId) {
      accessController.getUserPermissions(userId).then(userPerms => {
        setPermissions(userPerms?.permissions || [])
        setLoading(false)
      })
    }
  }, [userId])

  const hasPermission = (permission: Permission) => permissions.includes(permission)
  const hasAnyPermission = (perms: Permission[]) => perms.some(p => permissions.includes(p))
  const hasAllPermissions = (perms: Permission[]) => perms.every(p => permissions.includes(p))

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}