import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useMemberTypes } from '@/hooks/useMemberTypes';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal = ({ isOpen, onClose, onSuccess }: CreateUserModalProps) => {
  const { toast } = useToast();
  const { getTypesWithFallback } = useMemberTypes();
  const memberTypes = getTypesWithFallback();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome_completo: '',
    cpf: '',
    telefone: '',
    igreja: '',
    cargo: '',
    tipo_membro: 'membro',
    status: 'ativo'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome_completo: formData.nome_completo,
            cpf: formData.cpf,
            telefone: formData.telefone,
            igreja: formData.igreja,
            cargo: formData.cargo,
            tipo_membro: formData.tipo_membro,
            status: formData.status
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Atualizar o perfil com dados adicionais
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: formData.nome_completo,
          cpf: formData.cpf,
          telefone: formData.telefone,
          igreja: formData.igreja,
          cargo: formData.cargo,
          tipo_membro: formData.tipo_membro,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        // Não falha aqui pois o usuário já foi criado
      }

      // 3. Se não for membro comum, criar role específica
      if (formData.tipo_membro !== 'membro') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: formData.tipo_membro as 'admin' | 'moderador' | 'tesoureiro'
          });

        if (roleError) {
          console.error('Erro ao criar role:', roleError);
          // Não falha aqui pois o usuário já foi criado
        }
      }

      toast({
        title: "Usuário criado com sucesso",
        description: `${formData.nome_completo} foi adicionado ao sistema.`,
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        nome_completo: '',
        cpf: '',
        telefone: '',
        igreja: '',
        cargo: '',
        tipo_membro: 'membro',
        status: 'ativo'
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo usuário no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados de Acesso */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados de Acesso</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha Temporária *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(31) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange('cargo', e.target.value)}
                  placeholder="Ex: Pastor, Evangelista, Diácono"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="igreja">Igreja</Label>
              <Input
                id="igreja"
                value={formData.igreja}
                onChange={(e) => handleInputChange('igreja', e.target.value)}
                placeholder="Nome da igreja"
              />
            </div>
          </div>

          {/* Configurações do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações do Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-comademig-blue hover:bg-comademig-blue/90">
              {loading ? (
                <>
                  <LoadingSpinner />
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};