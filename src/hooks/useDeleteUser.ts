import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuditLog } from '@/hooks/useAuditLog'

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { logAction } = useAuditLog()

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!userId) {
        throw new Error('ID do usuário é obrigatório')
      }

      // Buscar dados do usuário antes de deletar (para audit log e mensagem)
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // PROTEÇÃO: Não permitir deletar super_admin
      if (userData?.tipo_membro === 'super_admin') {
        throw new Error('Não é possível excluir o Super Administrador do sistema')
      }

      // Deletar do banco de dados
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Erro ao deletar usuário:', error)
        throw error
      }

      return { id: userId, nome: userData?.nome_completo || 'Usuário', userData }
    },
    onSuccess: async (data) => {
      // Registrar no audit log
      await logAction({
        action: 'delete',
        entityType: 'user',
        entityId: data.id,
        oldValues: data.userData,
      })

      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })

      toast({
        title: 'Usuário excluído com sucesso!',
        description: `${data.nome} foi removido do sistema.`,
      })
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error)
      
      let errorMessage = 'Erro ao excluir usuário. Tente novamente.'
      
      // Tratar erros específicos
      if (error.code === '23503') {
        errorMessage = 'Não é possível excluir este usuário pois existem registros relacionados.'
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Usuário não encontrado.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Erro ao excluir usuário',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}
