import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface UpdateUserInput {
  id: string
  // Todos os campos são opcionais para update parcial
  nome_completo?: string
  cpf?: string
  telefone?: string
  igreja?: string
  cargo?: string
  tipo_membro?: 'membro' | 'pastor' | 'moderador' | 'admin'
  status?: 'ativo' | 'inativo' | 'pendente'
  rg?: string
  data_nascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_ordenacao?: string
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...userData }: UpdateUserInput) => {
      if (!id) {
        throw new Error('ID do usuário é obrigatório')
      }

      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })

      toast({
        title: 'Usuário atualizado com sucesso!',
        description: `As informações de ${data.nome_completo} foram atualizadas.`,
      })
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error)
      
      let errorMessage = 'Erro ao atualizar usuário. Tente novamente.'
      
      // Tratar erros específicos
      if (error.code === '23505') {
        errorMessage = 'CPF já cadastrado para outro usuário.'
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Usuário não encontrado.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Erro ao atualizar usuário',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}
