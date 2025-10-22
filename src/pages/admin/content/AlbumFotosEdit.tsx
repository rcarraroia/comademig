import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Trash2, Loader2, GripVertical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAlbum, useFotos, useMultimidiaMutations } from "@/hooks/useMultimidia";
import { SimpleImageUpload } from "@/components/ui/SimpleImageUpload";
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

const AlbumFotosEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: album, isLoading: isLoadingAlbum } = useAlbum(id!);
  const { data: fotos, isLoading: isLoadingFotos } = useFotos(id!);
  const { addFoto, updateFoto, deleteFoto } = useMultimidiaMutations();

  const [deleteFotoId, setDeleteFotoId] = useState<string | null>(null);
  const [editingFotoId, setEditingFotoId] = useState<string | null>(null);
  const [legenda, setLegenda] = useState("");

  if (authLoading || isLoadingAlbum) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!album) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Álbum não encontrado</h2>
          <Button asChild>
            <Link to="/dashboard/admin/content/multimidia-editor">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAddFoto = async (url: string) => {
    try {
      const ordem = (fotos?.length || 0) + 1;
      await addFoto.mutateAsync({
        album_id: id!,
        url,
        legenda: "",
        ordem,
      });
      toast.success("Foto adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar foto.");
      console.error(error);
    }
  };

  const handleUpdateLegenda = async (fotoId: string) => {
    try {
      await updateFoto.mutateAsync({
        id: fotoId,
        legenda,
      });
      toast.success("Legenda atualizada!");
      setEditingFotoId(null);
      setLegenda("");
    } catch (error) {
      toast.error("Erro ao atualizar legenda.");
      console.error(error);
    }
  };

  const handleDeleteFoto = async () => {
    if (!deleteFotoId) return;
    try {
      await deleteFoto.mutateAsync({ id: deleteFotoId, album_id: id! });
      toast.success("Foto excluída com sucesso!");
      setDeleteFotoId(null);
    } catch (error) {
      toast.error("Erro ao excluir foto.");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/dashboard/admin/content/multimidia-editor">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Editor de Multimídia
          </Link>
        </Button>

        <h1 className="text-3xl font-montserrat font-bold text-comademig-blue mb-2">
          Gerenciar Fotos do Álbum
        </h1>
        <p className="text-gray-600 font-inter">
          {album.titulo}
        </p>
      </div>

      {/* Upload de Nova Foto */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Adicionar Nova Foto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleImageUpload
            onImageChange={(url) => url && handleAddFoto(url)}
          />
          <p className="text-sm text-gray-500 mt-2">
            Selecione uma imagem para adicionar ao álbum
          </p>
        </CardContent>
      </Card>

      {/* Lista de Fotos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fotos do Álbum ({fotos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFotos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-comademig-blue" />
            </div>
          ) : fotos && fotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fotos.map((foto) => (
                <div key={foto.id} className="border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200">
                    <img
                      src={foto.url}
                      alt={foto.legenda || "Foto"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    {editingFotoId === foto.id ? (
                      <div className="space-y-2">
                        <Input
                          value={legenda}
                          onChange={(e) => setLegenda(e.target.value)}
                          placeholder="Legenda da foto..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateLegenda(foto.id)}
                            disabled={updateFoto.isPending}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingFotoId(null);
                              setLegenda("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {foto.legenda || "Sem legenda"}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingFotoId(foto.id);
                              setLegenda(foto.legenda || "");
                            }}
                          >
                            Editar Legenda
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteFotoId(foto.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma foto adicionada ainda</p>
              <p className="text-sm">Use o formulário acima para adicionar fotos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog: Deletar Foto */}
      <AlertDialog open={!!deleteFotoId} onOpenChange={() => setDeleteFotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFoto}
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

export default AlbumFotosEdit;
