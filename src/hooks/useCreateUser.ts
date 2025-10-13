import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuditLog } from '@/hooks/useAuditLog'

export interface CreateUserInput {
  nome_completo: string
  cpf: string
  telefone: string
  igreja: string
  cargo: string
  tipo_membro: 'membro' | 'pastor' | 'moderador' | 'admin' | 'super_admin'
  status: 'ativo' | 'inativo' | 'pendente'
  // Campos opcionais
  rg?: string
  data_nascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_ordenacao?: string
  tempo_ministerio?: string
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { logAction } = useAuditLog()

  return useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      // Validar dados antes de enviar
      if (!userData.nome_completo || !userData.cpf || !userData.telefone) {
        throw new Error('Campos obrigatórios não preenchidos')
      }

      // Inserir no banco de dados
      const insertData: any = {
        nome_completo: userData.nome_completo,
        cpf: userData.cpf,
        telefone: userData.telefone,
        igreja: userData.igreja,
        cargo: userData.cargo,
        tipo_membro: userData.tipo_membro,
        status: userData.status,
      }

      // Adicionar campos opcionais apenas se fornecidos
      if (userData.rg) insertData.rg = userData.rg
      if (userData.data_nascimento) insertData.data_nascimento = userData.data_nascimento
      if (userData.endereco) insertData.endereco = userData.endereco
      if (userData.cidade) insertData.cidade = userData.cidade
      if (userData.estado) insertData.estado = userData.estado
      if (userData.cep) insertData.cep = userData.cep
      if (userData.data_ordenacao) insertData.data_ordenacao = userData.data_ordenacao
      if (userData.tempo_ministerio) insertData.tempo_ministerio = userData.tempo_ministerio

      const { data, error } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar usuário:', error)
        throw error
      }

      return data
    },
    onSuccess: async (data) => {
      // Registrar no audit log
      await logAction({
        action: 'create',
        entityType: 'user',
        entityId: data.id,
        newValues: {
          nome_completo: data.nome_completo,
          cpf: data.cpf,
          tipo_membro: data.tipo_membro,
        },
      })

      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })

      toast({
        title: 'Usuário criado com sucesso!',
        description: `${data.nome_completo} foi adicionado ao sistema.`,
      })
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error)
      
      let errorMessage = 'Erro ao criar usuário. Tente novamente.'
      
      // Tratar erros específicos
      if (error.code === '23505') {
        errorMessage = 'CPF já cadastrado no sistema.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Erro ao criar usuário',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}
