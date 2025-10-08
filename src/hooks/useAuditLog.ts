import { supabase } from '@/integrations/supabase/client'

export interface AuditLogEntry {
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'permission_change' | 'export' | 'import'
  entityType: 'user' | 'profile' | 'certidao' | 'payment' | 'event' | 'notification' | 'system'
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
}

export const useAuditLog = () => {
  const logAction = async (entry: AuditLogEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('Tentativa de log sem usuário autenticado')
        return
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          old_values: entry.oldValues,
          new_values: entry.newValues,
        })

      if (error) {
        console.error('Erro ao registrar audit log:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar audit log:', error)
    }
  }

  return { logAction }
}
