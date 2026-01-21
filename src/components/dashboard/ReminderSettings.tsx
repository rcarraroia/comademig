import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Mail, 
  Clock, 
  Moon, 
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications';
import { toast } from 'sonner';

interface ReminderSettingsProps {
  onClose?: () => void;
}

export default function ReminderSettings({ onClose }: ReminderSettingsProps) {
  const { 
    settings, 
    updateSettings, 
    clearDismissedNotifications,
    getNotificationCounts 
  } = useSubscriptionNotifications();

  const counts = getNotificationCounts();

  const handleSave = () => {
    toast.success('Configurações salvas', {
      description: 'Suas preferências de lembrete foram atualizadas.'
    });
    onClose?.();
  };

  const handleReset = () => {
    updateSettings({
      enabled: true,
      showAt7Days: true,
      showAt3Days: true,
      showAt1Day: true,
      showOnExpiration: true,
      emailReminders: false,
      dashboardReminders: true,
      reminderFrequency: 'daily',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    });
    toast.success('Configurações restauradas para o padrão');
  };

  const handleClearDismissed = () => {
    clearDismissedNotifications();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Configurações de Lembretes</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Status Atual
          </CardTitle>
          <CardDescription>
            Resumo das suas notificações e lembretes ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{counts.high}</div>
              <div className="text-sm text-muted-foreground">Urgentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{counts.medium}</div>
              <div className="text-sm text-muted-foreground">Importantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{counts.actionRequired}</div>
              <div className="text-sm text-muted-foreground">Ação Necessária</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Ative ou desative os lembretes e configure quando recebê-los
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar/Desativar Lembretes */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Lembretes Ativos</Label>
              <div className="text-sm text-muted-foreground">
                Receber notificações sobre vencimento de assinatura
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>

          <Separator />

          {/* Configurações de Timing */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Quando Notificar</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="7days" className="text-sm">7 dias antes do vencimento</Label>
                <Switch
                  id="7days"
                  checked={settings.showAt7Days}
                  onCheckedChange={(showAt7Days) => updateSettings({ showAt7Days })}
                  disabled={!settings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="3days" className="text-sm">3 dias antes do vencimento</Label>
                <Switch
                  id="3days"
                  checked={settings.showAt3Days}
                  onCheckedChange={(showAt3Days) => updateSettings({ showAt3Days })}
                  disabled={!settings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="1day" className="text-sm">1 dia antes do vencimento</Label>
                <Switch
                  id="1day"
                  checked={settings.showAt1Day}
                  onCheckedChange={(showAt1Day) => updateSettings({ showAt1Day })}
                  disabled={!settings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="expiration" className="text-sm">No dia do vencimento</Label>
                <Switch
                  id="expiration"
                  checked={settings.showOnExpiration}
                  onCheckedChange={(showOnExpiration) => updateSettings({ showOnExpiration })}
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Lembrete */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Lembrete</CardTitle>
          <CardDescription>
            Escolha como e onde receber os lembretes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dashboard Reminders */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-blue-600" />
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Lembretes no Painel</Label>
                <div className="text-xs text-muted-foreground">
                  Mostrar notificações no dashboard
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.dashboardReminders ? "default" : "secondary"}>
                {settings.dashboardReminders ? "Ativo" : "Inativo"}
              </Badge>
              <Switch
                checked={settings.dashboardReminders}
                onCheckedChange={(dashboardReminders) => updateSettings({ dashboardReminders })}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Email Reminders */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-green-600" />
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Lembretes por Email</Label>
                <div className="text-xs text-muted-foreground">
                  Receber emails de lembrete (em breve)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Em Breve</Badge>
              <Switch
                checked={settings.emailReminders}
                onCheckedChange={(emailReminders) => updateSettings({ emailReminders })}
                disabled={true} // Desabilitado até implementar email
              />
            </div>
          </div>

          <Separator />

          {/* Frequência de Lembretes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Frequência de Lembretes</Label>
            <Select
              value={settings.reminderFrequency}
              onValueChange={(reminderFrequency: 'once' | 'daily' | 'weekly') => 
                updateSettings({ reminderFrequency })
              }
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Apenas uma vez</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Com que frequência repetir lembretes não dispensados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horário Silencioso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Horário Silencioso
          </CardTitle>
          <CardDescription>
            Configure um período sem notificações (futuro)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Ativar Horário Silencioso</Label>
            <Switch
              checked={settings.quietHours.enabled}
              onCheckedChange={(enabled) => 
                updateSettings({ 
                  quietHours: { ...settings.quietHours, enabled } 
                })
              }
              disabled={true} // Desabilitado até implementar
            />
          </div>

          <div className="grid grid-cols-2 gap-4 opacity-50">
            <div className="space-y-2">
              <Label className="text-xs">Início</Label>
              <Input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => 
                  updateSettings({ 
                    quietHours: { ...settings.quietHours, start: e.target.value } 
                  })
                }
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fim</Label>
              <Input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => 
                  updateSettings({ 
                    quietHours: { ...settings.quietHours, end: e.target.value } 
                  })
                }
                disabled={true}
              />
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Funcionalidade em desenvolvimento
          </div>
        </CardContent>
      </Card>

      {/* Ações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Avançadas</CardTitle>
          <CardDescription>
            Gerenciar notificações dispensadas e configurações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleClearDismissed}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Reativar Todas as Notificações Dispensadas
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Isso fará com que todas as notificações que você dispensou voltem a aparecer
          </div>
        </CardContent>
      </Card>
    </div>
  );
}