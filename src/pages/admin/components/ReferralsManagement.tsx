import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Calendar, DollarSign } from "lucide-react";

export function ReferralsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [affiliateFilter, setAffiliateFilter] = useState<string>("all");

  // Buscar todas as indicações
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['admin-referrals', statusFilter, affiliateFilter],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_referrals')
        .select(`
          *,
          affiliate:affiliates!affiliate_referrals_affiliate_id_fkey(
            id,
            display_name,
            referral_code
          ),
          referred_user:profiles!affiliate_referrals_referred_user_id_fkey(
            id,
            nome_completo
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (affiliateFilter !== 'all') {
        query = query.eq('affiliate_id', affiliateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar lista de afiliados para filtro
  const { data: affiliates = [] } = useQuery({
    queryKey: ['affiliates-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, display_name')
        .eq('status', 'active')
        .order('display_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Filtrar indicações por busca
  const filteredReferrals = referrals.filter((referral: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      referral.affiliate?.display_name?.toLowerCase().includes(searchLower) ||
      referral.referred_user?.nome_completo?.toLowerCase().includes(searchLower) ||
      referral.referral_code?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-800' },
      converted: { label: 'Convertido', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
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
      {/* Filtros e Busca */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por afiliado, indicado ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por afiliado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os afiliados</SelectItem>
            {affiliates.map((affiliate: any) => (
              <SelectItem key={affiliate.id} value={affiliate.id}>
                {affiliate.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="converted">Convertidos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{referrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {referrals.filter((r: any) => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Convertidos</div>
            <div className="text-2xl font-bold text-green-600">
              {referrals.filter((r: any) => r.status === 'converted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
            <div className="text-2xl font-bold text-comademig-blue">
              {referrals.length > 0
                ? `${((referrals.filter((r: any) => r.status === 'converted').length / referrals.length) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Indicações */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead>Indicado</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data da Indicação</TableHead>
                <TableHead>Data de Conversão</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma indicação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((referral: any) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      {referral.affiliate?.display_name || '-'}
                    </TableCell>
                    <TableCell>
                      {referral.referred_user?.nome_completo || 'Usuário'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {referral.referral_code}
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {referral.conversion_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(referral.conversion_date).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {referral.conversion_value && <DollarSign className="h-3 w-3" />}
                        {formatCurrency(referral.conversion_value)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
