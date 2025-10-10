import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useAffiliateCommissions } from "@/hooks/useAffiliate";
import type { Affiliate } from "@/hooks/useAffiliate";

interface AffiliatesCommissionsListProps {
  affiliate: Affiliate;
}

export function AffiliatesCommissionsList({ affiliate }: AffiliatesCommissionsListProps) {
  const { data: commissions = [], isLoading } = useAffiliateCommissions(affiliate.id);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular totais por status
  const totals = commissions.reduce(
    (acc, commission: any) => {
      acc[commission.status] = (acc[commission.status] || 0) + commission.amount;
      acc.total += commission.amount;
      return acc;
    },
    { pending: 0, paid: 0, cancelled: 0, total: 0 } as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-comademig-blue">
                  {formatCurrency(totals.total)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-comademig-blue opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(totals.pending)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pago</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totals.paid)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelado</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totals.cancelled)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Comissões */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-comademig-blue" />
          Histórico de Comissões
          <Badge variant="outline">{commissions.length}</Badge>
        </h3>

        {commissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Você ainda não possui comissões
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {commissions.map((commission: any) => (
              <Card key={commission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-comademig-gold/10 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-comademig-gold" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {formatCurrency(commission.amount)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(commission.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(commission.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
