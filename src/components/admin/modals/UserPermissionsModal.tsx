import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import { useUpdateUser } from '@/hooks/useUpdateUser';
import { toast } from 'sonner';

interface UserPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    nome_completo: string;
    email?: string;
    tipo_membro: string;
  };
}

const MEMBER_TYPES = [
  {
    value: 'membro',
    label: 'Membro',
    description: 'Acesso básico ao sistema. Pode visualizar seu perfil, carteira digital e solicitar certidões.',
    icon: '👤',
    color: 'text-blue-600'
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acesso ao painel administrativo. Pode gerenciar usuários, aprovar certidões e visualizar relatórios.',
    icon: '⚙️',
    color: 'text-orange-600'
  },
  {
    value: 'super_admin',
    label: 'Super Administrador',
    description: 'Acesso total ao sistema. Pode alterar configurações críticas, gerenciar outros admins e acessar logs de auditoria.',
    icon: '👑',
    color: 'text-red-600'
  }
];

export function UserPermissionsModal({ open, onOpenChange, user }: UserPermissionsModalProps) {
  const [selectedType, setSelectedType] = useState(user.tipo_membro);
  const { mutate: updateUser, isPending } = useUpdateUser();

  const handleSave = () => {
    if (selectedType === user.tipo_membro) {
      toast.info('Nenhuma alteração foi feita');
      onOpenChange(false);
      return;
    }

    updateUser(
      {
        id: user.id,
        tipo_membro: selectedType as 'membro' | 'pastor' | 'moderador' | 'admin'
      },
      {
        onSuccess: () => {
          toast.success('Permissões atualizadas com sucesso');
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error('Erro ao atualizar permissões: ' + error.message);
        }
      }
    );
  };

  const selectedTypeInfo = MEMBER_TYPES.find(t => t.value === selectedType);
  const isDowngrade = (user.tipo_membro === 'super_admin' && selectedType !== 'super_admin') ||
                      (user.tipo_membro === 'admin' && selectedType === 'membro');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alterar Permissões de Usuário
          </DialogTitle>
          <DialogDescription>
            Alterando permissões de: <strong>{user.nome_completo}</strong> {user.email && `(${user.email})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedType} onValueChange={setSelectedType}>
            {MEMBER_TYPES.map((type) => (
              <div
                key={type.value}
                className={`flex items-start space-x-3 rounded-lg border-2 p-4 transition-colors ${
                  selectedType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{type.icon}</span>
                    <span className={`font-semibold ${type.color}`}>{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {isDowngrade && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Você está removendo privilégios administrativos deste usuário.
                Esta ação pode impedir o acesso ao painel administrativo.
              </AlertDescription>
            </Alert>
          )}

          {selectedType !== user.tipo_membro && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Mudança detectada:</strong> {user.tipo_membro} → {selectedTypeInfo?.label}
                <br />
                O usuário será notificado sobre a alteração de permissões.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
