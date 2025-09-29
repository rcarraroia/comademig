import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Eye, EyeOff, DollarSign, Users } from 'lucide-react';

interface SubscriptionPlanStatsProps {
  stats?: {
    totalPlans: number;
    activePlans: number;
    inactivePlans: number;
    averagePrice: number;
    activeSubscriptions: number;
  };
}

export default function SubscriptionPlanStats({ stats }: SubscriptionPlanStatsProps) {
  if (!stats) {
    return null;
  }

  const { totalPlans, activePlans, inactivePlans, averagePrice, activeSubscriptions } = stats;

  const statsData = [
    {
      title: 'Total de Planos',
      value: totalPlans,
      icon: CreditCard,
      description: 'Planos cadastrados no sistema',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Planos Ativos',
      value: activePlans,
      icon: Eye,
      description: 'Disponíveis para assinatura',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Planos Inativos',
      value: inactivePlans,
      icon: EyeOff,
      description: 'Ocultos dos usuários',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Preço Médio',
      value: averagePrice,
      icon: DollarSign,
      description: 'Valor médio dos planos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      isPrice: true,
    },
    {
      title: 'Assinaturas Ativas',
      value: activeSubscriptions,
      icon: Users,
      description: 'Usuários com assinaturas',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.isPrice ? formatPrice(stat.value) : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
            
            {/* Informações adicionais */}
            {stat.title === 'Total de Planos' && totalPlans > 0 && (
              <div className="mt-2 flex gap-1">
                <Badge variant="outline" className="text-xs">
                  {((activePlans / totalPlans) * 100).toFixed(0)}% ativos
                </Badge>
              </div>
            )}
            
            {stat.title === 'Planos Ativos' && activePlans > 0 && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs">
                  {((activePlans / totalPlans) * 100).toFixed(0)}% do total
                </Badge>
              </div>
            )}

            {stat.title === 'Assinaturas Ativas' && activeSubscriptions > 0 && activePlans > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {(activeSubscriptions / activePlans).toFixed(1)} por plano
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}