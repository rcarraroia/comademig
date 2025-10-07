import React from 'react'
import { useRequirePermission } from '@/hooks/useRoleAccess'
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
import { Search, Filter, Users, UserCheck, UserX, Crown } from 'lucide-react'

export default function UsersAdmin() {
  // Proteger a página - requer permissão para visualizar usuários
  const { hasAccess, isLoading } = useRequirePermission('users.view')

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (!hasAccess) {
    return null // O hook já redireciona
  }

  // Dados mockados para exemplo
  const users = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      role: 'user',
      status: 'active',
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      role: 'admin',
      status: 'active',
      created_at: '2024-01-10'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@example.com',
      role: 'super_admin',
      status: 'active',
      created_at: '2024-01-05'
    }
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <UserCheck className="h-4 w-4 text-blue-600" />
      case 'moderator':
        return <UserCheck className="h-4 w-4 text-green-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      'super_admin': 'default',
      'admin': 'secondary',
      'moderator': 'outline',
      'user': 'outline'
    }
    
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'moderator': 'Moderador',
      'user': 'Usuário'
    }

    return (
      <Badge variant={variants[role] || 'outline'}>
        {getRoleIcon(role)}
        <span className="ml-1">{labels[role] || role}</span>
      </Badge>
    )
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

      {/* Estatísticas - visível apenas para admins */}
      <ConditionalRender requiredRole={['admin', 'super_admin']}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">1,180</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">12</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Novos (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">45</div>
            </CardContent>
          </Card>
        </div>
      </ConditionalRender>

      {/* Filtros e busca */}
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
                placeholder="Buscar por nome ou email..."
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
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
        </CardContent>
      </Card>
    </div>
  )
}