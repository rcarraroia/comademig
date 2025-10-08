import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!userId) {
        throw new Error('ID do usuário é obrigatório')
      }

      // Buscar nome do usuário antes de deletar (para mensagem de sucesso)
      const { data: userData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', userId)
        .single()

      // Deletar do banco de dados
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Erro ao deletar usuário:', error)
        throw error
      }

      return { id: userId, nome: userData?.nome_completo || 'Usuário' }
    },
    onSuccess: (data) => {
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
