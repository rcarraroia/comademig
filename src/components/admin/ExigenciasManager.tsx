import { useState } from 'react';
import { useServicoExigencias } from '@/hooks/useServicoExigencias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import type { ServicoExigencia } from '@/hooks/useServicoExigencias';

interface ExigenciasManagerProps {
  servicoId: string;
}

export function ExigenciasManager({ servicoId }: ExigenciasManagerProps) {
  const {
    exigencias,
    isLoading,
    adicionarExigencia,
    atualizarExigencia,
    removerExigencia,
    isAdicionando,
    isRemovendo,
  } = useServicoExigencias(servicoId);

  const [novaExigencia, setNovaExigencia] = useState({
    tipo: 'campo_texto' as const,
    nome: '',
    descricao: '',
    obrigatorio: true,
    opcoes: [] as string[],
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleAdicionarExigencia = async () => {
    if (!novaExigencia.nome) return;

    await adicionarExigencia({
      servico_id: servicoId,
      tipo: novaExigencia.tipo,
      nome: novaExigencia.nome,
      descricao: novaExigencia.descricao,
      obrigatorio: novaExigencia.obrigatorio,
      opcoes: novaExigencia.opcoes.length > 0 ? novaExigencia.opcoes : undefined,
      ordem: exigencias.length,
    });

    // Resetar formulário
    setNovaExigencia({
      tipo: 'campo_texto',
      nome: '',
      descricao: '',
      obrigatorio: true,
      opcoes: [],
    });
    setMostrarFormulario(false);
  };

  const handleRemoverExigencia = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta exigência?')) {
      await removerExigencia(id);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      documento: '📎 Documento',
      campo_texto: '📝 Texto',
      campo_numero: '🔢 Número',
      campo_data: '📅 Data',
      selecao: '📋 Seleção',
      checkbox: '☑️ Checkbox',
    };
    return labels[tipo] || tipo;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Exigências */}
      <div className="space-y-3">
        {exigencias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma exigência cadastrada</p>
            <p className="text-sm mt-1">
              Adicione campos que o usuário deve preencher ao solicitar este serviço
            </p>
          </div>
        ) : (
          exigencias.map((exigencia) => (
            <Card key={exigencia.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{exigencia.nome}</p>
                        {exigencia.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {exigencia.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            {getTipoLabel(exigencia.tipo)}
                          </span>
                          {exigencia.obrigatorio && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        {exigencia.opcoes && exigencia.opcoes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Opções:</p>
                            <p className="text-sm">{exigencia.opcoes.join(', ')}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverExigencia(exigencia.id)}
                        disabled={isRemovendo}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Formulário de Nova Exigência */}
      {mostrarFormulario ? (
        <Card className="border-primary">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Campo *</Label>
              <Select
                value={novaExigencia.tipo}
                onValueChange={(value: any) => setNovaExigencia({ ...novaExigencia, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campo_texto">📝 Campo de Texto</SelectItem>
                  <SelectItem value="campo_numero">🔢 Campo Numérico</SelectItem>
                  <SelectItem value="campo_data">📅 Campo de Data</SelectItem>
                  <SelectItem value="selecao">📋 Seleção (Dropdown)</SelectItem>
                  <SelectItem value="checkbox">☑️ Checkbox</SelectItem>
                  <SelectItem value="documento">📎 Upload de Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Campo *</Label>
              <Input
                value={novaExigencia.nome}
                onChange={(e) => setNovaExigencia({ ...novaExigencia, nome: e.target.value })}
                placeholder="Ex: CPF, RG, Comprovante de Residência"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={novaExigencia.descricao}
                onChange={(e) => setNovaExigencia({ ...novaExigencia, descricao: e.target.value })}
                placeholder="Instruções adicionais para o usuário"
                rows={2}
              />
            </div>

            {(novaExigencia.tipo as string) === 'selecao' && (
              <div className="space-y-2">
                <Label>Opções (separadas por vírgula)</Label>
                <Input
                  placeholder="Opção 1, Opção 2, Opção 3"
                  onChange={(e) => {
                    const opcoes = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                    setNovaExigencia({ ...novaExigencia, opcoes });
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>Campo obrigatório</Label>
              <Switch
                checked={novaExigencia.obrigatorio}
                onCheckedChange={(checked) => setNovaExigencia({ ...novaExigencia, obrigatorio: checked })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMostrarFormulario(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAdicionarExigencia}
                disabled={!novaExigencia.nome || isAdicionando}
                className="flex-1"
              >
                {isAdicionando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setMostrarFormulario(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Exigência
        </Button>
      )}
    </div>
  );
}
