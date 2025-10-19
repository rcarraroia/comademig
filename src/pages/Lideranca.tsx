
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Loader2 } from "lucide-react";
import { useLeadershipContent, LeaderData } from "@/hooks/useContent";
import { useContentPrefetch } from "@/hooks/useContentPrefetch";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import ContentStatusBadge from "@/components/admin/ContentStatusBadge";
import ErrorBoundary from "@/components/ErrorBoundary";

const Lideranca = () => {
  const { content, isLoading, error, hasCustomContent } = useLeadershipContent();
  
  // Prefetch de conteúdo relacionado
  useContentPrefetch('lideranca');

  // Apenas mostrar loading se realmente estiver carregando E não tiver conteúdo
  if (isLoading && !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  // Log de erro mas continua com conteúdo padrão
  if (error) {
    console.error('Erro ao carregar conteúdo da página de liderança:', error);
  }

  // Organizar líderes por categoria
  const liderancaPorCategoria = {
    presidencia: content.lideres?.filter((lider: LeaderData) => lider.categoria === 'presidencia') || [],
    diretoria: content.lideres?.filter((lider: LeaderData) => lider.categoria === 'diretoria') || [],
    conselho: content.lideres?.filter((lider: LeaderData) => lider.categoria === 'conselho') || [],
    campos: content.lideres?.filter((lider: LeaderData) => lider.categoria === 'campos') || []
  };

  const renderLiderCard = (lider: LeaderData, isPresidente = false) => (
    <Card key={lider.id} className={`border-0 shadow-lg ${isPresidente ? '' : 'hover:shadow-xl transition-shadow'}`}>
      {isPresidente ? (
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                <OptimizedImage
                  src={lider.imagem}
                  alt={lider.nome}
                  className="w-full h-full"
                  placeholder={
                    <span className="text-gray-500 font-inter text-sm">Foto do Presidente</span>
                  }
                  lazy={false} // Não usar lazy loading para imagem principal
                />
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="font-montserrat font-bold text-2xl text-comademig-blue mb-2">
                {lider.nome}
              </h3>
              <p className="font-inter text-comademig-gold font-semibold text-lg mb-4">
                {lider.cargo}
              </p>
              <p className="font-inter text-gray-700 leading-relaxed mb-6">
                {lider.bio}
              </p>
              {(lider.email || lider.telefone) && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  {lider.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail size={18} />
                      <span className="font-inter text-sm">{lider.email}</span>
                    </div>
                  )}
                  {lider.telefone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone size={18} />
                      <span className="font-inter text-sm">{lider.telefone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      ) : (
        <>
          <CardHeader className="text-center">
            <div className="w-32 h-32 mx-auto mb-4">
              <OptimizedImage
                src={lider.imagem}
                alt={lider.nome}
                className="w-full h-full rounded-full"
                placeholder={
                  <span className="text-gray-500 font-inter text-xs">Foto</span>
                }
              />
            </div>
            <CardTitle className="font-montserrat text-comademig-blue">
              {lider.nome}
            </CardTitle>
            <CardDescription className="font-inter text-comademig-gold font-semibold">
              {lider.cargo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-inter text-gray-700 text-sm leading-relaxed text-center">
              {lider.bio}
            </p>
            {(lider.email || lider.telefone) && (
              <div className="mt-4 flex flex-col gap-2 items-center">
                {lider.email && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail size={14} />
                    <span className="font-inter text-xs">{lider.email}</span>
                  </div>
                )}
                {lider.telefone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone size={14} />
                    <span className="font-inter text-xs">{lider.telefone}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              {content.titulo}
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              {content.descricao}
            </p>
          </div>
        </div>
      </section>

      {/* Presidente */}
      {liderancaPorCategoria.presidencia.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Presidência
              </h2>
              <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
                Liderança que guia a convenção com sabedoria e dedicação
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {liderancaPorCategoria.presidencia.map(lider => renderLiderCard(lider, true))}
            </div>
          </div>
        </section>
      )}

      {/* Diretoria */}
      {liderancaPorCategoria.diretoria.length > 0 && (
        <section className="py-16 bg-comademig-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Diretoria Executiva
              </h2>
              <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
                Equipe executiva que trabalha pela excelência ministerial
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {liderancaPorCategoria.diretoria.map(lider => (
                <div key={lider.id} className="bg-white">
                  {renderLiderCard(lider)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Conselho */}
      {liderancaPorCategoria.conselho.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Conselho Administrativo
              </h2>
              <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
                Conselheiros que zelam pela ordem e crescimento da convenção
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {liderancaPorCategoria.conselho.map(lider => renderLiderCard(lider))}
            </div>
          </div>
        </section>
      )}

      {/* Campos Regionais */}
      {liderancaPorCategoria.campos.length > 0 && (
        <section className="py-16 bg-comademig-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Campos Regionais
              </h2>
              <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
                Responsáveis pelos campos regionais da COMADEMIG
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {liderancaPorCategoria.campos.map(lider => (
                <div key={lider.id} className="bg-white">
                  {renderLiderCard(lider)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Badge de status para administradores */}
      <ContentStatusBadge
        pageName="lideranca"
        pageTitle="Liderança"
        hasCustomContent={hasCustomContent}
        editorUrl="/dashboard/admin/content/lideranca-editor"
        publicUrl="/lideranca"
        position="bottom-right"
        compact={false}
        contentPreview={content.titulo}
      />
    </div>
  );
};

const LiderancaWithErrorBoundary = () => (
  <ErrorBoundary>
    <Lideranca />
  </ErrorBoundary>
);

export default LiderancaWithErrorBoundary;
