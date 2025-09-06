import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users, Settings } from "lucide-react";
import { useMemberTypes } from "@/hooks/useMemberTypes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { MemberTypeForm } from "./MemberTypeForm";
import { MemberTypeDeleteModal } from "./MemberTypeDeleteModal";
import { MemberTypeStats } from "./MemberTypeStats";
import type { MemberType } from "@/hooks/useMemberTypes";

const MemberTypesManagement = () => {
  const { memberTypes, isLoading, refetch } = useMemberTypes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<MemberType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredTypes = memberTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setSelectedType(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (type: MemberType) => {
    setSelectedType(type);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDelete = (type: MemberType) => {
    setSelectedType(type);
    setIsDeleteModalOpen(true);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedType(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tipos de Membro</h1>
          <p className="text-gray-600">Gerencie os tipos de membro disponíveis no sistema</p>
        </div>
        <Button 
          className="bg-comademig-blue hover:bg-comademig-blue/90"
          onClick={handleCreateNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Estatísticas */}
      <MemberTypeStats memberTypes={memberTypes} />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card> 
     {/* Lista de Tipos */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Membro ({filteredTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <Badge variant={type.is_active ? "default" : "secondary"}>
                      {type.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {type.description && (
                    <p className="text-gray-600 mt-1">{type.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {type._count?.users || 0} usuários
                    </span>
                    <span>Criado em {new Date(type.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(type)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredTypes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhum tipo encontrado' : 'Nenhum tipo de membro cadastrado'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <MemberTypeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
        memberType={selectedType}
        mode={formMode}
      />

      <MemberTypeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleSuccess}
        memberType={selectedType}
      />
    </div>
  );
};

export default MemberTypesManagement;