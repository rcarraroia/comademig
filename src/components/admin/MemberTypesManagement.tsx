import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemberTypes, useToggleMemberTypeStatus, useDeleteMemberType } from '@/hooks/useMemberTypes';
import MemberTypeFormModal from './MemberTypeFormModal';
import MemberTypeDeleteModal from './MemberTypeDeleteModal';
import MemberTypeStats from './MemberTypeStats';
import UnifiedMemberTypeForm from './UnifiedMemberTypeForm';

export default function MemberTypesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnifiedFormOpen, setIsUnifiedFormOpen] = useState(false);
  const [editingMemberType, setEditingMemberType] = useState<any>(null);
  const [deletingMemberType, setDeletingMemberType] = useState<any>(null);

  // Hooks - sempre buscar todos (ativos e inativos)
  const { data: memberTypes, isLoading, error } = useMemberTypes({ 
    includeInactive: true 
  });
  const toggleStatusMutation = useToggleMemberTypeStatus();
  const deleteMutation = useDeleteMemberType();

  // Separar tipos ativos e inativos
  const activeMemberTypes = memberTypes?.filter(memberType => 
    memberType.is_active && (
      memberType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const inactiveMemberTypes = memberTypes?.filter(memberType => 
    !memberType.is_active && (
      memberType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberType.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleToggleStatus = (memberType: any) => {
    toggleStatusMutation.mutate({
      id: memberType.id,
      is_active: !memberType.is_active
    });
  };

  const handleEdit = (memberType: any) => {
    setEditingMemberType(memberType);
  };

  const handleDelete = (memberType: any) => {
    setDeletingMemberType(memberType);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setEditingMemberType(null);
    setDeletingMemberType(null);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar tipos de membro: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Membro</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de membro e cargos ministeriais
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsUnifiedFormOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Tipo + Plano
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Apenas Tipo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <MemberTypeStats memberTypes={memberTypes} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
          <CardDescription>
            Busque por nome ou descrição dos tipos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">Ativos</Badge>
            <span>Tipos de Membro Ativos ({activeMemberTypes.length})</span>
          </CardTitle>
          <CardDescription>
            Tipos de membro disponíveis para uso no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : activeMemberTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Nenhum tipo ativo encontrado com os filtros aplicados'
                  : 'Nenhum tipo de membro ativo cadastrado'
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Tipo
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMemberTypes.map((memberType) => (
                    <TableRow key={memberType.id}>
                      <TableCell className="font-medium">
                        {memberType.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {memberType.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {memberType.order_of_exhibition || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {memberType.created_at 
                          ? new Date(memberType.created_at).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(memberType)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(memberType)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(memberType)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos Inativos */}
      {inactiveMemberTypes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-orange-200 text-orange-800">Inativos</Badge>
              <span>Tipos de Membro Inativos ({inactiveMemberTypes.length})</span>
            </CardTitle>
            <CardDescription>
              Tipos desativados que não estão disponíveis para uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-orange-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Desativado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveMemberTypes.map((memberType) => (
                    <TableRow key={memberType.id} className="opacity-60">
                      <TableCell className="font-medium">
                        {memberType.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {memberType.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {memberType.order_of_exhibition || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {memberType.updated_at 
                          ? new Date(memberType.updated_at).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(memberType)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(memberType)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(memberType)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <MemberTypeFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        memberType={null}
        mode="create"
      />

      <MemberTypeFormModal
        isOpen={!!editingMemberType}
        onClose={handleCloseModals}
        memberType={editingMemberType}
        mode="edit"
      />

      <MemberTypeDeleteModal
        isOpen={!!deletingMemberType}
        onClose={handleCloseModals}
        memberType={deletingMemberType}
      />

      {/* Modal Unificado */}
      {isUnifiedFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Criar Tipo de Membro + Plano de Assinatura</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsUnifiedFormOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <UnifiedMemberTypeForm 
                onSuccess={() => {
                  setIsUnifiedFormOpen(false);
                  // Recarregar dados se necessário
                }}
                onCancel={() => setIsUnifiedFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}