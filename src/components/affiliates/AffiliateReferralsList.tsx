
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAffiliate, type Referral } from '@/hooks/useAffiliate';
import { formatCurrency } from '@/lib/utils';

export const AffiliateReferralsList = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { getReferrals, loading } = useAffiliate();

  useEffect(() => {
    loadReferrals();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadReferrals, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [referrals, statusFilter, searchTerm]);

  const loadReferrals = async () => {
    const data = await getReferrals();
    setReferrals(data);
  };

  const filterReferrals = () => {
    let filtered = referrals;

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.referred_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referred_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReferrals(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed': return 'default' as const;
      case 'pending': return 'secondary' as const;
      case 'cancelled': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Minhas Indicações
        </CardTitle>
        <CardDescription>
          Lista detalhada de todas as pessoas que você indicou
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Indicações */}
        {filteredReferrals.length > 0 ? (
          <div className="space-y-3">
            {filteredReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{referral.referred_name}</h4>
                    {getStatusIcon(referral.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{referral.referred_email}</p>
                  <p className="text-xs text-muted-foreground">
                    Indicado em {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="text-right space-y-1">
                  <p className="font-medium">{formatCurrency(referral.amount || 0)}</p>
                  <Badge variant={getStatusBadgeVariant(referral.status)}>
                    {getStatusLabel(referral.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma indicação encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece compartilhando seu link de indicação!'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
