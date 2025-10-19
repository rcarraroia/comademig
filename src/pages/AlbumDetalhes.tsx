import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useAlbum } from "@/hooks/useMultimidia";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AlbumDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading, error } = useAlbum(id!);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (album?.fotos && currentImageIndex < album.fotos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-montserrat font-bold text-comademig-blue mb-4">
            Álbum não encontrado
          </h2>
          <Button asChild>
            <Link to="/multimidia">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Multimídia
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const fotos = album.fotos || [];

  return (
    <div className="min-h-screen bg-comademig-light">
      {/* Header */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            asChild
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/10 mb-6"
          >
            <Link to="/multimidia">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Multimídia
            </Link>
          </Button>

          <div className="max-w-4xl">
            <h1 className="font-montserrat font-bold text-3xl md:text-5xl mb-4">
              {album.titulo}
            </h1>
            {album.descricao && (
              <p className="font-inter text-xl text-gray-200 mb-4">
                {album.descricao}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              {album.data_evento && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(album.data_evento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>{fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}</span>
              </div>
              {album.categoria && (
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  {album.categoria}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Galeria de Fotos */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {fotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotos.map((foto, index) => (
                <Card
                  key={foto.id}
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group"
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative aspect-square bg-gray-200">
                    <OptimizedImage
                      src={foto.url}
                      alt={foto.legenda || `Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {foto.legenda && (
                    <CardContent className="p-3">
                      <p className="text-sm text-gray-700 line-clamp-2 font-inter">
                        {foto.legenda}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-inter text-lg">
                Este álbum ainda não possui fotos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black">
          <DialogHeader className="absolute top-4 left-4 right-4 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white font-montserrat">
                {fotos[currentImageIndex]?.legenda || `Foto ${currentImageIndex + 1} de ${fotos.length}`}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </DialogHeader>

          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {fotos[currentImageIndex] && (
              <img
                src={fotos[currentImageIndex].url}
                alt={fotos[currentImageIndex].legenda || `Foto ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Navegação */}
            {currentImageIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                onClick={prevImage}
              >
                <ArrowLeft className="w-8 h-8" />
              </Button>
            )}

            {currentImageIndex < fotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                onClick={nextImage}
              >
                <ArrowLeft className="w-8 h-8 rotate-180" />
              </Button>
            )}

            {/* Contador */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-inter">
              {currentImageIndex + 1} / {fotos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlbumDetalhes;
