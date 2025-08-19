
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminProfile } from "@/hooks/useAdminData";
import { useSupabaseMutation } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface EditUserModalProps {
  user: AdminProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserModal = ({ user, isOpen, onClose, onSuccess }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    nome_completo: user?.nome_completo || "",
    cpf: user?.cpf || "",
    telefone: user?.telefone || "",
    igreja: user?.igreja || "",
    cargo: user?.cargo || "",
    status: user?.status || "pendente",
    tipo_membro: user?.tipo_membro || "membro",
  });

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
    async (role: string) => {
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
          role: role
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { tipo_membro, ...profileData } = formData;
    
    // Atualiza o perfil
    updateUserMutation.mutate(profileData);
    
    // Atualiza a role se mudou
    if (tipo_membro !== user?.tipo_membro) {
      updateUserRoleMutation.mutate(tipo_membro);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

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
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="tesoureiro">Tesoureiro</SelectItem>
                  <SelectItem value="moderador">Moderador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
        </form>
      </DialogContent>
    </Dialog>
  );
};
