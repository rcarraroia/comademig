import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Home as HomeIcon,
  Star,
  Loader2,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTodasNoticias, useNoticiasMutations } from "@/hooks/useNoticias";
import { SimpleImageUpload } from "@/components/ui/SimpleImageUpload";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoticiaFormData {
  titulo: string;
  slug: string;
  resumo: string;
  conteudo_completo: string;
  autor: string;
  data_publicacao: string;
  categoria: string;
  imagem_url: string;
  destaque: boolean;
  exibir_na_home: boolean;
  ativo: boolean;
}

const NoticiasContentEdit = () => {
  const { isAdmin, loading: authLoading, user, profile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filtros
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  // Queries
  const { data: noticias, isLoading } = useTodasNoticias({
    status: statusFiltro === "todas" ? undefined : (statusFiltro as any),
    categoria: categoriaFiltro === "todas" ? undefined : categoriaFiltro,
    busca,
  });

  // Mutations
  const { createNoticia, updateNoticia, deleteNoticia } = useNoticiasMutations();

  // Form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<NoticiaFormData>({
    defaultValues: {
      titulo: '',
      slug: '',
      resumo: '',
      conteudo_completo: '',
      autor: profile?.nome_completo || user?.email || '',
      data_publicacao: new Date().toISOString().split('T')[0],
      categoria: '',
      imagem_url: '',
      destaque: false,
      exibir_na_home: false,
      ativo: true,
    }
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  const categorias = [
    { value: "eventos", label: "Eventos" },
    { value: "comunicados", label: "Comunicados" },
    { value: "noticias", label: "Notícias" },
    { value: "ministerio", label: "Ministério" },
    { value: "convencao", label: "Convenção" },
    { value: "outros", label: "Outros" },
  ];

  // Gerar slug automaticamente
  const titulo = watch('titulo');
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Atualizar slug quando título mudar (apenas em criação)
  if (titulo && !editingNoticia) {
    const newSlug = generateSlug(titulo);
    if (watch('slug') !== newSlug) {
      setValue('slug', newSlug);
    }
  }

  const handleOpenDialog = (noticia?: any) => {
    if (noticia) {
      setEditingNoticia(noticia);
      reset({
        titulo: noticia.titulo,
        slug: noticia.slug,
        resumo: noticia.resumo || '',
        conteudo_completo: noticia.conteudo_completo || '',
        autor: noticia.autor || profile?.nome_completo || user?.email || '',
        data_publicacao: noticia.data_publicacao?.split('T')[0] || new Date().toISOString().split('T')[0],
        categoria: noticia.categoria || '',
        imagem_url: noticia.imagem_url || '',
        destaque: noticia.destaque || false,
        exibir_na_home: noticia.exibir_na_home || false,
        ativo: noticia.ativo !== false,
      });
    } else {
      setEditingNoticia(null);
      reset({
        titulo: '',
        slug: '',
        resumo: '',
        conteudo_completo: '',
        autor: profile?.nome_completo || user?.email || '',
        data_publicacao: new Date().toISOString().split('T')[0],
        categoria: '',
        imagem_url: '',
        destaque: false,
        exibir_na_home: false,
        ativo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNoticia(null);
    reset();
  };

  const onSubmit = async (data: NoticiaFormData) => {
    try {
      if (editingNoticia) {
        await updateNoticia.mutateAsync({
          id: editingNoticia.id,
          ...data,
        });
        toast.success('Notícia atualizada com sucesso!');
      } else {
        await createNoticia.mutateAsync(data as any);
        toast.success('Notícia criada com sucesso!');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      toast.error('Erro ao salvar notícia. Tente novamente.');
    }
  };

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

  const toggleExibirNaHome = async (noticia: any) => {
    try {
      await updateNoticia.mutateAsync({
        id: noticia.id,
        exibir_na_home: !noticia.exibir_na_home,
      });
      toast.success(noticia.exibir_na_home ? 'Removida da Home' : 'Adicionada à Home');
    } catch (error) {
      toast.error('Erro ao atualizar notícia');
    }
  };

  const toggleDestaque = async (noticia: any) => {
    try {
      await updateNoticia.mutateAsync({
        id: noticia.id,
        destaque: !noticia.destaque,
      });
      toast.success(noticia.destaque ? 'Destaque removido' : 'Marcada como destaque');
    } catch (error) {
      toast.error('Erro ao atualizar notícia');
    }
  };

  const toggleAtivo = async (noticia: any) => {
    try {
      await updateNoticia.mutateAsync({
        id: noticia.id,
        ativo: !noticia.ativo,
      });
      toast.success(noticia.ativo ? 'Notícia desativada' : 'Notícia ativada');
    } catch (error) {
      toast.error('Erro ao atualizar notícia');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/admin/content">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-comademig-blue">Editor de Notícias</h1>
            <p className="text-gray-600 mt-2">
              Gerencie todas as notícias do site
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Notícia
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="busca"
                  placeholder="Título ou resumo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovadas</SelectItem>
                  <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notícias */}
      <Card>
        <CardHeader>
          <CardTitle>
            Notícias ({noticias?.length || 0})
          </CardTitle>
          <CardDescription>
            Lista de todas as notícias do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-comademig-blue" />
            </div>
          ) : noticias && noticias.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações Rápidas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticias.map((noticia) => (
                    <TableRow key={noticia.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {noticia.titulo}
                          {noticia.exibir_na_home && (
                            <Badge variant="outline" className="text-xs">
                              <HomeIcon className="w-3 h-3 mr-1" />
                              Home
                            </Badge>
                          )}
                          {noticia.destaque && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              <Star className="w-3 h-3 mr-1" />
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {noticia.autor_profile?.nome_completo || noticia.autor || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(noticia.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{noticia.categoria || 'Sem categoria'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {noticia.data_publicacao && format(new Date(noticia.data_publicacao), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExibirNaHome(noticia)}
                            title={noticia.exibir_na_home ? "Remover da Home" : "Exibir na Home"}
                          >
                            <HomeIcon className={`w-4 h-4 ${noticia.exibir_na_home ? 'text-blue-600' : 'text-gray-400'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDestaque(noticia)}
                            title={noticia.destaque ? "Remover destaque" : "Marcar como destaque"}
                          >
                            <Star className={`w-4 h-4 ${noticia.destaque ? 'text-yellow-600' : 'text-gray-400'}`} />
                          </Button>
                          <Switch
                            checked={noticia.ativo}
                            onCheckedChange={() => toggleAtivo(noticia)}
                            title={noticia.ativo ? "Desativar" : "Ativar"}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {noticia.status === 'aprovado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link to={`/noticias/${noticia.slug}`} target="_blank">
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(noticia)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(noticia.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <p>Nenhuma notícia encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNoticia ? 'Editar Notícia' : 'Nova Notícia'}
            </DialogTitle>
            <DialogDescription>
              {editingNoticia ? 'Atualize as informações da notícia' : 'Preencha os dados da nova notícia'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  {...register("titulo", { required: "Título é obrigatório" })}
                  placeholder="Digite o título da notícia"
                />
                {errors.titulo && (
                  <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  {...register("slug", { required: "Slug é obrigatório" })}
                  placeholder="slug-da-noticia"
                  disabled={!!editingNoticia}
                />
                {errors.slug && (
                  <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={watch('categoria') || ''}
                  onValueChange={(value) => setValue('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_publicacao">Data de Publicação</Label>
                <Input
                  id="data_publicacao"
                  type="date"
                  {...register("data_publicacao")}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="autor">Autor</Label>
                <Input
                  id="autor"
                  {...register("autor")}
                  placeholder="Nome do autor"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="resumo">Resumo</Label>
                <Textarea
                  id="resumo"
                  {...register("resumo")}
                  placeholder="Resumo breve da notícia"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="conteudo_completo">Conteúdo Completo</Label>
                <Textarea
                  id="conteudo_completo"
                  {...register("conteudo_completo")}
                  placeholder="Conteúdo completo da notícia"
                  rows={8}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Imagem de Capa</Label>
                <SimpleImageUpload
                  onImageChange={(url) => {
                    if (url) {
                      setValue('imagem_url', url);
                    }
                  }}
                />
                {watch('imagem_url') && (
                  <div className="mt-2">
                    <img
                      src={watch('imagem_url') || ''}
                      alt="Preview"
                      className="w-full max-w-md h-48 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exibir_na_home"
                    checked={watch('exibir_na_home')}
                    onCheckedChange={(checked) => setValue('exibir_na_home', checked)}
                  />
                  <Label htmlFor="exibir_na_home" className="cursor-pointer">
                    🏠 Exibir na página inicial (Home)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="destaque"
                    checked={watch('destaque')}
                    onCheckedChange={(checked) => setValue('destaque', checked)}
                  />
                  <Label htmlFor="destaque" className="cursor-pointer">
                    ⭐ Marcar como notícia em destaque
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={watch('ativo')}
                    onCheckedChange={(checked) => setValue('ativo', checked)}
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    ✅ Notícia ativa (visível no site)
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-comademig-blue hover:bg-comademig-blue/90"
                disabled={createNoticia.isPending || updateNoticia.isPending}
              >
                {(createNoticia.isPending || updateNoticia.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingNoticia ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

export default NoticiasContentEdit;
