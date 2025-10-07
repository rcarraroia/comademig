import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthState } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface PaymentNotification {
  id: string
  user_id: string
  payment_id: string
  type: 'payment_confirmed' | 'payment_overdue' | 'payment_cancelled'
  title: string
  message: string
  read: boolean
  created_at: string
  metadata?: {
    amount?: number
    due_date?: string
    payment_method?: string
    invoice_url?: string
  }
}

export function usePaymentNotifications() {
  const { user } = useAuthState()
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  // Buscar notificações do usuário
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['payment-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('payment_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao buscar notificações:', error)
        throw error
      }

      return data as PaymentNotification[]
    },
    enabled: !!user?.id
  })

  // Contar notificações não lidas
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  // Escutar novas notificações em tempo real
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('payment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as PaymentNotification
          
          // Atualizar cache
          queryClient.setQueryData(
            ['payment-notifications', user.id],
            (old: PaymentNotification[] = []) => [newNotification, ...old]
          )

          // Mostrar toast
          toast.success(newNotification.title, {
            description: newNotification.message,
            action: newNotification.metadata?.invoice_url ? {
              label: 'Ver Comprovante',
              onClick: () => window.open(newNotification.metadata?.invoice_url, '_blank')
            } : undefined
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('payment_notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Atualizar cache local
      queryClient.setQueryData(
        ['payment-notifications', user?.id],
        (old: PaymentNotification[] = []) =>
          old.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('payment_notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)

      if (error) throw error

      // Atualizar cache local
      queryClient.setQueryData(
        ['payment-notifications', user?.id],
        (old: PaymentNotification[] = []) =>
          old.map(n => ({ ...n, read: true }))
      )

      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  // Deletar notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('payment_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Atualizar cache local
      queryClient.setQueryData(
        ['payment-notifications', user?.id],
        (old: PaymentNotification[] = []) =>
          old.filter(n => n.id !== notificationId)
      )

      toast.success('Notificação removida')
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      toast.error('Erro ao remover notificação')
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}