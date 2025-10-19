import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, ArrowLeft, Share2 } from "lucide-react";
import { useNoticia } from "@/hooks/useNoticias";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const NoticiaDetalhes = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: noticia, isLoading, error } = useNoticia(slug || '');

  // Categorias (mesmo do Noticias.tsx)
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

  // Formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Função para compartilhar
  const compartilhar = async () => {
    if (navigator.share && noticia) {
      try {
        await navigator.share({
          title: noticia.titulo,
          text: noticia.resumo,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  // Error state
  if (error || !noticia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-comademig-blue mb-4">Notícia não encontrada</h1>
          <p className="text-gray-600 mb-6">A notícia que você procura não existe ou foi removida.</p>
          <Button asChild>
            <Link to="/noticias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Notícias
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb e Voltar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/noticias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Notícias
            </Link>
          </Button>
        </div>
      </section>

      {/* Conteúdo da Notícia */}
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                {noticia.categoria && (
                  <Badge className={`${getCategoriaInfo(noticia.categoria).color} text-white`}>
                    {getCategoriaInfo(noticia.categoria).label}
                  </Badge>
                )}
                {noticia.destaque && (
                  <Badge variant="outline" className="text-comademig-gold border-comademig-gold">
                    Em Destaque
                  </Badge>
                )}
              </div>

              <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-comademig-blue mb-6 leading-tight">
                {noticia.titulo}
              </h1>

              <div className="flex items-center justify-between flex-wrap gap-4 text-gray-600 mb-6">
                <div className="flex items-center space-x-4 flex-wrap">
                  {noticia.autor && (
                    <div className="flex items-center space-x-2">
                      <User size={18} />
                      <span className="font-inter">{noticia.autor}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} />
                    <span className="font-inter">{formatarData(noticia.data_publicacao)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye size={18} />
                    <span className="font-inter">{noticia.visualizacoes} visualizações</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={compartilhar}
                  className="flex items-center space-x-2"
                >
                  <Share2 size={16} />
                  <span>Compartilhar</span>
                </Button>
              </div>

              {/* Resumo */}
              <p className="font-inter text-xl text-gray-700 leading-relaxed border-l-4 border-comademig-gold pl-6 py-2">
                {noticia.resumo}
              </p>
            </header>

            {/* Imagem Principal */}
            {noticia.imagem_url && (
              <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
                <OptimizedImage
                  src={noticia.imagem_url}
                  alt={noticia.titulo}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Conteúdo */}
            <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
              <div 
                className="font-inter text-gray-800 leading-relaxed prose prose-lg max-w-none
                  prose-headings:font-montserrat prose-headings:text-comademig-blue
                  prose-p:mb-4 prose-p:leading-relaxed
                  prose-a:text-comademig-gold prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-comademig-blue prose-strong:font-semibold
                  prose-ul:my-4 prose-ol:my-4
                  prose-li:mb-2"
                dangerouslySetInnerHTML={{ __html: noticia.conteudo_completo }}
              />
            </div>

            {/* Footer - Compartilhar novamente */}
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="font-inter text-gray-700">
                  Gostou desta notícia? Compartilhe com seus amigos!
                </p>
                <Button
                  onClick={compartilhar}
                  className="bg-comademig-gold hover:bg-comademig-gold/90 text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Voltar */}
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link to="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ver Todas as Notícias
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

const NoticiaDetalhesWithErrorBoundary = () => (
  <ErrorBoundary>
    <NoticiaDetalhes />
  </ErrorBoundary>
);

export default NoticiaDetalhesWithErrorBoundary;
