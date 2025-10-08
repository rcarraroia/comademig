import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useDeleteUser } from '@/hooks/useDeleteUser'
import { AdminProfile } from '@/hooks/useAdminData'

interface UserDeleteDialogProps {
  isOpen: boolean
  user: AdminProfile | null
  onClose: () => void
  onSuccess?: () => void
}

export default function UserDeleteDialog({ isOpen, user, onClose, onSuccess }: UserDeleteDialogProps) {
  const { mutate: deleteUser, isPending } = useDeleteUser()

  const handleConfirm = () => {
    if (!user) return

    deleteUser(user.id, {
      onSuccess: () => {
        onClose()
        onSuccess?.()
      },
    })
  }

  if (!user) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a excluir o usuário:
            </p>
            <div className="bg-gray-50 p-3 rounded-md space-y-1">
              <p className="font-semibold">{user.nome_completo}</p>
              <p className="text-sm">CPF: {user.cpf}</p>
              <p className="text-sm">Igreja: {user.igreja}</p>
              <p className="text-sm">Cargo: {user.cargo}</p>
            </div>
            <p className="text-red-600 font-medium">
              Esta ação não pode ser desfeita!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir Usuário
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
