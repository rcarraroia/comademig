import React, { useState, useMemo } from 'react'
import { useRequirePermission } from '@/hooks/useRoleAccess'
import { useAdminData } from '@/hooks/useAdminData'
import ConditionalRender from '@/components/auth/ConditionalRender'
import { UserActions } from '@/components/admin/RoleBasedActions'
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
import { Search, Filter, Users, UserCheck, UserX, Crown, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function UsersAdmin() {
  // Proteger a página - requer permissão para visualizar usuários
  const { hasAccess, isLoading: permissionLoading } = useRequirePermission('users.view')
  
  // Buscar dados reais do banco
  const { profiles, stats, isLoading: dataLoading, refetchProfiles } = useAdminData()
  
  // Estado para busca
  const [searchTerm, setSearchTerm] = useState('')

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
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

    return {
      total: profiles.length,
      active: profiles.filter(p => p.status === 'ativo').length,
      admins: profiles.filter(p => p.tipo_membro === 'admin' || p.tipo_membro === 'super_admin').length,
      recent: profiles.filter(p => new Date(p.created_at) > thirtyDaysAgo).length
    }
  }, [profiles])

  // Filtrar usuários baseado na busca
  const filteredUsers = useMemo(() => {
    if (!profiles) return []
    
    if (!searchTerm) return profiles

    const term = searchTerm.toLowerCase()
    return profiles.filter(user => 
      user.nome_completo?.toLowerCase().includes(term) ||
      user.cpf?.includes(term) ||
      user.igreja?.toLowerCase().includes(term) ||
      user.telefone?.includes(term)
    )
  }, [profiles, searchTerm])

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
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </ConditionalRender>

          <ConditionalRender requiredRole="super_admin">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </ConditionalRender>
        </div>
      </div>

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
                  <TableHead>Ações</TableHead>
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
                    <TableCell>
                      <UserActions
                        entityId={user.id}
                        onEdit={() => console.log('Editar', user.id)}
                        onDelete={() => console.log('Deletar', user.id)}
                      />
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