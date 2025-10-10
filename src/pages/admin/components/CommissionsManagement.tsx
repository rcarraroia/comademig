import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function CommissionsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['admin-commissions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliate:affiliates!affiliate_commissions_affiliate_id_fkey(
            id,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const filteredCommissions = commissions.filter((commission: any) => {
    const searchLower = searchTerm.toLowerCase();
    return commission.affiliate?.display_name?.toLowerCase().includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totals = commissions.reduce(
    (acc, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + c.amount;
      acc.total += c.amount;
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por afiliado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendente</div>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pago</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Cancelado</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.cancelled)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((commission: any) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.affiliate?.display_name || '-'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(commission.amount)}</TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell>{new Date(commission.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      {commission.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: commission.id, status: 'paid' })}
                          >
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: commission.id, status: 'cancelled' })}
                          >
                            <XCircle className="h-4 w-4 mr-1 text-red-600" />
                            Cancelar
                          </Button>
                        </div>
                      )}
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
