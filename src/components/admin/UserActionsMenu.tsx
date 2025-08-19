
import { useState } from "react";
import { MoreHorizontal, Edit, Eye, UserX, UserCheck, Shield, ShieldOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminProfile } from "@/hooks/useAdminData";
import { useSupabaseMutation } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";

interface UserActionsMenuProps {
  user: AdminProfile;
  onEdit: (user: AdminProfile) => void;
  onView: (user: AdminProfile) => void;
  onSuccess: () => void;
}

export const UserActionsMenu = ({ user, onEdit, onView, onSuccess }: UserActionsMenuProps) => {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);

  const updateStatusMutation = useSupabaseMutation(
    async ({ userId, status }: { userId: string, status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);
      
      if (error) throw error;
      return { userId, status };
    },
    {
      onSuccess: () => {
        onSuccess();
        setShowSuspendDialog(false);
        setShowActivateDialog(false);
      },
      successMessage: "Status do usuário atualizado com sucesso!",
      errorMessage: "Erro ao atualizar status do usuário"
    }
  );

  const handleSuspendUser = () => {
    updateStatusMutation.mutate({ userId: user.id, status: 'suspenso' });
  };

  const handleActivateUser = () => {
    updateStatusMutation.mutate({ userId: user.id, status: 'ativo' });
  };

  const canSuspend = user.status !== 'suspenso';
  const canActivate = user.status === 'suspenso' || user.status === 'pendente';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(user)}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onEdit(user)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {canActivate && (
            <DropdownMenuItem 
              onClick={() => setShowActivateDialog(true)}
              className="text-green-600"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Ativar Usuário
            </DropdownMenuItem>
          )}

          {canSuspend && (
            <DropdownMenuItem 
              onClick={() => setShowSuspendDialog(true)}
              className="text-red-600"
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspender Usuário
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Suspensão */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja suspender o usuário <strong>{user.nome_completo}</strong>? 
              O usuário não poderá acessar o sistema até ser reativado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Ativação */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja ativar o usuário <strong>{user.nome_completo}</strong>? 
              O usuário terá acesso completo ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivateUser}
              className="bg-green-600 hover:bg-green-700"
            >
              Ativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
