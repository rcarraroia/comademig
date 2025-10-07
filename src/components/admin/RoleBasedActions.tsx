import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Edit, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Shield,
  Eye,
  UserPlus,
  DollarSign
} from 'lucide-react'
import ConditionalRender from '@/components/auth/ConditionalRender'
import { useRoleAccess } from '@/hooks/useRoleAccess'

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
  onDelete,
  onCreate,
  onExport,
  onImport,
  onApprove,
  onReject
}: RoleBasedActionsProps) {
  const { hasPermission, isSuperAdmin, isAdmin } = useRoleAccess()

  // Definir permissões baseado no tipo de entidade
  const getPermissions = (action: string) => {
    return `${entityType}s.${action}` // ex: users.edit, member_types.delete
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Ação de visualizar - disponível para todos os admins */}
      <ConditionalRender requiredRole={['admin', 'super_admin', 'moderator']}>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Visualizar
        </Button>
      </ConditionalRender>

      {/* Ação de criar */}
      <ConditionalRender requiredPermission={getPermissions('create')}>
        <Button variant="default" size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Criar
        </Button>
      </ConditionalRender>

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

      {/* Ações específicas por tipo de entidade */}
      {entityType === 'financial' && (
        <>
          <ConditionalRender requiredPermission="financial.refund">
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-1" />
              Reembolsar
            </Button>
          </ConditionalRender>
          
          <ConditionalRender requiredPermission="transactions.export">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </ConditionalRender>
        </>
      )}

      {entityType === 'user' && (
        <>
          <ConditionalRender requiredRole="super_admin">
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-1" />
              Permissões
            </Button>
          </ConditionalRender>
          
          <ConditionalRender requiredPermission="users.create">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Convidar
            </Button>
          </ConditionalRender>
        </>
      )}

      {(entityType === 'support' || entityType === 'event') && (
        <>
          <ConditionalRender requiredPermission={`${entityType}s.approve`}>
            <Button variant="outline" size="sm" onClick={onApprove}>
              <Shield className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
          </ConditionalRender>
        </>
      )}

      {/* Ações de importação/exportação - apenas super admin */}
      <ConditionalRender requiredRole="super_admin">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="h-4 w-4 mr-1" />
            Importar
          </Button>
        </div>
      </ConditionalRender>

      {/* Configurações avançadas - apenas super admin */}
      <ConditionalRender requiredRole="super_admin">
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Configurar
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