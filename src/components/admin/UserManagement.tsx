
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserPlus } from "lucide-react";
import { useAdminData, AdminProfile } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UserActionsMenu } from "./UserActionsMenu";
import { EditUserModal } from "./EditUserModal";
import { ViewUserModal } from "./ViewUserModal";
import { CreateUserModal } from "./CreateUserModal";

const UserManagement = () => {
  const { profiles, isLoading, refetchProfiles } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredProfiles = profiles.filter((profile: AdminProfile) => {
    const matchesSearch = profile.nome_completo
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      profile.igreja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.cpf?.includes(searchTerm);
    
    const matchesStatus = selectedStatus === "all" || profile.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'suspenso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoMembroColor = (tipo: string) => {
    switch (tipo) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderador': return 'bg-blue-100 text-blue-800';
      case 'tesoureiro': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditUser = (user: AdminProfile) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleViewUser = (user: AdminProfile) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleSuccess = () => {
    refetchProfiles();
  };

  const statusStats = {
    total: profiles.length,
    ativo: profiles.filter(p => p.status === 'ativo').length,
    pendente: profiles.filter(p => p.status === 'pendente').length,
    suspenso: profiles.filter(p => p.status === 'suspenso').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600">Gerencie todos os usuários do sistema</p>
        </div>
        <Button 
          className="bg-comademig-blue hover:bg-comademig-blue/90"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusStats.total}</div>
            <div className="text-sm text-gray-600">Total de Usuários</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusStats.ativo}</div>
            <div className="text-sm text-gray-600">Usuários Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusStats.pendente}</div>
            <div className="text-sm text-gray-600">Usuários Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusStats.suspenso}</div>
            <div className="text-sm text-gray-600">Usuários Suspensos</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, igreja ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-comademig-blue"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente</option>
              <option value="suspenso">Suspenso</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Igreja</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Cargo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile: AdminProfile) => (
                  <tr key={profile.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {profile.nome_completo}
                        </div>
                        <div className="text-sm text-gray-500">{profile.cpf}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{profile.igreja || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{profile.cargo || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(profile.status)}>
                        {profile.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getTipoMembroColor(profile.tipo_membro)}>
                        {profile.tipo_membro}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <UserActionsMenu
                        user={profile}
                        onEdit={handleEditUser}
                        onView={handleViewUser}
                        onSuccess={handleSuccess}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <ViewUserModal
        user={selectedUser}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default UserManagement;
