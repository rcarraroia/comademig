
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminProfile } from "@/hooks/useAdminData";
import { useSupabaseMutation } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useMemberTypes } from "@/hooks/useMemberTypes";
import { Trash2, AlertTriangle } from "lucide-react";

interface EditUserModalProps {
  user: AdminProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UserRole = "membro" | "admin" | "moderador" | "tesoureiro";

export const EditUserModal = ({ user, isOpen, onClose, onSuccess }: EditUserModalProps) => {
  const { getTypesWithFallback } = useMemberTypes();
  const memberTypes = getTypesWithFallback();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    telefone: "",
    igreja: "",
    cargo: "",
    status: "pendente",
    tipo_membro: "membro",
  });

  // Atualizar formulário quando o usuário mudar
  useEffect(() => {
    if (user) {
      setFormData({
        nome_completo: user.nome_completo || "",
        cpf: user.cpf || "",
        telefone: user.telefone || "",
        igreja: user.igreja || "",
        cargo: user.cargo || "",
        status: user.status || "pendente",
        tipo_membro: user.tipo_membro || "membro",
      });
    }
  }, [user]);

  const updateUserMutation = useSupabaseMutation(
    async (data: any) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user?.id);
      
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      successMessage: "Usuário atualizado com sucesso!",
      errorMessage: "Erro ao atualizar usuário"
    }
  );

  const updateUserRoleMutation = useSupabaseMutation(
    async (role: UserRole) => {
      // Primeiro remove todas as roles do usuário
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user?.id);
      
      // Depois adiciona a nova role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user?.id,
          role: role as UserRole
        });
      
      if (error) throw error;
      return role;
    },
    {
      onSuccess: () => {
        onSuccess();
      },
      successMessage: "Papel do usuário atualizado!",
      errorMessage: "Erro ao atualizar papel do usuário"
    }
  );

  const deleteUserMutation = useSupabaseMutation(
    async () => {
      if (!user?.id) throw new Error("ID do usuário não encontrado");
      
      // Primeiro remove todas as roles do usuário
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      // Remove assinaturas do usuário
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      // Remove o perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (error) throw error;
      return user.id;
    },
    {
      onSuccess: () => {
        onSuccess();
        onClose();
        setShowDeleteConfirm(false);
      },
      successMessage: "Usuário excluído com sucesso!",
      errorMessage: "Erro ao excluir usuário"
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { tipo_membro, ...profileData } = formData;
    
    // Atualiza o perfil
    updateUserMutation.mutate(profileData);
    
    // Atualiza a role se mudou
    if (tipo_membro !== user?.tipo_membro) {
      updateUserRoleMutation.mutate(tipo_membro as UserRole);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteUser = () => {
    deleteUserMutation.mutate();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome_completo">Nome Completo</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="igreja">Igreja</Label>
              <Input
                id="igreja"
                value={formData.igreja}
                onChange={(e) => handleInputChange('igreja', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={formData.cargo}
              onChange={(e) => handleInputChange('cargo', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tipo_membro">Tipo de Membro</Label>
              <Select value={formData.tipo_membro} onValueChange={(value) => handleInputChange('tipo_membro', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {memberTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name.toLowerCase()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="flex justify-between items-center pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Usuário
              </Button>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending || updateUserRoleMutation.isPending}
                >
                  {(updateUserMutation.isPending || updateUserRoleMutation.isPending) ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção!</strong> Esta ação não pode ser desfeita. O usuário será permanentemente excluído do sistema, incluindo:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Perfil e dados pessoais</li>
                  <li>Roles e permissões</li>
                  <li>Assinaturas de tipos de membro</li>
                  <li>Histórico de atividades</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg">{user.nome_completo}</h4>
              <p className="text-sm text-gray-600">CPF: {user.cpf}</p>
              <p className="text-sm text-gray-600">Email: {user.id}</p>
              <p className="text-sm text-gray-600">Tipo: {user.tipo_membro}</p>
              <p className="text-sm text-gray-600">Status: {user.status}</p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                className="flex items-center gap-2"
              >
                {deleteUserMutation.isPending ? (
                  <>Excluindo...</>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirmar Exclusão
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
