import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Play,
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useVideos, useAlbuns, useMultimidiaMutations, type VideoData, type AlbumData } from "@/hooks/useMultimidia";
import { SimpleImageUpload } from "@/components/ui/SimpleImageUpload";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { compressImage, validateImageFile } from "@/utils/imageCompression";

const MultimidiaContentEdit = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("videos");
  
  // Videos
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  
  // Albums
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumData | null>(null);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);

  const { data: videos, isLoading: isLoadingVideos } = useVideos({ ativo: undefined, limit: 100 });
  const { data: albuns, isLoading: isLoadingAlbuns } = useAlbuns({ ativo: undefined, limit: 100 });
  
  const { createVideo, updateVideo, deleteVideo, createAlbum, updateAlbum, deleteAlbum } = useMultimidiaMutations();

  const { register: registerVideo, handleSubmit: handleSubmitVideo, reset: resetVideo, setValue: setValueVideo, watch: watchVideo } = useForm<Partial<VideoData>>();
  const { register: registerAlbum, handleSubmit: handleSubmitAlbum, reset: resetAlbum, setValue: setValueAlbum, watch: watchAlbum } = useForm<Partial<AlbumData>>();
  const [albumFotos, setAlbumFotos] = useState<Array<{ url: string; legenda: string; ordem: number }>>([]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Video handlers
  const handleOpenVideoDialog = (video?: VideoData) => {
    if (video) {
      setEditingVideo(video);
      Object.keys(video).forEach((key) => {
        setValueVideo(key as keyof VideoData, video[key as keyof VideoData]);
      });
    } else {
      setEditingVideo(null);
      resetVideo({
        titulo: '',
        descricao: '',
        url_youtube: '',
        duracao: '',
        categoria: 'geral',
        thumbnail_url: '',
        destaque: false,
        ativo: true,
      });
    }
    setIsVideoDialogOpen(true);
  };

  const handleCloseVideoDialog = () => {
    setIsVideoDialogOpen(false);
    setEditingVideo(null);
    resetVideo();
  };

  const onSubmitVideo = async (data: Partial<VideoData>) => {
    try {
      if (editingVideo) {
        await updateVideo.mutateAsync({ ...data, id: editingVideo.id });
        toast.success('Vídeo atualizado com sucesso!');
      } else {
        await createVideo.mutateAsync(data);
        toast.success('Vídeo criado com sucesso!');
      }
      handleCloseVideoDialog();
    } catch (error) {
      toast.error('Erro ao salvar vídeo. Tente novamente.');
      console.error(error);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    try {
      await deleteVideo.mutateAsync(deleteVideoId);
      toast.success('Vídeo excluído com sucesso!');
      setDeleteVideoId(null);
    } catch (error) {
      toast.error('Erro ao excluir vídeo.');
      console.error(error);
    }
  };

  // Album handlers
  const handleOpenAlbumDialog = (album?: AlbumData) => {
    if (album) {
      setEditingAlbum(album);
      Object.keys(album).forEach((key) => {
        setValueAlbum(key as keyof AlbumData, album[key as keyof AlbumData]);
      });
    } else {
      setEditingAlbum(null);
      setAlbumFotos([]);
      resetAlbum({
        titulo: '',
        descricao: '',
        categoria: 'eventos',
        data_evento: '',
        capa_url: '',
        ativo: true,
      });
    }
    setIsAlbumDialogOpen(true);
  };

  const handleCloseAlbumDialog = () => {
    setIsAlbumDialogOpen(false);
    setEditingAlbum(null);
    setAlbumFotos([]);
    resetAlbum();
  };

  const onSubmitAlbum = async (data: Partial<AlbumData>) => {
    try {
      if (editingAlbum) {
        await updateAlbum.mutateAsync({ ...data, id: editingAlbum.id });
        toast.success('Álbum atualizado com sucesso!');
      } else {
        // VALIDAÇÃO: Verificar se tem pelo menos 1 foto
        if (albumFotos.length === 0) {
          toast.error('⚠️ Adicione pelo menos 1 foto ao álbum antes de criar!');
          return;
        }

        // Validar campos obrigatórios
        if (!data.titulo || !data.categoria || !data.capa_url) {
          toast.error('⚠️ Preencha todos os campos obrigatórios!');
          return;
        }

        console.log('📸 Criando álbum com dados:', data);
        console.log('📸 Fotos a adicionar:', albumFotos.length);

        // Criar álbum
        const { data: novoAlbum, error: albumError } = await supabase
          .from('albuns_fotos')
          .insert([{ ...data, autor_id: user?.id }])
          .select()
          .single();

        if (albumError) {
          console.error('❌ Erro ao criar álbum:', albumError);
          throw albumError;
        }
        
        console.log('✅ Álbum criado:', novoAlbum);
        
        // Adicionar fotos
        if (albumFotos.length > 0 && novoAlbum) {
          const fotosParaInserir = albumFotos.map(foto => ({
            album_id: novoAlbum.id,
            url: foto.url,
            legenda: foto.legenda,
            ordem: foto.ordem,
          }));

          const { error: fotosError } = await supabase
            .from('fotos')
            .insert(fotosParaInserir);

          if (fotosError) {
            console.error('❌ Erro ao adicionar fotos:', fotosError);
            throw fotosError;
          }
          
          console.log('✅ Fotos adicionadas com sucesso');
          toast.success(`✅ Álbum criado com ${albumFotos.length} foto(s)!`);
        }
        
        // Invalidar queries para atualizar a lista
        console.log('🔄 Invalidando queries...');
        queryClient.invalidateQueries({ queryKey: ['albuns'] });
        queryClient.invalidateQueries({ queryKey: ['albuns_fotos'] });
      }
      handleCloseAlbumDialog();
    } catch (error) {
      toast.error('Erro ao salvar álbum. Tente novamente.');
      console.error(error);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumId) return;
    try {
      await deleteAlbum.mutateAsync(deleteAlbumId);
      toast.success('Álbum excluído com sucesso!');
      setDeleteAlbumId(null);
    } catch (error) {
      toast.error('Erro ao excluir álbum.');
      console.error(error);
    }
  };

  const videosFiltrados = videos?.filter(video => 
    busca === "" || video.titulo.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const albunsFiltrados = albuns?.filter(album => 
    busca === "" || album.titulo.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/dashboard/admin/content">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Gerenciamento de Conteúdo
          </Link>
        </Button>
        
        <h1 className="text-3xl font-montserrat font-bold text-comademig-blue mb-2">
          Editor de Multimídia
        </h1>
        <p className="text-gray-600 font-inter">
          Gerencie vídeos e álbuns de fotos do site
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger value="albuns" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Álbuns de Fotos
          </TabsTrigger>
        </TabsList>

        {/* TAB: VÍDEOS */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vídeos</CardTitle>
                  <CardDescription>
                    Gerencie os vídeos do YouTube exibidos no site
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenVideoDialog()} className="bg-comademig-blue">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Vídeo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar vídeos..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoadingVideos ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-comademig-blue" />
                </div>
              ) : videosFiltrados.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Visualizações</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videosFiltrados.map((video) => (
                        <TableRow key={video.id}>
                          <TableCell className="font-medium">{video.titulo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{video.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {video.visualizacoes}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {video.destaque && <Badge className="bg-yellow-500">Destaque</Badge>}
                              <Badge variant={video.ativo ? "default" : "secondary"}>
                                {video.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenVideoDialog(video)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteVideoId(video.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum vídeo encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ÁLBUNS */}
        <TabsContent value="albuns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Álbuns de Fotos</CardTitle>
                  <CardDescription>
                    Gerencie os álbuns de fotos exibidos no site
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenAlbumDialog()} className="bg-comademig-blue">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Álbum
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar álbuns..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoadingAlbuns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-comademig-blue" />
                </div>
              ) : albunsFiltrados.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data do Evento</TableHead>
                        <TableHead>Fotos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {albunsFiltrados.map((album) => (
                        <TableRow key={album.id}>
                          <TableCell className="font-medium">{album.titulo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{album.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            {album.data_evento 
                              ? format(new Date(album.data_evento), "dd/MM/yyyy", { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              {album.fotos_count || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={album.ativo ? "default" : "secondary"}>
                              {album.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                title="Ver álbum no site"
                              >
                                <Link to={`/multimidia/album/${album.id}`} target="_blank">
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                title="Gerenciar fotos"
                                className="text-blue-600"
                              >
                                <Link to={`/dashboard/admin/content/album/${album.id}/fotos`}>
                                  <ImageIcon className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAlbumDialog(album)}
                                title="Editar álbum"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteAlbumId(album.id)}
                                title="Excluir álbum"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum álbum encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Vídeo */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do vídeo do YouTube
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitVideo(onSubmitVideo)} className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...registerVideo('titulo', { required: true })}
                placeholder="Ex: Congresso Estadual 2024"
              />
            </div>

            <div>
              <Label htmlFor="url_youtube">URL do YouTube *</Label>
              <Input
                id="url_youtube"
                {...registerVideo('url_youtube', { required: true })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole a URL completa do vídeo ou apenas o ID
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duracao">Duração</Label>
                <Input
                  id="duracao"
                  {...registerVideo('duracao')}
                  placeholder="Ex: 1h 30min"
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={watchVideo('categoria')}
                  onValueChange={(value) => setValueVideo('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="cultos">Cultos</SelectItem>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="pregacoes">Pregações</SelectItem>
                    <SelectItem value="testemunhos">Testemunhos</SelectItem>
                    <SelectItem value="louvor">Louvor</SelectItem>
                    <SelectItem value="encontros">Encontros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...registerVideo('descricao')}
                placeholder="Descrição do vídeo..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="thumbnail_url">URL da Thumbnail (opcional)</Label>
              <SimpleImageUpload
                onImageChange={(url) => setValueVideo('thumbnail_url', url || '')}
                compressionType="thumbnail"
                maxSizeMB={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Se não informado, será usado o thumbnail padrão do YouTube
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="destaque"
                checked={watchVideo('destaque')}
                onCheckedChange={(checked) => setValueVideo('destaque', checked)}
              />
              <Label htmlFor="destaque" className="cursor-pointer">
                ⭐ Marcar como destaque
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={watchVideo('ativo')}
                onCheckedChange={(checked) => setValueVideo('ativo', checked)}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                ✅ Vídeo ativo (visível no site)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseVideoDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-comademig-blue"
                disabled={createVideo.isPending || updateVideo.isPending}
              >
                {(createVideo.isPending || updateVideo.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingVideo ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Álbum */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlbum ? 'Editar Álbum' : 'Novo Álbum'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do álbum de fotos
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAlbum(onSubmitAlbum)} className="space-y-4">
            <div>
              <Label htmlFor="album_titulo">Título *</Label>
              <Input
                id="album_titulo"
                {...registerAlbum('titulo', { required: true })}
                placeholder="Ex: Congresso Estadual 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="album_categoria">Categoria *</Label>
                <Select
                  value={watchAlbum('categoria')}
                  onValueChange={(value) => setValueAlbum('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="cultos">Cultos</SelectItem>
                    <SelectItem value="encontros">Encontros</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_evento">Data do Evento</Label>
                <Input
                  id="data_evento"
                  type="date"
                  {...registerAlbum('data_evento')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="album_descricao">Descrição</Label>
              <Textarea
                id="album_descricao"
                {...registerAlbum('descricao')}
                placeholder="Descrição do álbum..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="capa_url">Foto de Capa *</Label>
              <SimpleImageUpload
                onImageChange={(url) => setValueAlbum('capa_url', url || '')}
                compressionType="cover"
                maxSizeMB={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta será a imagem principal do álbum (será comprimida automaticamente)
              </p>
            </div>

            {!editingAlbum && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Fotos do Álbum *</Label>
                  <span className={`text-sm font-medium ${albumFotos.length === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {albumFotos.length} foto(s) adicionada(s)
                    {albumFotos.length === 0 && ' - Mínimo: 1 foto'}
                  </span>
                </div>
                
                <div className={`border-2 border-dashed rounded-lg p-4 ${albumFotos.length === 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                  <SimpleImageUpload
                    multiple={true}
                    onMultipleImagesChange={(urls) => {
                      if (urls && urls.length > 0) {
                        const novasFotos = urls.map((url, index) => ({
                          url,
                          legenda: '',
                          ordem: albumFotos.length + index + 1
                        }));
                        setAlbumFotos([...albumFotos, ...novasFotos]);
                        toast.success(`${urls.length} foto(s) adicionada(s)! Adicione mais ou clique em Criar.`);
                      }
                    }}
                    onImageChange={(url) => {
                      // Fallback para upload único
                      if (url) {
                        setAlbumFotos([...albumFotos, { 
                          url, 
                          legenda: '', 
                          ordem: albumFotos.length + 1 
                        }]);
                        toast.success('Foto adicionada! Adicione mais ou clique em Criar.');
                      }
                    }}
                    compressionType="album"
                    maxSizeMB={10}
                  />
                  <p className={`text-xs mt-2 text-center ${albumFotos.length === 0 ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                    {albumFotos.length === 0 
                      ? '⚠️ OBRIGATÓRIO: Adicione pelo menos 1 foto ao álbum'
                      : '✨ Selecione múltiplas imagens de uma vez! Imagens serão comprimidas automaticamente.'
                    }
                  </p>
                </div>

                {albumFotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {albumFotos.map((foto, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={foto.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full aspect-square object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setAlbumFotos(albumFotos.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {editingAlbum && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-blue-800 font-medium">
                  📸 Gerenciar Fotos do Álbum
                </p>
                <p className="text-sm text-blue-700">
                  Para adicionar, editar ou remover fotos deste álbum, clique no ícone de foto (📷) na lista de álbuns.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="album_ativo"
                checked={watchAlbum('ativo')}
                onCheckedChange={(checked) => setValueAlbum('ativo', checked)}
              />
              <Label htmlFor="album_ativo" className="cursor-pointer">
                ✅ Álbum ativo (visível no site)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseAlbumDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-comademig-blue"
                disabled={
                  createAlbum.isPending || 
                  updateAlbum.isPending || 
                  (!editingAlbum && albumFotos.length === 0)
                }
                title={!editingAlbum && albumFotos.length === 0 ? 'Adicione pelo menos 1 foto' : ''}
              >
                {(createAlbum.isPending || updateAlbum.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingAlbum ? 'Atualizar' : `Criar Álbum ${albumFotos.length > 0 ? `(${albumFotos.length} foto${albumFotos.length > 1 ? 's' : ''})` : ''}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Deletar Vídeo */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVideo}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Deletar Álbum */}
      <AlertDialog open={!!deleteAlbumId} onOpenChange={() => setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este álbum? Todas as fotos do álbum também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlbum}
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

export default MultimidiaContentEdit;
