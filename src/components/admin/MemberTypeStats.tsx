import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, EyeOff, TrendingUp } from 'lucide-react';
import type { MemberType } from '@/hooks/useMemberTypes';

interface MemberTypeStatsProps {
  memberTypes?: MemberType[];
}

export default function MemberTypeStats({ memberTypes = [] }: MemberTypeStatsProps) {
  const totalTypes = memberTypes.length;
  const activeTypes = memberTypes.filter(type => type.is_active).length;
  const inactiveTypes = totalTypes - activeTypes;
  
  // Calcular estatísticas adicionais
  const typesWithDescription = memberTypes.filter(type => type.description && type.description.trim().length > 0).length;
  const averageOrder = memberTypes.length > 0 
    ? Math.round(memberTypes.reduce((sum, type) => sum + (type.order_of_exhibition || 0), 0) / memberTypes.length)
    : 0;

  const stats = [
    {
      title: 'Total de Tipos',
      value: totalTypes,
      icon: Users,
      description: 'Tipos cadastrados no sistema',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Tipos Ativos',
      value: activeTypes,
      icon: Eye,
      description: 'Visíveis para usuários',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Tipos Inativos',
      value: inactiveTypes,
      icon: EyeOff,
      description: 'Ocultos dos usuários',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Com Descrição',
      value: typesWithDescription,
      icon: TrendingUp,
      description: 'Tipos com descrição preenchida',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
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
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
            
            {/* Informações adicionais */}
            {stat.title === 'Total de Tipos' && totalTypes > 0 && (
              <div className="mt-2 flex gap-1">
                <Badge variant="outline" className="text-xs">
                  Ordem média: {averageOrder}
                </Badge>
              </div>
            )}
            
            {stat.title === 'Tipos Ativos' && activeTypes > 0 && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs">
                  {((activeTypes / totalTypes) * 100).toFixed(0)}% do total
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}