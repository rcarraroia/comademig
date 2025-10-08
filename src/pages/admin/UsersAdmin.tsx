import { useState, useMemo } from 'react'
import { useRequirePermission } from '@/hooks/useRoleAccess'
import { useAdminData, AdminProfile } from '@/hooks/useAdminData'
import { useDebounce } from '@/hooks/useDebounce'
import ConditionalRender from '@/components/auth/ConditionalRender'
import { UserActions } from '@/components/admin/RoleBasedActions'
import UserCreateModal from '@/components/admin/modals/UserCreateModal'
import UserEditModal from '@/components/admin/modals/UserEditModal'
import UserDeleteDialog from '@/components/admin/modals/UserDeleteDialog'
import { UserPermissionsModal } from '@/components/admin/modals/UserPermissionsModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Search, Users, UserCheck, Crown, Loader2, Shield } from 'lucide-react'
import { AdvancedFiltersPanel, AdvancedFilters } from '@/components/admin/AdvancedFiltersPanel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function UsersAdmin() {
  // Proteger a página - requer permissão para visualizar usuários
  const { hasAccess, isLoading: permissionLoading } = useRequirePermission('users.view')
  
  // Buscar dados reais do banco
  const { profiles, isLoading: dataLoading, refetchProfiles } = useAdminData()
  
  // Estado para busca
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Estado para filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    tipoMembro: [],
    status: [],
    periodo: 'all'
  })

  // Estado para modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null)

  // Calcular estatísticas reais
  const statistics = useMemo(() => {
    if (!profiles || profiles.length === 0) {
      return {
        total: 0,
        active: 0,
        admins: 0,
        recent: 0
      }
    }

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    return {
      total: profiles.length,
      active: profiles.filter(p => p.status === 'ativo').length,
      admins: profiles.filter(p => p.tipo_membro === 'admin' || p.tipo_membro === 'super_admin').length,
      recent: profiles.filter(p => new Date(p.created_at) > thirtyDaysAgo).length
    }
  }, [profiles])

  // Filtrar usuários baseado na busca e filtros avançados
  const filteredUsers = useMemo(() => {
    if (!profiles) return []
    
    let filtered = profiles

    // Aplicar busca por texto
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase()
      const cleanTerm = term.replace(/\D/g, '')
      
      filtered = filtered.filter(user => {
        if (user.nome_completo?.toLowerCase().includes(term)) return true
        if (user.cpf && user.cpf.replace(/\D/g, '').includes(cleanTerm)) return true
        if (user.telefone && user.telefone.replace(/\D/g, '').includes(cleanTerm)) return true
        if (user.igreja?.toLowerCase().includes(term)) return true
        return false
      })
    }

    // Aplicar filtro de tipo de membro
    if (advancedFilters.tipoMembro.length > 0) {
      filtered = filtered.filter(user => 
        advancedFilters.tipoMembro.includes(user.tipo_membro)
      )
    }

    // Aplicar filtro de status
    if (advancedFilters.status.length > 0) {
      filtered = filtered.filter(user => 
        advancedFilters.status.includes(user.status || 'ativo')
      )
    }

    // Aplicar filtro de período
    if (advancedFilters.periodo !== 'all') {
      const now = new Date()
      let dateLimit = new Date()

      switch (advancedFilters.periodo) {
        case '7days':
          dateLimit.setDate(now.getDate() - 7)
          break
        case '30days':
          dateLimit.setDate(now.getDate() - 30)
          break
        case '90days':
          dateLimit.setDate(now.getDate() - 90)
          break
        case '1year':
          dateLimit.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter(user => 
        new Date(user.created_at) >= dateLimit
      )
    }

    return filtered
  }, [profiles, debouncedSearchTerm, advancedFilters])

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hasAccess) {
    return null // O hook já redireciona
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados dos usuários...</p>
        </div>
      </div>
    )
  }

  const getRoleIcon = (tipoMembro: string) => {
    switch (tipoMembro) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <UserCheck className="h-4 w-4 text-blue-600" />
      case 'moderador':
        return <UserCheck className="h-4 w-4 text-green-600" />
      case 'pastor':
        return <UserCheck className="h-4 w-4 text-purple-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadge = (tipoMembro: string) => {
    const variants: Record<string, any> = {
      'super_admin': 'default',
      'admin': 'secondary',
      'moderador': 'outline',
      'pastor': 'outline',
      'membro': 'outline'
    }
    
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'moderador': 'Moderador',
      'pastor': 'Pastor',
      'membro': 'Membro'
    }

    return (
      <Badge variant={variants[tipoMembro] || 'outline'}>
        {getRoleIcon(tipoMembro)}
        <span className="ml-1">{labels[tipoMembro] || tipoMembro}</span>
      </Badge>
    )
  }

  const handleSearch = () => {
    // Busca já é feita em tempo real via useMemo
    // Este handler é mantido para compatibilidade com o botão
  }

  const handleRefresh = () => {
    refetchProfiles()
  }

  const handleCreateUser = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditUser = (user: AdminProfile) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminProfile) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleChangePermissions = (user: AdminProfile) => {
    setSelectedUser(user)
    setIsPermissionsModalOpen(true)
  }

  const handleCloseModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteDialogOpen(false)
    setIsPermissionsModalOpen(false)
    setSelectedUser(null)
  }

  const handleApplyFilters = (filters: AdvancedFilters) => {
    setAdvancedFilters(filters)
  }

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (advancedFilters.tipoMembro.length > 0) count += advancedFilters.tipoMembro.length
    if (advancedFilters.status.length > 0) count += advancedFilters.status.length
    if (advancedFilters.periodo !== 'all') count += 1
    return count
  }, [advancedFilters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>

        {/* Ações do header - baseadas em permissões */}
        <div className="flex gap-2">
          <ConditionalRender requiredPermission="users.create">
            <Button onClick={handleCreateUser}>
              <Users className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </ConditionalRender>

          <AdvancedFiltersPanel 
            onApplyFilters={handleApplyFilters}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleRefresh}
      />
      <UserEditModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={handleCloseModals}
        onSuccess={handleRefresh}
      />
      <UserDeleteDialog
        isOpen={isDeleteDialogOpen}
        user={selectedUser}
        onClose={handleCloseModals}
        onSuccess={handleRefresh}
      />
      {selectedUser && (
        <UserPermissionsModal
          open={isPermissionsModalOpen}
          onOpenChange={setIsPermissionsModalOpen}
          user={selectedUser}
        />
      )}

      {/* Estatísticas - DADOS REAIS */}
      <ConditionalRender requiredRole={['admin', 'super_admin']}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-gray-500 mt-1">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.total > 0 ? Math.round((statistics.active / statistics.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.admins}</div>
              <p className="text-xs text-gray-500 mt-1">Com acesso admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Novos (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{statistics.recent}</div>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>
        </div>
      </ConditionalRender>

      {/* Alerta se não houver usuários */}
      {profiles && profiles.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum usuário encontrado no sistema. Comece criando o primeiro usuário.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros e busca - FUNCIONAL */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar usuários específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, CPF, telefone ou igreja..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <Loader2 className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              Encontrados {filteredUsers.length} de {profiles.length} usuários
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de usuários - DADOS REAIS */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie os usuários cadastrados no sistema ({filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum usuário encontrado com o termo "{searchTerm}"</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSearchTerm('')}
                    className="mt-2"
                  >
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum usuário cadastrado ainda</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/Telefone</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nome_completo}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.cpf && <div>{user.cpf}</div>}
                        {user.telefone && <div className="text-gray-500">{user.telefone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.tipo_membro)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.cargo || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.igreja || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'}>
                        {user.status === 'ativo' ? 'Ativo' : user.status || 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChangePermissions(user)}
                          title="Alterar permissões"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <UserActions
                          entityId={user.id}
                          onEdit={() => handleEditUser(user)}
                          onDelete={() => handleDeleteUser(user)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}