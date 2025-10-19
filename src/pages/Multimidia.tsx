import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Image, Calendar, Eye, Loader2 } from "lucide-react";
import { useVideos, useAlbuns } from "@/hooks/useMultimidia";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Multimidia = () => {
  const [categoria, setCategoria] = useState<string>("todos");

  // Buscar vídeos e álbuns
  const { data: videos, isLoading: isLoadingVideos } = useVideos({
    categoria: categoria === "todos" ? undefined : categoria,
    ativo: true,
    limit: 50,
  });

  const { data: albuns, isLoading: isLoadingAlbuns } = useAlbuns({
    categoria: categoria === "todos" ? undefined : categoria,
    ativo: true,
    limit: 50,
  });

  const categorias = [
    { value: "todos", label: "Todos" },
    { value: "cultos", label: "Cultos" },
    { value: "eventos", label: "Eventos" },
    { value: "pregacoes", label: "Pregações" },
    { value: "testemunhos", label: "Testemunhos" },
    { value: "louvor", label: "Louvor" },
    { value: "encontros", label: "Encontros" },
    { value: "geral", label: "Geral" },
  ];

  // Função para extrair ID do YouTube da URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  // Função para gerar thumbnail do YouTube
  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeId(url);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Multimídia
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Vídeos, fotos e conteúdo dos nossos eventos
            </p>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-8 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categorias.map((cat) => (
              <Button
                key={cat.value}
                variant={categoria === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoria(cat.value)}
                className={`font-inter ${
                  categoria === cat.value
                    ? "bg-comademig-blue text-white"
                    : "border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white"
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Vídeos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Vídeos
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Assista aos principais momentos dos nossos eventos
            </p>
          </div>

          {isLoadingVideos ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map((video) => (
                <Card key={video.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {video.thumbnail_url || video.url_youtube ? (
                        <OptimizedImage
                          src={video.thumbnail_url || getYouTubeThumbnail(video.url_youtube)}
                          alt={video.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-gray-500 font-inter text-sm">Sem thumbnail</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      {video.duracao && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-inter">
                          {video.duracao}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <h3 className="font-montserrat font-semibold text-comademig-blue mb-2 line-clamp-2">
                      {video.titulo}
                    </h3>
                    {video.descricao && (
                      <p className="font-inter text-gray-700 text-sm mb-4 line-clamp-2">
                        {video.descricao}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-gray-500 text-xs mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>
                          {video.data_publicacao 
                            ? format(new Date(video.data_publicacao), "dd/MM/yyyy", { locale: ptBR })
                            : "Data não disponível"
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye size={14} />
                        <span>{video.visualizacoes.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button 
                      asChild
                      size="sm" 
                      className="w-full bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat"
                    >
                      <a 
                        href={`https://www.youtube.com/watch?v=${getYouTubeId(video.url_youtube)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Assistir
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-inter">
                Nenhum vídeo encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Fotos */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Galeria de Fotos
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Reviva os melhores momentos através das nossas fotos
            </p>
          </div>

          {isLoadingAlbuns ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
            </div>
          ) : albuns && albuns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {albuns.map((album) => (
                <Card key={album.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow group bg-white">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {album.capa_url ? (
                        <OptimizedImage
                          src={album.capa_url}
                          alt={album.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-gray-500 font-inter text-sm">Sem capa</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-comademig-gold rounded-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-inter">
                        {album.fotos_count || 0} fotos
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-montserrat font-semibold text-comademig-blue mb-2 line-clamp-2">
                      {album.titulo}
                    </h3>
                    {album.descricao && (
                      <p className="font-inter text-gray-700 text-sm mb-3 line-clamp-2">
                        {album.descricao}
                      </p>
                    )}
                    {album.data_evento && (
                      <div className="flex items-center space-x-1 text-gray-500 text-xs mb-3">
                        <Calendar size={14} />
                        <span>{format(new Date(album.data_evento), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    <Button 
                      asChild
                      size="sm" 
                      variant="outline"
                      className="w-full border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat"
                    >
                      <Link to={`/multimidia/album/${album.id}`}>
                        <Image className="w-4 h-4 mr-2" />
                        Ver Álbum
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-inter">
                Nenhum álbum encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Multimidia;
