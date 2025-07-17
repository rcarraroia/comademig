
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Image, Calendar, Eye, Download } from "lucide-react";

const Multimidia = () => {
  const [categoria, setCategoria] = useState<string>("todos");

  const videos = [
    {
      id: 1,
      titulo: "Congresso Estadual 2024 - Dia 1",
      descricao: "Abertura do Congresso Estadual com a presença de pastores de todo o estado",
      data: "15 de Novembro de 2024",
      duracao: "2h 30min",
      visualizacoes: 1250,
      categoria: "congressos",
      thumbnail: "/placeholder-video.jpg"
    },
    {
      id: 2,
      titulo: "Seminário de Liderança Jovem",
      descricao: "Palestras sobre liderança cristã para jovens",
      data: "5 de Outubro de 2024",
      duracao: "1h 45min",
      visualizacoes: 890,
      categoria: "seminarios",
      thumbnail: "/placeholder-video.jpg"
    },
    {
      id: 3,
      titulo: "Culto de Consagração - Posse da Diretoria",
      descricao: "Cerimônia de posse da nova diretoria da COMADEMIG",
      data: "2 de Dezembro de 2024",
      duracao: "1h 20min",
      visualizacoes: 567,
      categoria: "cultos",
      thumbnail: "/placeholder-video.jpg"
    },
    {
      id: 4,
      titulo: "Pregação: O Poder da Oração",
      descricao: "Mensagem sobre a importância da oração na vida cristã",
      data: "20 de Novembro de 2024",
      duracao: "45min",
      visualizacoes: 2150,
      categoria: "pregacoes",
      thumbnail: "/placeholder-video.jpg"
    },
    {
      id: 5,
      titulo: "Encontro de Pastores - Testemunhos",
      descricao: "Pastores compartilham experiências e testemunhos",
      data: "22 de Setembro de 2024",
      duracao: "2h 15min",
      visualizacoes: 670,
      categoria: "encontros",
      thumbnail: "/placeholder-video.jpg"
    },
    {
      id: 6,
      titulo: "Louvor e Adoração - Congresso 2024",
      descricao: "Momentos de louvor e adoração do Congresso Estadual",
      data: "16 de Novembro de 2024",
      duracao: "1h 10min",
      visualizacoes: 1850,
      categoria: "louvor",
      thumbnail: "/placeholder-video.jpg"
    }
  ];

  const fotos = [
    {
      id: 1,
      titulo: "Congresso Estadual 2024",
      descricao: "Fotos do maior evento do ano",
      data: "15-17 de Novembro de 2024",
      quantidade: 45,
      categoria: "congressos",
      thumbnail: "/placeholder-photo.jpg"
    },
    {
      id: 2,
      titulo: "Posse da Nova Diretoria",
      descricao: "Momentos da cerimônia de posse",
      data: "2 de Dezembro de 2024",
      quantidade: 32,
      categoria: "eventos",
      thumbnail: "/placeholder-photo.jpg"
    },
    {
      id: 3,
      titulo: "Seminário de Liderança",
      descricao: "Capacitação para líderes jovens",
      data: "5-7 de Outubro de 2024",
      quantidade: 28,
      categoria: "seminarios",
      thumbnail: "/placeholder-photo.jpg"
    },
    {
      id: 4,
      titulo: "Encontro de Pastores",
      descricao: "Comunhão entre ministros",
      data: "22-24 de Setembro de 2024",
      quantidade: 38,
      categoria: "encontros",
      thumbnail: "/placeholder-photo.jpg"
    }
  ];

  const categorias = [
    { value: "todos", label: "Todos" },
    { value: "congressos", label: "Congressos" },
    { value: "seminarios", label: "Seminários" },
    { value: "cultos", label: "Cultos" },
    { value: "pregacoes", label: "Pregações" },
    { value: "encontros", label: "Encontros" },
    { value: "louvor", label: "Louvor" },
    { value: "eventos", label: "Eventos" }
  ];

  const videosFiltrados = videos.filter(video => 
    categoria === "todos" || video.categoria === categoria
  );

  const fotosFiltradas = fotos.filter(foto => 
    categoria === "todos" || foto.categoria === categoria
  );

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videosFiltrados.map((video) => (
              <Card key={video.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-gray-500 font-inter text-sm">Thumbnail do Vídeo</span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-inter">
                      {video.duracao}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <h3 className="font-montserrat font-semibold text-comademig-blue mb-2 line-clamp-2">
                    {video.titulo}
                  </h3>
                  <p className="font-inter text-gray-700 text-sm mb-4 line-clamp-2">
                    {video.descricao}
                  </p>
                  <div className="flex items-center justify-between text-gray-500 text-xs mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{video.data}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye size={14} />
                      <span>{video.visualizacoes.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Assistir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fotosFiltradas.map((album) => (
              <Card key={album.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow group bg-white">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-gray-500 font-inter text-sm">Capa do Álbum</span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-comademig-gold rounded-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-inter">
                      {album.quantidade} fotos
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-montserrat font-semibold text-comademig-blue mb-2 line-clamp-2">
                    {album.titulo}
                  </h3>
                  <p className="font-inter text-gray-700 text-sm mb-3 line-clamp-2">
                    {album.descricao}
                  </p>
                  <div className="flex items-center space-x-1 text-gray-500 text-xs mb-3">
                    <Calendar size={14} />
                    <span>{album.data}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Ver Álbum
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transmissão ao Vivo */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Transmissão ao Vivo
            </h2>
            <p className="font-inter text-gray-600 text-lg mb-8">
              Acompanhe nossos eventos em tempo real
            </p>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <span className="text-gray-500 font-inter">Transmissão offline</span>
                  </div>
                </div>
                <h3 className="font-montserrat font-semibold text-xl text-comademig-blue mb-4">
                  Próxima Transmissão
                </h3>
                <p className="font-inter text-gray-700 mb-6">
                  Congresso Estadual 2024 - Dia 2<br />
                  16 de Novembro às 19:00
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-red-500 hover:bg-red-600 text-white font-montserrat font-semibold"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Assistir no YouTube
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white font-montserrat font-semibold"
                  >
                    Receber Notificação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Multimidia;
