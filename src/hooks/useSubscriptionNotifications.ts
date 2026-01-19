import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { toast } from 'sonner';
import { differenceInDays, parseISO, isAfter } from 'date-fns';

interface SubscriptionNotification {
  id: string;
  type: 'expiring_soon' | 'expired' | 'overdue' | 'pending_payment';
  title: string;
  message: string;
  daysUntilExpiration: number | null;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  dismissed: boolean;
  dismissedUntil?: string; // ISO date string
}

interface NotificationSettings {
  enabled: boolean;
  showAt7Days: boolean;
  showAt3Days: boolean;
  showAt1Day: boolean;
  showOnExpiration: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  showAt7Days: true,
  showAt3Days: true,
  showAt1Day: true,
  showOnExpiration: true,
};

const STORAGE_KEY = 'subscription-notifications';
const SETTINGS_KEY = 'subscription-notification-settings';

export function useSubscriptionNotifications() {
  const { user } = useAuth();
  const { getSubscriptionStatus, subscription } = useSubscriptionActions();
  
  const [notifications, setNotifications] = useState<SubscriptionNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [hasActiveNotifications, setHasActiveNotifications] = useState(false);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Erro ao carregar configurações de notificação:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
  };

  // Carregar notificações dismissadas do localStorage
  const loadDismissedNotifications = (): Record<string, string> => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar notificações dismissadas:', error);
      }
    }
    return {};
  };

  // Salvar notificação dismissada no localStorage
  const saveDismissedNotification = (notificationId: string, dismissedUntil: string) => {
    const dismissed = loadDismissedNotifications();
    dismissed[notificationId] = dismissedUntil;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  };

  // Verificar se notificação foi dismissada
  const isNotificationDismissed = (notificationId: string): boolean => {
    const dismissed = loadDismissedNotifications();
    const dismissedUntil = dismissed[notificationId];
    
    if (!dismissedUntil) return false;
    
    const now = new Date();
    const dismissedDate = parseISO(dismissedUntil);
    
    return isAfter(dismissedDate, now);
  };

  // Gerar notificações baseadas no status da assinatura
  const generateNotifications = (): SubscriptionNotification[] => {
    if (!settings.enabled || !subscription) return [];

    const status = getSubscriptionStatus();
    const notifications: SubscriptionNotification[] = [];

    // Notificação para assinatura pendente
    if (status.subscription?.status === 'pending') {
      const notificationId = `pending-${status.subscription.id}`;
      if (!isNotificationDismissed(notificationId)) {
        notifications.push({
          id: notificationId,
          type: 'pending_payment',
          title: 'Pagamento Pendente',
          message: 'Finalize o pagamento da sua assinatura para ativar todos os benefícios.',
          daysUntilExpiration: null,
          priority: 'high',
          actionRequired: true,
          dismissed: false,
        });
      }
    }

    // Notificação para assinatura vencida
    if (status.subscription?.status === 'overdue' || status.subscription?.status === 'expired') {
      const notificationId = `overdue-${status.subscription.id}`;
      if (!isNotificationDismissed(notificationId)) {
        notifications.push({
          id: notificationId,
          type: 'overdue',
          title: 'Assinatura Vencida',
          message: 'Sua assinatura está vencida. Renove agora para manter o acesso aos serviços.',
          daysUntilExpiration: status.daysUntilExpiration,
          priority: 'high',
          actionRequired: true,
          dismissed: false,
        });
      }
    }

    // Notificações para assinatura ativa próxima do vencimento
    if (status.subscription?.status === 'active' && status.daysUntilExpiration !== null) {
      const days = status.daysUntilExpiration;
      
      // 7 dias antes
      if (days <= 7 && days > 3 && settings.showAt7Days) {
        const notificationId = `expiring-7-${status.subscription.id}`;
        if (!isNotificationDismissed(notificationId)) {
          notifications.push({
            id: notificationId,
            type: 'expiring_soon',
            title: 'Assinatura Vence em 7 Dias',
            message: 'Sua assinatura vence em breve. Renove antecipadamente para evitar interrupções.',
            daysUntilExpiration: days,
            priority: 'medium',
            actionRequired: false,
            dismissed: false,
          });
        }
      }

      // 3 dias antes
      if (days <= 3 && days > 1 && settings.showAt3Days) {
        const notificationId = `expiring-3-${status.subscription.id}`;
        if (!isNotificationDismissed(notificationId)) {
          notifications.push({
            id: notificationId,
            type: 'expiring_soon',
            title: 'Assinatura Vence em 3 Dias',
            message: 'Atenção! Sua assinatura vence em poucos dias. Renove agora para manter o acesso.',
            daysUntilExpiration: days,
            priority: 'high',
            actionRequired: true,
            dismissed: false,
          });
        }
      }

      // 1 dia antes
      if (days <= 1 && days >= 0 && settings.showAt1Day) {
        const notificationId = `expiring-1-${status.subscription.id}`;
        if (!isNotificationDismissed(notificationId)) {
          notifications.push({
            id: notificationId,
            type: 'expiring_soon',
            title: 'Assinatura Vence Hoje!',
            message: 'Sua assinatura vence hoje. Renove imediatamente para evitar a suspensão dos serviços.',
            daysUntilExpiration: days,
            priority: 'high',
            actionRequired: true,
            dismissed: false,
          });
        }
      }
    }

    return notifications;
  };

  // Atualizar notificações quando dados da assinatura mudarem
  useEffect(() => {
    const newNotifications = generateNotifications();
    setNotifications(newNotifications);
    setHasActiveNotifications(newNotifications.length > 0);
  }, [subscription, settings]);

  // Mostrar toast para notificações de alta prioridade (apenas uma vez por sessão)
  useEffect(() => {
    const highPriorityNotifications = notifications.filter(n => 
      n.priority === 'high' && n.actionRequired
    );

    // Verificar se já mostrou toast nesta sessão
    const sessionKey = 'subscription-toast-shown';
    const sessionShown = sessionStorage.getItem(sessionKey);

    if (highPriorityNotifications.length > 0 && !sessionShown) {
      const notification = highPriorityNotifications[0]; // Mostrar apenas a primeira
      
      toast.warning(notification.title, {
        description: notification.message,
        duration: 10000, // 10 segundos
        action: {
          label: 'Renovar Agora',
          onClick: () => {
            // Redirecionar para renovação (implementar se necessário)
            window.location.href = '/dashboard/financeiro';
          }
        }
      });

      // Marcar como mostrado nesta sessão
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [notifications]);

  // Dismissar notificação por período específico
  const dismissNotification = (notificationId: string, dismissFor: 'day' | 'week' | 'month' = 'day') => {
    const now = new Date();
    let dismissedUntil: Date;

    switch (dismissFor) {
      case 'week':
        dismissedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dismissedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default: // day
        dismissedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    saveDismissedNotification(notificationId, dismissedUntil.toISOString());
    
    // Atualizar notificações localmente
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    toast.success('Notificação dispensada', {
      description: `Não será mostrada novamente por ${dismissFor === 'day' ? '1 dia' : dismissFor === 'week' ? '1 semana' : '1 mês'}.`
    });
  };

  // Limpar todas as notificações dismissadas
  const clearDismissedNotifications = () => {
    localStorage.removeItem(STORAGE_KEY);
    const newNotifications = generateNotifications();
    setNotifications(newNotifications);
    toast.success('Notificações reativadas');
  };

  // Contar notificações por prioridade
  const getNotificationCounts = () => {
    const high = notifications.filter(n => n.priority === 'high').length;
    const medium = notifications.filter(n => n.priority === 'medium').length;
    const total = notifications.length;
    const actionRequired = notifications.filter(n => n.actionRequired).length;

    return { high, medium, total, actionRequired };
  };

  return {
    notifications,
    hasActiveNotifications,
    settings,
    updateSettings,
    dismissNotification,
    clearDismissedNotifications,
    getNotificationCounts,
    isEnabled: settings.enabled,
  };
}