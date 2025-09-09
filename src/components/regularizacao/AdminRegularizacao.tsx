import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Eye, FileText, DollarSign } from "lucide-react";

interface RegularizacaoRequest {
  id: string;
  user_id: string;
  tipo_cobranca: string;
  status: string;
  valor: number;
  asaas_id: string;
  data_pagamento: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function AdminRegularizacao() {
  const [selectedRequest, setSelectedRequest] = useState<RegularizacaoRequest | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const queryClient = useQueryClient();

  // Query para buscar solicitações de regularização
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-regularizacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asaas_cobrancas')
        .select(`
          id,
          user_id,
          tipo_cobranca,
          status,
          valor,
          asaas_id,
          data_pagamento,
          created_at
        `)
        .eq('tipo_cobranca', 'regularizacao')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários separadamente
      const userIds = data.map(item => item.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Erro ao buscar profiles:', profilesError);
      }

      return data.map(item => {
        const profile = profiles?.find(p => p.id === item.user_id) || {
          full_name: 'Usuário não encontrado',
          email: 'N/A',
          phone: 'N/A'
        };

        return {
          id: item.id,
          user_id: item.user_id,
          tipo_cobranca: item.tipo_cobranca,
          status: item.status,
          valor: item.valor,
          asaas_id: item.asaas_id,
          data_pagamento: item.data_pagamento,
          created_at: item.created_at,
          profiles: profile
        };
      }) as RegularizacaoRequest[];
    }
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('asaas_cobrancas')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-regularizacao'] });
      toast.success("Status atualizado com sucesso!");
      setSelectedRequest(null);
      setNovoStatus("");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      'processing': { label: 'Processando', variant: 'default' as const, icon: Clock },
      'approved': { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      'rejected': { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      'completed': { label: 'Concluído', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (dataPagamento: string | null) => {
    const isPaid = !!dataPagamento;
    
    return (
      <Badge variant={isPaid ? 'default' : 'secondary'} className="flex items-center gap-1">
        <DollarSign className="w-3 h-3" />
        {isPaid ? 'Pago' : 'Pendente'}
      </Badge>
    );
  };

  const handleUpdateStatus = () => {
    if (!selectedRequest || !novoStatus) return;

    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: novoStatus
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => !r.data_pagamento) || [];
  const processingRequests = requests?.filter(r => r.data_pagamento && r.status === 'pending') || [];
  const completedRequests = requests?.filter(r => r.data_pagamento && r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Administração - Regularização</h2>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Pendentes: {pendingRequests.length}</span>
          <span>Processando: {processingRequests.length}</span>
          <span>Finalizadas: {completedRequests.length}</span>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pendentes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processando ({processingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Finalizadas ({completedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onSelect={setSelectedRequest}
              getStatusBadge={getStatusBadge}
              getPaymentStatusBadge={getPaymentStatusBadge}
            />
          ))}
          {pendingRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma solicitação pendente
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingRequests.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onSelect={setSelectedRequest}
              getStatusBadge={getStatusBadge}
              getPaymentStatusBadge={getPaymentStatusBadge}
            />
          ))}
          {processingRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma solicitação em processamento
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onSelect={setSelectedRequest}
              getStatusBadge={getStatusBadge}
              getPaymentStatusBadge={getPaymentStatusBadge}
            />
          ))}
          {completedRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma solicitação finalizada
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes e Ações */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação de Regularização</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Informações do Usuário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Solicitante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Nome:</strong> {selectedRequest.profiles.full_name}</div>
                  <div><strong>Email:</strong> {selectedRequest.profiles.email}</div>
                  <div><strong>Telefone:</strong> {selectedRequest.profiles.phone}</div>
                </CardContent>
              </Card>

              {/* Detalhes da Regularização */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes da Regularização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Tipo:</strong> {selectedRequest.tipo_cobranca}</div>
                  <div><strong>Valor:</strong> R$ {selectedRequest.valor.toFixed(2)}</div>
                  <div><strong>Data da Solicitação:</strong> {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</div>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Pagamento:</strong> {getPaymentStatusBadge(selectedRequest.data_pagamento)}
                  </div>
                  {selectedRequest.data_pagamento && (
                    <div><strong>Data do Pagamento:</strong> {new Date(selectedRequest.data_pagamento).toLocaleString('pt-BR')}</div>
                  )}
                  <div><strong>ID Asaas:</strong> {selectedRequest.asaas_id}</div>
                </CardContent>
              </Card>

              {/* Ações Administrativas */}
              {selectedRequest.data_pagamento && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Administrativas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="status">Novo Status</Label>
                      <Select value={novoStatus} onValueChange={setNovoStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>



                    <Button 
                      onClick={handleUpdateStatus}
                      disabled={!novoStatus || updateStatusMutation.isPending}
                      className="w-full"
                    >
                      {updateStatusMutation.isPending ? "Atualizando..." : "Atualizar Status"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!selectedRequest.data_pagamento && (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-2" />
                    <p>Aguardando confirmação de pagamento para liberar ações administrativas</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente auxiliar para o card de solicitação
function RequestCard({ 
  request, 
  onSelect, 
  getStatusBadge, 
  getPaymentStatusBadge 
}: {
  request: RegularizacaoRequest;
  onSelect: (request: RegularizacaoRequest) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPaymentStatusBadge: (status: string) => JSX.Element;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{request.profiles.full_name}</h3>
              {getStatusBadge(request.status)}
              {getPaymentStatusBadge(request.data_pagamento)}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Tipo: {request.tipo_cobranca}</div>
              <div>Valor: R$ {request.valor.toFixed(2)}</div>
              <div>Data: {new Date(request.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(request)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}