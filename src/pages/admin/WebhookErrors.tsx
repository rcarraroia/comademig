import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebhookErrors } from "@/hooks/useWebhookErrors";
import { AlertCircle, RefreshCw, CheckCircle, Eye, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WebhookErrors() {
  const { errors, resolvedErrors, isLoading, retryWebhook, isRetrying, markAsResolved } =
    useWebhookErrors();
  const [selectedError, setSelectedError] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (error: any) => {
    setSelectedError(error);
    setShowDetails(true);
  };

  const handleRetry = (errorId: string) => {
    if (confirm("Deseja reprocessar este webhook? Isso criará a solicitação de serviço.")) {
      retryWebhook(errorId);
    }
  };

  const handleMarkResolved = (errorId: string) => {
    if (confirm("Marcar este erro como resolvido manualmente?")) {
      markAsResolved(errorId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando erros de webhook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Erros de Webhook</h1>
          <p className="text-gray-600 mt-1">
            Gerencie webhooks que falharam no processamento
          </p>
        </div>
        {errors && errors.length > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errors.length} erro{errors.length !== 1 ? "s" : ""} pendente
            {errors.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({errors?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidos ({resolvedErrors?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {!errors || errors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum erro pendente
                </h3>
                <p className="text-gray-600">
                  Todos os webhooks foram processados com sucesso!
                </p>
              </CardContent>
            </Card>
          ) : (
            errors.map((error) => (
              <Card key={error.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Payment ID: {error.payment_id}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(error.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {error.retry_count} tentativa{error.retry_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Erro:</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {error.error_message}
                    </p>
                  </div>

                  {error.last_retry_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Última tentativa:{" "}
                      {new Date(error.last_retry_at).toLocaleString("pt-BR")}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRetry(error.id)}
                      disabled={isRetrying}
                      className="flex-1"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
                      />
                      Reprocessar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(error)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleMarkResolved(error.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Resolvido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {!resolvedErrors || resolvedErrors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-600">Nenhum erro resolvido ainda</p>
              </CardContent>
            </Card>
          ) : (
            resolvedErrors.map((error) => (
              <Card key={error.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Payment ID: {error.payment_id}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Resolvido em:{" "}
                        {error.resolved_at
                          ? new Date(error.resolved_at).toLocaleString("pt-BR")
                          : "N/A"}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {error.retry_count} tentativa{error.retry_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(error)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Erro</DialogTitle>
            <DialogDescription>
              Informações completas sobre o erro de webhook
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment ID:</h4>
                  <p className="text-sm bg-gray-100 p-2 rounded font-mono">
                    {selectedError.payment_id}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Mensagem de Erro:</h4>
                  <p className="text-sm bg-red-50 text-red-600 p-3 rounded">
                    {selectedError.error_message}
                  </p>
                </div>

                {selectedError.error_stack && (
                  <div>
                    <h4 className="font-semibold mb-2">Stack Trace:</h4>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      {selectedError.error_stack}
                    </pre>
                  </div>
                )}

                {selectedError.payload && (
                  <div>
                    <h4 className="font-semibold mb-2">Payload:</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedError.payload, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Tentativas:</h4>
                    <p className="text-sm">{selectedError.retry_count}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Status:</h4>
                    <Badge
                      variant={selectedError.resolved ? "default" : "destructive"}
                    >
                      {selectedError.resolved ? "Resolvido" : "Pendente"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Criado em:</h4>
                    <p className="text-sm">
                      {new Date(selectedError.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {selectedError.last_retry_at && (
                    <div>
                      <h4 className="font-semibold mb-1">Última tentativa:</h4>
                      <p className="text-sm">
                        {new Date(selectedError.last_retry_at).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
