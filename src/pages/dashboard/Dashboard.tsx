
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Bell,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const quickActions = [
    {
      title: "Carteira Digital",
      description: "Acesse sua carteirinha ministerial",
      icon: CreditCard,
      link: "/dashboard/carteira-digital",
      color: "bg-blue-500"
    },
    {
      title: "Meus Dados",
      description: "Atualize suas informações",
      icon: User,
      link: "/dashboard/meus-dados",
      color: "bg-green-500"
    },
    {
      title: "Financeiro",
      description: "Consulte pagamentos e taxas",
      icon: DollarSign,
      link: "/dashboard/financeiro",
      color: "bg-purple-500"
    },
    {
      title: "Certidões",
      description: "Solicite documentos oficiais",
      icon: FileText,
      link: "/dashboard/certidoes",
      color: "bg-orange-500"
    }
  ];

  const notifications = [
    {
      type: "warning",
      title: "Pagamento Pendente",
      description: "Taxa anual de 2024 vence em 15 dias",
      date: "Hoje"
    },
    {
      type: "info",
      title: "Novo Evento Disponível",
      description: "Congresso Regional - Inscrições abertas",
      date: "2 dias atrás"
    },
    {
      type: "success",
      title: "Carteira Atualizada",
      description: "Sua carteirinha foi renovada com sucesso",
      date: "1 semana atrás"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-comademig-blue to-comademig-gold text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Bem-vindo, Pastor João Silva!</h1>
        <p className="text-blue-100">
          Igreja Assembleia de Deus - Campo Regional de Belo Horizonte
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-comademig-blue mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${action.color} text-white`}>
                      <action.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-comademig-blue">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Situação Financeira</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Em Dia</div>
            <p className="text-xs text-muted-foreground">Última contribuição: Janeiro/2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Eventos disponíveis para inscrição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carteira Digital</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativa</div>
            <p className="text-xs text-muted-foreground">Válida até: Dezembro/2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div>
        <h2 className="text-xl font-semibold text-comademig-blue mb-4">Notificações Recentes</h2>
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <Alert key={index} className={
              notification.type === 'warning' ? 'border-orange-200 bg-orange-50' :
              notification.type === 'success' ? 'border-green-200 bg-green-50' :
              'border-blue-200 bg-blue-50'
            }>
              {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600" />}
              {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {notification.type === 'info' && <Bell className="h-4 w-4 text-blue-600" />}
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm">{notification.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{notification.date}</span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
