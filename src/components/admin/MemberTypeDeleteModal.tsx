import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteMemberType } from '@/hooks/useMemberTypes';
import type { MemberType } from '@/hooks/useMemberTypes';

interface MemberTypeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberType: MemberType | null;
}

export default function MemberTypeDeleteModal({
  isOpen,
  onClose,
  memberType
}: MemberTypeDeleteModalProps) {
  const deleteMutation = useDeleteMemberType();

  const handleDelete = async () => {
    if (!memberType?.id) return;

    try {
      await deleteMutation.mutateAsync(memberType.id);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Delete error:', error);
    }
  };

  if (!memberType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Desativar Tipo de Membro
          </DialogTitle>
          <DialogDescription>
            O tipo de membro será desativado e não aparecerá mais nas listagens ativas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do tipo que será desativado */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Tipo de Membro a ser desativado:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Nome:</strong> {memberType.name}</p>
              {memberType.description && (
                <p><strong>Descrição:</strong> {memberType.description}</p>
              )}
              <p><strong>Status:</strong> {memberType.is_active ? 'Ativo' : 'Inativo'}</p>
            </div>
          </div>

          {/* Aviso sobre consequências */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Nota:</strong> O tipo de membro será apenas desativado, não excluído permanentemente.
              Você pode reativá-lo depois se necessário. Planos e usuários vinculados não serão afetados.
            </AlertDescription>
          </Alert>

          {/* Mensagem de erro se houver */}
          {deleteMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Desativar Tipo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}