import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Newspaper
} from "lucide-react";
import { useMinhasNoticias, useNoticiasMutations } from "@/hooks/useNoticias";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MinhasNoticias = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("todas");

  // Queries
  const { data: todasNoticias, isLoading: isLoadingTodas } = useMinhasNoticias();
  const { data: pendentes, isLoading: isLoadingPendentes } = useMinhasNoticias('pendente');
  const { data: aprovadas, isLoading: isLoadingAprovadas } = useMinhasNoticias('aprovado');
  const { data: rejeitadas, isLoading: isLoadingRejeitadas } = useMinhasNoticias('rejeitado');

  // Mutations
  const { deleteNoticia } = useNoticiasMutations();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteNoticia.mutateAsync(deleteId);
      toast.success('Notícia excluída com sucesso!');
      setDeleteId(null);
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      toast.error('Erro ao excluir notícia. Tente novamente.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovada
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'rejeitado':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return null;
    }
  };

  const NoticiaCard = ({ noticia }: { noticia: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(noticia.status)}
              {noticia.destaque && (
                <Badge variant="outline" className="text-comademig-gold border-comademig-gold">
                  ⭐ Destaque
                </Badge>
              )}
              {noticia.exibir_na_home && (
                <Badge variant="outline" className="text-comademig-blue border-comademig-blue">
                  🏠 Na Home
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg line-clamp-2">{noticia.titulo}</CardTitle>
            <CardDescription className="mt-2">
              {noticia.categoria && (
                <span className="text-sm">📁 {noticia.categoria}</span>
              )}
              {noticia.created_at && (
                <span className="text-sm ml-4">
                  📅 Criada em {format(new Date(noticia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </CardDescription>
          </div>
          {noticia.imagem_url && (
            <img 
              src={noticia.imagem_url} 
              alt={noticia.titulo}
              className="w-24 h-24 object-cover rounded"
            />
          )}
        </div>

        {/* Motivo de Rejeição */}
        {noticia.status === 'rejeitado' && noticia.motivo_rejeicao && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Motivo da Rejeição:</p>
                <p className="text-sm text-red-700 mt-1">{noticia.motivo_rejeicao}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resumo */}
        {noticia.resumo && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{noticia.resumo}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ver no Site (apenas se aprovada) */}
          {noticia.status === 'aprovado' && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/noticias/${noticia.slug}`} target="_blank">
                <Eye className="w-4 h-4 mr-2" />
                Ver no Site
              </Link>
            </Button>
          )}

          {/* Editar - Sempre disponível para o criador */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/minhas-noticias/editar/${noticia.id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>

          {/* Excluir - Sempre disponível para o criador */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteId(noticia.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>

          {/* Visualizações */}
          {noticia.status === 'aprovado' && (
            <div className="ml-auto text-sm text-gray-500">
              👁️ {noticia.visualizacoes || 0} visualizações
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-comademig-blue" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-comademig-blue">Minhas Notícias</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas notícias e acompanhe o status de moderação
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/minhas-noticias/nova')}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Notícia
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Newspaper className="w-5 h-5 text-comademig-blue" />
              <div>
                <p className="text-2xl font-bold text-comademig-blue">
                  {todasNoticias?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendentes?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {aprovadas?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {rejeitadas?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Rejeitadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Notícias */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">
            Todas ({todasNoticias?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({pendentes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="aprovadas">
            Aprovadas ({aprovadas?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rejeitadas">
            Rejeitadas ({rejeitadas?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4 mt-6">
          {isLoadingTodas ? (
            <LoadingState />
          ) : todasNoticias && todasNoticias.length > 0 ? (
            todasNoticias.map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} />
            ))
          ) : (
            <EmptyState message="Você ainda não criou nenhuma notícia. Clique em 'Nova Notícia' para começar!" />
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="space-y-4 mt-6">
          {isLoadingPendentes ? (
            <LoadingState />
          ) : pendentes && pendentes.length > 0 ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">Aguardando Moderação</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Suas notícias estão sendo analisadas pela equipe de moderação. 
                      Você será notificado quando forem aprovadas ou se houver alguma observação.
                    </p>
                  </div>
                </div>
              </div>
              {pendentes.map((noticia) => (
                <NoticiaCard key={noticia.id} noticia={noticia} />
              ))}
            </>
          ) : (
            <EmptyState message="Nenhuma notícia pendente de moderação." />
          )}
        </TabsContent>

        <TabsContent value="aprovadas" className="space-y-4 mt-6">
          {isLoadingAprovadas ? (
            <LoadingState />
          ) : aprovadas && aprovadas.length > 0 ? (
            aprovadas.map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} />
            ))
          ) : (
            <EmptyState message="Nenhuma notícia aprovada ainda." />
          )}
        </TabsContent>

        <TabsContent value="rejeitadas" className="space-y-4 mt-6">
          {isLoadingRejeitadas ? (
            <LoadingState />
          ) : rejeitadas && rejeitadas.length > 0 ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Notícias Rejeitadas</p>
                    <p className="text-sm text-red-700 mt-1">
                      Estas notícias não foram aprovadas pela moderação. 
                      Leia o motivo da rejeição, faça as correções necessárias e envie novamente.
                    </p>
                  </div>
                </div>
              </div>
              {rejeitadas.map((noticia) => (
                <NoticiaCard key={noticia.id} noticia={noticia} />
              ))}
            </>
          ) : (
            <EmptyState message="Nenhuma notícia rejeitada." />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinhasNoticias;
