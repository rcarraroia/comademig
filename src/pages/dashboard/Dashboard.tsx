
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-comademig-blue to-comademig-gold text-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo, Pastor João Silva!</h1>
        <p className="text-blue-100 text-lg">
          Igreja Assembleia de Deus - Campo Regional de Belo Horizonte
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold text-comademig-blue mb-6">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-full ${action.color} text-white`}>
                      <action.icon size={28} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-comademig-blue text-lg">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Situação Financeira</CardTitle>
            <DollarSign className="h-5 w-5 text-comademig-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Em Dia</div>
            <p className="text-xs text-gray-500 mt-2">Última contribuição: Janeiro/2024</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Próximos Eventos</CardTitle>
            <Calendar className="h-5 w-5 text-comademig-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-comademig-blue">3</div>
            <p className="text-xs text-gray-500 mt-2">Eventos disponíveis para inscrição</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Carteira Digital</CardTitle>
            <CreditCard className="h-5 w-5 text-comademig-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Ativa</div>
            <p className="text-xs text-gray-500 mt-2">Válida até: Dezembro/2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div>
        <h2 className="text-2xl font-semibold text-comademig-blue mb-6">Notificações Recentes</h2>
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <Alert key={index} className={`border-0 shadow-md ${
              notification.type === 'warning' ? 'bg-orange-50 border-l-4 border-l-orange-400' :
              notification.type === 'success' ? 'bg-green-50 border-l-4 border-l-green-400' :
              'bg-blue-50 border-l-4 border-l-blue-400'
            }`}>
              {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600" />}
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {notification.type === 'info' && <Bell className="h-5 w-5 text-blue-600" />}
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{notification.title}</h4>
                    <p className="text-sm mt-1">{notification.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{notification.date}</span>
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
