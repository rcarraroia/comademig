
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Download, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

const Certidoes = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const certidaoTypes = [
    { value: "ministerio", label: "Certidão de Ministério" },
    { value: "vinculo", label: "Certidão de Vínculo" },
    { value: "atuacao", label: "Certidão de Atuação" },
    { value: "historico", label: "Histórico Ministerial" },
    { value: "ordenacao", label: "Certidão de Ordenação" }
  ];

  const requests = [
    {
      id: "CERT-001",
      type: "Certidão de Ministério",
      requestDate: "2024-01-15",
      status: "Aprovada",
      deliveryDate: "2024-01-18",
      observations: "Solicitação para novo campo ministerial"
    },
    {
      id: "CERT-002",
      type: "Certidão de Vínculo",
      requestDate: "2024-01-10",
      status: "Em Análise",
      deliveryDate: "-",
      observations: "Documentação para transferência"
    },
    {
      id: "CERT-003",
      type: "Histórico Ministerial",
      requestDate: "2023-12-20",
      status: "Entregue",
      deliveryDate: "2023-12-22",
      observations: "Histórico completo desde ordenação"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprovada":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Aprovada</Badge>;
      case "Em Análise":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Em Análise</Badge>;
      case "Entregue":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle size={12} className="mr-1" />Entregue</Badge>;
      case "Rejeitada":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle size={12} className="mr-1" />Rejeitada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleSubmit = () => {
    // Simulação de envio
    console.log("Solicitação enviada:", { selectedType, justificativa });
    setShowForm(false);
    setSelectedType("");
    setJustificativa("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Certidões</h1>
          <p className="text-gray-600">Solicite documentos oficiais da COMADEMIG</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-comademig-gold hover:bg-comademig-gold/90"
        >
          <Plus size={16} className="mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* Request Form */}
      {showForm && (
        <Card className="border-comademig-gold">
          <CardHeader>
            <CardTitle className="text-comademig-gold">Nova Solicitação de Certidão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo de Certidão</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de certidão" />
                </SelectTrigger>
                <SelectContent>
                  {certidaoTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="justificativa">Justificativa/Observações</Label>
              <Textarea
                id="justificativa"
                placeholder="Descreva o motivo da solicitação e outras observações relevantes..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleSubmit}
                disabled={!selectedType}
                className="bg-comademig-blue hover:bg-comademig-blue/90"
              >
                Enviar Solicitação
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Desde 2023</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">1</div>
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">6</div>
            <p className="text-xs text-muted-foreground">Prontas para download</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <Download className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <p className="text-xs text-muted-foreground">Já baixadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Certifications Info */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Certidões Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certidaoTypes.map((type) => (
              <div key={type.value} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-comademig-blue mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-comademig-blue">{type.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {type.value === 'ministerio' && 'Documento que comprova seu ministério na COMADEMIG'}
                      {type.value === 'vinculo' && 'Certifica seu vínculo com uma igreja local'}
                      {type.value === 'atuacao' && 'Comprova sua atuação ministerial em campo específico'}
                      {type.value === 'historico' && 'Histórico completo de sua trajetória ministerial'}
                      {type.value === 'ordenacao' && 'Certifica sua ordenação ministerial'}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Prazo: 3-5 dias úteis
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Solicitação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>
                    {new Date(request.requestDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.deliveryDate !== "-" 
                      ? new Date(request.deliveryDate).toLocaleDateString('pt-BR')
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    {request.status === "Aprovada" || request.status === "Entregue" ? (
                      <Button size="sm" className="bg-comademig-blue hover:bg-comademig-blue/90">
                        <Download size={16} className="mr-1" />
                        Baixar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Aguardando
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800">Informações Importantes</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• As certidões são processadas em até 5 dias úteis</p>
                <p>• Mantenha seus dados sempre atualizados para agilizar o processo</p>
                <p>• Certidões têm validade de 90 dias para fins externos</p>
                <p>• Em caso de urgência, entre em contato com o suporte</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Certidoes;
