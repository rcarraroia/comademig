
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, Loader2 } from "lucide-react";
import { useNoticias } from "@/hooks/useNoticias";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import ErrorBoundary from "@/components/ErrorBoundary";

const Noticias = () => {
  const { data: noticias, isLoading, error } = useNoticias({ status: 'aprovado', ativo: true, limit: 20 });
  const { data: noticiasDestaque } = useNoticias({ status: 'aprovado', destaque: true, limit: 1 });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Erro ao carregar notícias:', error);
  }

  // Notícia em destaque (primeira da lista de destaques ou primeira geral)
  const noticiaDestaque = noticiasDestaque?.[0] || noticias?.[0];
  
  // Outras notícias (excluindo a em destaque)
  const outrasNoticias = noticias?.filter(n => n.id !== noticiaDestaque?.id) || [];

  // Formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const categorias = [
    { value: "institucional", label: "Institucional", color: "bg-comademig-blue" },
    { value: "social", label: "Social", color: "bg-green-500" },
    { value: "educacao", label: "Educação", color: "bg-purple-500" },
    { value: "eventos", label: "Eventos", color: "bg-comademig-gold" },
    { value: "evangelismo", label: "Evangelismo", color: "bg-red-500" },
    { value: "familia", label: "Família", color: "bg-pink-500" }
  ];

  const getCategoriaInfo = (categoria: string) => {
    return categorias.find(cat => cat.value === categoria) || categorias[0];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Notícias
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Fique por dentro das últimas novidades da COMADEMIG
            </p>
          </div>
        </div>
      </section>

      {/* Notícia Principal */}
      {noticiaDestaque && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="md:order-2">
                    {noticiaDestaque.imagem_url ? (
                      <OptimizedImage
                        src={noticiaDestaque.imagem_url}
                        alt={noticiaDestaque.titulo}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-inter">Imagem Principal</span>
                      </div>
                    )}
                  </div>
                  <div className="md:order-1 p-8">
                    <div className="flex items-center space-x-2 mb-4">
                      {noticiaDestaque.categoria && (
                        <Badge className={`${getCategoriaInfo(noticiaDestaque.categoria).color} text-white`}>
                          {getCategoriaInfo(noticiaDestaque.categoria).label}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-gray-600">
                        Em Destaque
                      </Badge>
                    </div>
                    <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-comademig-blue mb-4">
                      {noticiaDestaque.titulo}
                    </h2>
                    <p className="font-inter text-gray-700 leading-relaxed mb-6">
                      {noticiaDestaque.resumo}
                    </p>
                    <div className="flex items-center space-x-4 text-gray-600 mb-6 flex-wrap">
                      {noticiaDestaque.autor && (
                        <div className="flex items-center space-x-1">
                          <User size={16} />
                          <span className="font-inter text-sm">{noticiaDestaque.autor}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar size={16} />
                        <span className="font-inter text-sm">{formatarData(noticiaDestaque.data_publicacao)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye size={16} />
                        <span className="font-inter text-sm">{noticiaDestaque.visualizacoes} visualizações</span>
                      </div>
                    </div>
                    <Button 
                      asChild
                      className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold"
                    >
                      <Link to={`/noticias/${noticiaDestaque.slug}`}>Ler Notícia Completa</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Outras Notícias */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Outras Notícias
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Acompanhe todas as novidades e acontecimentos da convenção
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {outrasNoticias.length > 0 ? (
              outrasNoticias.map((noticia) => (
                <Card key={noticia.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardHeader>
                    {noticia.imagem_url ? (
                      <OptimizedImage
                        src={noticia.imagem_url}
                        alt={noticia.titulo}
                        className="w-full h-48 rounded-lg mb-4 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-gray-500 font-inter text-sm">Imagem da Notícia</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      {noticia.categoria && (
                        <Badge className={`${getCategoriaInfo(noticia.categoria).color} text-white`}>
                          {getCategoriaInfo(noticia.categoria).label}
                        </Badge>
                      )}
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Eye size={14} />
                        <span className="font-inter text-xs">{noticia.visualizacoes}</span>
                      </div>
                    </div>
                    <CardTitle className="font-montserrat text-comademig-blue line-clamp-2">
                      {noticia.titulo}
                    </CardTitle>
                    <CardDescription className="font-inter text-sm text-gray-500 flex items-center space-x-4 flex-wrap">
                      {noticia.autor && (
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{noticia.autor}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatarData(noticia.data_publicacao)}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-inter text-gray-700 mb-4 line-clamp-3">
                      {noticia.resumo}
                    </p>
                    <Button 
                      asChild
                      size="sm" 
                      variant="outline" 
                      className="border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat"
                    >
                      <Link to={`/noticias/${noticia.slug}`}>Ler Mais</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="font-inter text-gray-600 text-lg">
                  Nenhuma notícia disponível no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-comademig-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4">
            Receba Nossas Notícias
          </h2>
          <p className="font-inter text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Cadastre-se em nossa newsletter e receba as últimas notícias da COMADEMIG em seu e-mail
          </p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input 
              type="email" 
              placeholder="Seu e-mail" 
              className="flex-grow px-4 py-3 rounded-lg text-gray-900 font-inter"
            />
            <Button 
              size="lg" 
              className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold"
            >
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const NoticiasWithErrorBoundary = () => (
  <ErrorBoundary>
    <Noticias />
  </ErrorBoundary>
);

export default NoticiasWithErrorBoundary;
