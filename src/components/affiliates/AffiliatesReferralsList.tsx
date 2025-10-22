import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, DollarSign } from "lucide-react";
import { useAffiliateReferrals } from "@/hooks/useAffiliate";
import type { Affiliate } from "@/hooks/useAffiliate";

interface AffiliatesReferralsListProps {
  affiliate: Affiliate;
}

export function AffiliatesReferralsList({ affiliate }: AffiliatesReferralsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: referrals = [], isLoading } = useAffiliateReferrals(affiliate.id);

  const filteredReferrals = referrals.filter(referral => {
    if (statusFilter === "all") return true;
    return referral.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Em Aberto', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-800' },
      converted: { label: 'Convertido', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-comademig-blue" />
          <h3 className="text-lg font-semibold">Minhas Indicações</h3>
          <Badge variant="outline">{filteredReferrals.length}</Badge>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Em Aberto</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="converted">Convertidos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Indicações */}
      {filteredReferrals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {statusFilter === "all" 
                ? "Você ainda não tem indicações"
                : "Nenhuma indicação com este status"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map((referral: any) => (
            <Card key={referral.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-comademig-blue/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-comademig-blue" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {referral.referred_user?.nome_completo || 'Usuário'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {referral.referred_user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(referral.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {referral.conversion_value && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(referral.conversion_value)}</span>
                        </div>
                      )}

                      {referral.conversion_date && (
                        <div className="text-xs">
                          Convertido em {new Date(referral.conversion_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
