
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, ArrowLeft, User } from "lucide-react";

interface Profile {
  id: string;
  nome_completo: string;
  cargo?: string;
  igreja?: string;
}

interface ComposeMessageProps {
  onBack: () => void;
  onSend: (data: { destinatarioId: string; assunto: string; conteudo: string }) => void;
  loading: boolean;
  destinatarioInicial?: string;
  assuntoInicial?: string;
  membros?: Profile[];
}

export const ComposeMessage = ({
  onBack,
  onSend,
  loading,
  destinatarioInicial,
  assuntoInicial,
  membros = []
}: ComposeMessageProps) => {
  const [destinatario, setDestinatario] = useState(destinatarioInicial || '');
  const [assunto, setAssunto] = useState(assuntoInicial || '');
  const [conteudo, setConteudo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destinatario || !assunto || !conteudo) {
      return;
    }
    
    onSend({
      destinatarioId: destinatario,
      assunto,
      conteudo
    });
    
    // Reset form
    setDestinatario(destinatarioInicial || '');
    setAssunto(assuntoInicial || '');
    setConteudo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Nova Mensagem</h2>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compor Mensagem
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destinatario">Destinatário *</Label>
              <Select value={destinatario} onValueChange={setDestinatario}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {membros.map((membro) => (
                    <SelectItem key={membro.id} value={membro.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{membro.nome_completo}</div>
                          {membro.cargo && (
                            <div className="text-sm text-gray-500">{membro.cargo}</div>
                          )}
                          {membro.igreja && (
                            <div className="text-xs text-gray-400">{membro.igreja}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Digite o assunto da mensagem"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conteudo">Mensagem *</Label>
              <Textarea
                id="conteudo"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                rows={8}
                required
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || !destinatario || !assunto || !conteudo}
                className="flex-1"
              >
                {loading ? 'Enviando...' : 'Enviar Mensagem'}
                <Send className="h-4 w-4 ml-2" />
              </Button>
              
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
