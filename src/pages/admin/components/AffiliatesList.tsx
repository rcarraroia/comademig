import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, CheckCircle, XCircle, Ban, Eye } from "lucide-react";
import { toast } from "sonner";

export function AffiliatesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Buscar todos os afiliados
  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ['admin-affiliates', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('affiliates')
        .select(`
          *,
          user:profiles!affiliates_user_id_fkey(
            id,
            nome_completo,
            email
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

  // Mutation para atualizar status do afiliado
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('affiliates')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  // Filtrar afiliados por busca
  const filteredAffiliates = affiliates.filter((affiliate: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      affiliate.display_name?.toLowerCase().includes(searchLower) ||
      affiliate.user?.nome_completo?.toLowerCase().includes(searchLower) ||
      affiliate.user?.email?.toLowerCase().includes(searchLower) ||
      affiliate.cpf_cnpj?.includes(searchTerm)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      suspended: { label: 'Suspenso', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'active' });
  };

  const handleSuspend = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'suspended' });
  };

  const handleReactivate = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'active' });
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
            placeholder="Buscar por nome, email ou CPF/CNPJ..."
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
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="suspended">Suspensos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{affiliates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {affiliates.filter((a: any) => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Ativos</div>
            <div className="text-2xl font-bold text-green-600">
              {affiliates.filter((a: any) => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Suspensos</div>
            <div className="text-2xl font-bold text-red-600">
              {affiliates.filter((a: any) => a.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Afiliados */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum afiliado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredAffiliates.map((affiliate: any) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">
                      {affiliate.display_name || affiliate.user?.nome_completo}
                    </TableCell>
                    <TableCell>{affiliate.user?.email || affiliate.contact_email}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {affiliate.cpf_cnpj || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {affiliate.referral_code}
                    </TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell>
                      {new Date(affiliate.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {affiliate.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleApprove(affiliate.id)}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Aprovar
                            </DropdownMenuItem>
                          )}
                          {affiliate.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleSuspend(affiliate.id)}>
                              <Ban className="h-4 w-4 mr-2 text-red-600" />
                              Suspender
                            </DropdownMenuItem>
                          )}
                          {affiliate.status === 'suspended' && (
                            <DropdownMenuItem onClick={() => handleReactivate(affiliate.id)}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
