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

export default function MemberTypesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMemberType, setEditingMemberType] = useState<any>(null);
  const [deletingMemberType, setDeletingMemberType] = useState<any>(null);

  // Hooks
  const { data: memberTypes, isLoading, error } = useMemberTypes({ 
    includeInactive: showInactive 
  });
  const toggleStatusMutation = useToggleMemberTypeStatus();
  const deleteMutation = useDeleteMemberType();

  // Filtrar tipos de membro por busca
  const filteredMemberTypes = memberTypes?.filter(memberType =>
    memberType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    memberType.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Estatísticas */}
      <MemberTypeStats memberTypes={memberTypes} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar tipos específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant={showInactive ? "default" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrando Inativos
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Apenas Ativos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Tipos de Membro */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Tipos ({filteredMemberTypes.length})
          </CardTitle>
          <CardDescription>
            {searchTerm && `Resultados para "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredMemberTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Nenhum tipo de membro encontrado com os filtros aplicados'
                  : 'Nenhum tipo de membro cadastrado'
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
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMemberTypes.map((memberType) => (
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
                      <TableCell>
                        <Badge 
                          variant={memberType.is_active ? "default" : "secondary"}
                        >
                          {memberType.is_active ? 'Ativo' : 'Inativo'}
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
                              {memberType.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
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
    </div>
  );
}