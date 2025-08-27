import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users } from 'lucide-react';
import { useMemberTypes, type MemberType } from '@/hooks/useMemberTypes';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface MemberTypeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  memberType: MemberType | null;
}

export const MemberTypeDeleteModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  memberType 
}: MemberTypeDeleteModalProps) => {
  const { deleteMemberType } = useMemberTypes();

  if (!memberType) return null;

  const hasUsers = (memberType._count?.users || 0) > 0;
  const hasSubscriptions = (memberType._count?.subscriptions || 0) > 0;

  const handleDelete = async () => {
    try {
      await deleteMemberType.mutateAsync(memberType.id);
      onSuccess();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Tipo de Membro
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Tem certeza que deseja excluir este tipo de membro?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do tipo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold">{memberType.name}</h4>
            {memberType.description && (
              <p className="text-sm text-gray-600 mt-1">{memberType.description}</p>
            )}
          </div>

          {/* Alertas de dependências */}
          {hasUsers && (
            <Alert variant="destructive">
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Não é possível excluir:</strong> Este tipo possui {memberType._count?.users} usuário(s) associado(s).
                Você deve primeiro alterar o tipo desses usuários antes de excluir.
              </AlertDescription>
            </Alert>
          )}

          {hasSubscriptions && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Atenção:</strong> Este tipo possui {memberType._count?.subscriptions} assinatura(s) associada(s).
                Essas associações serão removidas automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {!hasUsers && !hasSubscriptions && (
            <Alert>
              <AlertDescription>
                Este tipo de membro pode ser excluído com segurança pois não possui dependências.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={deleteMemberType.isPending}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={hasUsers || deleteMemberType.isPending}
          >
            {deleteMemberType.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Excluindo...
              </>
            ) : (
              'Excluir Tipo'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};