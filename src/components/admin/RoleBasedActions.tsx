import React from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import ConditionalRender from '@/components/auth/ConditionalRender'

interface RoleBasedActionsProps {
  entityType: 'user' | 'member_type' | 'financial' | 'event' | 'support'
  entityId?: string
  onEdit?: () => void
  onDelete?: () => void
  onCreate?: () => void
  onExport?: () => void
  onImport?: () => void
  onApprove?: () => void
  onReject?: () => void
}

export default function RoleBasedActions({
  entityType,
  entityId,
  onEdit,
  onDelete
}: RoleBasedActionsProps) {
  // Definir permissões baseado no tipo de entidade
  const getPermissions = (action: string) => {
    return `${entityType}s.${action}` // ex: users.edit, member_types.delete
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Ação de editar */}
      <ConditionalRender requiredPermission={getPermissions('edit')}>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </ConditionalRender>

      {/* Ação de deletar - apenas super admin */}
      <ConditionalRender requiredPermission={getPermissions('delete')}>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </ConditionalRender>
    </div>
  )
}

// Componente específico para ações de usuário
export function UserActions(props: Omit<RoleBasedActionsProps, 'entityType'>) {
  return <RoleBasedActions {...props} entityType="user" />
}

// Componente específico para ações financeiras
export function FinancialActions(props: Omit<RoleBasedActionsProps, 'entityType'>) {
  return <RoleBasedActions {...props} entityType="financial" />
}

// Componente específico para ações de suporte
export function SupportActions(props: Omit<RoleBasedActionsProps, 'entityType'>) {
  return <RoleBasedActions {...props} entityType="support" />
}