
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Send, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  nome_completo: string;
  cargo?: string;
  igreja?: string;
  tipo_membro: string;
  status: string;
}

interface BulkMessageModalProps {
  trigger?: React.ReactNode;
}

export const BulkMessageModal = ({ trigger }: BulkMessageModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'cargo' | 'igreja' | 'status'>('all');
  const [filterValue, setFilterValue] = useState('');

  const { data: profiles, isLoading } = useSupabaseQuery(
    ['profiles-bulk'],
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, cargo, igreja, tipo_membro, status')
        .neq('id', user?.id)
        .order('nome_completo');
      
      if (error) throw error;
      return data as Profile[];
    },
    { enabled: open && !!user }
  );

  const sendBulkMessage = useSupabaseMutation(
    async ({ destinatarios, assunto, conteudo }: {
      destinatarios: string[];
      assunto: string;
      conteudo: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const messages = destinatarios.map(destinatario => ({
        remetente_id: user.id,
        destinatario_id: destinatario,
        assunto,
        conteudo
      }));

      const { data, error } = await supabase
        .from('mensagens')
        .insert(messages)
        .select();
      
      if (error) throw error;
      return data;
    },
    {
      onSuccess: (data) => {
        toast({
          title: 'Mensagens enviadas com sucesso!',
          description: `${data.length} mensagens foram enviadas`,
        });
        setOpen(false);
        setAssunto('');
        setConteudo('');
        setSelectedUsers([]);
      },
      onError: (error) => {
        toast({
          title: 'Erro ao enviar mensagens',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  );

  const filteredProfiles = profiles?.filter(profile => {
    if (filterType === 'all') return true;
    
    const value = filterValue.toLowerCase();
    switch (filterType) {
      case 'cargo':
        return profile.cargo?.toLowerCase().includes(value);
      case 'igreja':
        return profile.igreja?.toLowerCase().includes(value);
      case 'status':
        return profile.status?.toLowerCase().includes(value);
      default:
        return true;
    }
  }) || [];

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredProfiles.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredProfiles.map(p => p.id));
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = () => {
    if (!assunto.trim() || !conteudo.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Assunto e conteúdo são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: 'Nenhum destinatário selecionado',
        description: 'Selecione pelo menos um destinatário',
        variant: 'destructive'
      });
      return;
    }

    sendBulkMessage.mutate({
      destinatarios: selectedUsers,
      assunto,
      conteudo
    });
  };

  const getFilterOptions = () => {
    if (filterType === 'cargo') {
      const cargos = [...new Set(profiles?.map(p => p.cargo).filter(Boolean))];
      return cargos;
    }
    if (filterType === 'igreja') {
      const igrejas = [...new Set(profiles?.map(p => p.igreja).filter(Boolean))];
      return igrejas;
    }
    if (filterType === 'status') {
      return ['ativo', 'pendente', 'suspenso'];
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Mensagem em Massa
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem em Massa</DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto da mensagem"
              />
            </div>

            <div>
              <Label htmlFor="conteudo">Conteúdo *</Label>
              <Textarea
                id="conteudo"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                rows={8}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  {selectedUsers.length} de {filteredProfiles.length} selecionados
                </span>
              </div>
              
              <Button
                onClick={handleSend}
                disabled={sendBulkMessage.isPending || selectedUsers.length === 0}
                className="gap-2"
              >
                {sendBulkMessage.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Mensagens
              </Button>
            </div>
          </div>

          {/* Lista de Destinatários */}
          <div className="flex flex-col overflow-hidden">
            <div className="space-y-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="cargo">Por Cargo</option>
                  <option value="igreja">Por Igreja</option>
                  <option value="status">Por Status</option>
                </select>

                {filterType !== 'all' && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="border rounded px-2 py-1 text-sm flex-1"
                  >
                    <option value="">Selecione...</option>
                    {getFilterOptions().map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.length === filteredProfiles.length && filteredProfiles.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Selecionar todos ({filteredProfiles.length})
                </Label>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.map((profile, index) => (
                    <div key={profile.id}>
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={`user-${profile.id}`}
                          checked={selectedUsers.includes(profile.id)}
                          onCheckedChange={() => handleUserSelect(profile.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{profile.nome_completo}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            {profile.cargo && <Badge variant="outline" className="text-xs">{profile.cargo}</Badge>}
                            {profile.igreja && <span>{profile.igreja}</span>}
                            <Badge 
                              variant={profile.status === 'ativo' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {profile.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {index < filteredProfiles.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
