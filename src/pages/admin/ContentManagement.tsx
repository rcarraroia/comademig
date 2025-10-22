
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ErrorBoundary from "@/components/ErrorBoundary";
import { 
  Edit, 
  FileText, 
  Eye, 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Clock,
  Users,
  Phone,
  Mail,
  Image,
  Calendar,
  Newspaper,
  Home,
  Info,
  Contact,
  Camera,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useHomeContent, useAboutContent, useLeadershipContent, useContactContent } from "@/hooks/useContent";
import { useNoticias } from "@/hooks/useNoticias";
import { useVideos, useAlbuns } from "@/hooks/useMultimidia";
import { usePrivacidadeContent, useTermosContent } from "@/hooks/useLegalPages";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Shield } from "lucide-react";

const ContentManagement = () => {
  const { isAdmin, loading } = useAuth();
  
  // Hooks para verificar status do conteúdo
  const { hasCustomContent: homeCustom, content: homeContent, isLoading: homeLoading } = useHomeContent();
  const { hasCustomContent: aboutCustom, content: aboutContent, isLoading: aboutLoading } = useAboutContent();
  const { hasCustomContent: leadershipCustom, content: leadershipContent, isLoading: leadershipLoading } = useLeadershipContent();
  const { hasCustomContent: contactCustom, content: contactContent, isLoading: contactLoading } = useContactContent();
  
  // Hooks para páginas dinâmicas
  const { data: noticias, isLoading: noticiasLoading } = useNoticias({ limit: 5 });
  const { data: videos, isLoading: videosLoading } = useVideos({ limit: 5 });
  const { data: albuns, isLoading: albunsLoading } = useAlbuns({ limit: 5 });
  const { data: privacidadeData, isLoading: privacidadeLoading } = usePrivacidadeContent();
  const { data: termosData, isLoading: termosLoading } = useTermosContent();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  const pages = [
    { 
      name: "Início", 
      key: "home", 
      description: "Página inicial do site com hero, estatísticas e destaques",
      hasCustomContent: homeCustom,
      content: homeContent,
      isLoading: homeLoading,
      publicUrl: "/",
      editorUrl: "/admin/content/home-editor",
      icon: Home,
      priority: "alta",
      status: homeCustom ? "personalizado" : "padrão",
      implemented: true
    },
    { 
      name: "Sobre", 
      key: "sobre", 
      description: "História, missão, visão e valores da COMADEMIG",
      hasCustomContent: aboutCustom,
      content: aboutContent,
      isLoading: aboutLoading,
      publicUrl: "/sobre",
      editorUrl: "/admin/content/sobre-editor",
      icon: Info,
      priority: "alta",
      status: aboutCustom ? "personalizado" : "padrão",
      implemented: true
    },
    { 
      name: "Liderança", 
      key: "lideranca", 
      description: "Diretoria e equipe de liderança da organização",
      hasCustomContent: leadershipCustom,
      content: leadershipContent,
      isLoading: leadershipLoading,
      publicUrl: "/lideranca",
      editorUrl: "/admin/content/lideranca-editor",
      icon: Users,
      priority: "média",
      status: leadershipCustom ? "personalizado" : "padrão",
      implemented: true
    },
    { 
      name: "Contato", 
      key: "contato", 
      description: "Endereço, telefones, e-mails e horário de funcionamento",
      hasCustomContent: contactCustom,
      content: contactContent,
      isLoading: contactLoading,
      publicUrl: "/contato",
      editorUrl: "/admin/content/contato-editor",
      icon: Contact,
      priority: "alta",
      status: contactCustom ? "personalizado" : "padrão",
      implemented: true
    },
    { 
      name: "Notícias", 
      key: "noticias", 
      description: "Notícias, comunicados e atualizações importantes",
      hasCustomContent: true,
      content: noticias,
      isLoading: noticiasLoading,
      publicUrl: "/noticias",
      editorUrl: "/admin/content/noticias-editor",
      icon: Newspaper,
      priority: "média",
      status: "personalizado",
      implemented: true
    },
    { 
      name: "Multimídia", 
      key: "multimidia", 
      description: "Galeria de fotos, vídeos e materiais visuais",
      hasCustomContent: true,
      content: { videos, albuns },
      isLoading: videosLoading || albunsLoading,
      publicUrl: "/multimidia",
      editorUrl: "/admin/content/multimidia-editor",
      icon: Camera,
      priority: "média",
      status: "personalizado",
      implemented: true
    },
    { 
      name: "Privacidade", 
      key: "privacidade", 
      description: "Política de Privacidade (LGPD)",
      hasCustomContent: true,
      content: privacidadeData,
      isLoading: privacidadeLoading,
      publicUrl: "/privacidade",
      editorUrl: "/admin/content/privacidade-editor",
      icon: Shield,
      priority: "alta",
      status: "personalizado",
      implemented: true
    },
    { 
      name: "Termos de Uso", 
      key: "termos", 
      description: "Termos e condições de uso do site",
      hasCustomContent: true,
      content: termosData,
      isLoading: termosLoading,
      publicUrl: "/termos",
      editorUrl: "/dashboard/admin/content/termos-editor",
      icon: FileText,
      priority: "alta",
      status: "personalizado",
      implemented: true
    }
  ];

  const getContentPreview = (page: any) => {
    if (page.isLoading) return { text: "Carregando...", details: [] };
    if (!page.content && page.implemented) return { text: "Usando conteúdo padrão", details: [] };
    if (!page.implemented) return { text: "Editor não implementado", details: [] };
    
    // Verificação de segurança para garantir que page.content existe
    if (!page.content || typeof page.content !== 'object') {
      return { text: "Conteúdo não disponível", details: [] };
    }
    
    switch (page.key) {
      case 'home':
        return {
          text: page.content.banner_principal?.titulo_principal || page.content.hero?.titulo || "Sem título definido",
          details: [
            `Banner: ${page.content.banner_principal?.titulo_principal ? '✓' : '✗'}`,
            `Cards de Ação: ${page.content.cards_acao?.length || 0} itens`,
            `Destaques: ${page.content.destaques_convencao?.length || 0} itens`
          ]
        };
      case 'sobre':
        return {
          text: page.content.titulo || "Sem título definido",
          details: [
            `Missão: ${page.content.missao?.texto ? '✓' : '✗'}`,
            `Visão: ${page.content.visao?.texto ? '✓' : '✗'}`,
            `História: ${page.content.historia?.texto || page.content.historia?.paragrafos ? '✓' : '✗'}`
          ]
        };
      case 'lideranca':
        return {
          text: `${page.content.lideres?.length || 0} líderes cadastrados`,
          details: [
            `Presidente: ${page.content.lideres?.find((l: any) => l.cargo?.toLowerCase().includes('presidente')) ? '✓' : '✗'}`,
            `Vice-Presidente: ${page.content.lideres?.find((l: any) => l.cargo?.toLowerCase().includes('vice')) ? '✓' : '✗'}`,
            `Diretores: ${page.content.lideres?.filter((l: any) => l.cargo?.toLowerCase().includes('diretor')).length || 0}`
          ]
        };
      case 'contato':
        return {
          text: `${page.content.telefones?.length || 0} telefones, ${page.content.emails?.length || 0} emails`,
          details: [
            `Endereço: ${page.content.endereco?.rua ? '✓' : '✗'}`,
            `WhatsApp: ${page.content.telefones?.some((t: any) => t.whatsapp) ? '✓' : '✗'}`,
            `Horários: ${page.content.horario_funcionamento ? '✓' : '✗'}`
          ]
        };
      case 'noticias':
        return {
          text: `${page.content?.length || 0} notícias publicadas`,
          details: [
            `Ativas: ${page.content?.filter((n: any) => n.ativo).length || 0}`,
            `Destaques: ${page.content?.filter((n: any) => n.destaque).length || 0}`,
            `Categorias: ${new Set(page.content?.map((n: any) => n.categoria)).size || 0}`
          ]
        };
      case 'multimidia':
        return {
          text: `${page.content?.videos?.length || 0} vídeos, ${page.content?.albuns?.length || 0} álbuns`,
          details: [
            `Vídeos ativos: ${page.content?.videos?.filter((v: any) => v.ativo).length || 0}`,
            `Álbuns ativos: ${page.content?.albuns?.filter((a: any) => a.ativo).length || 0}`,
            `Total de fotos: ${page.content?.albuns?.reduce((sum: number, a: any) => sum + (a.fotos_count || 0), 0) || 0}`
          ]
        };
      case 'privacidade':
        return {
          text: page.content?.content_json?.title || "Política de Privacidade",
          details: [
            `Seções: ${page.content?.content_json?.sections?.length || 0}`,
            `Última atualização: ${page.content?.last_updated_at ? new Date(page.content.last_updated_at).toLocaleDateString('pt-BR') : 'N/A'}`,
            `Conformidade LGPD: ✓`
          ]
        };
      case 'termos':
        return {
          text: page.content?.content_json?.title || "Termos de Uso",
          details: [
            `Seções: ${page.content?.content_json?.sections?.length || 0}`,
            `Última atualização: ${page.content?.last_updated_at ? new Date(page.content.last_updated_at).toLocaleDateString('pt-BR') : 'N/A'}`,
            `Status: Ativo`
          ]
        };
      default:
        return { text: "Conteúdo disponível", details: [] };
    }
  };

  const getStatusBadge = (page: any) => {
    if (page.isLoading) {
      return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Carregando</Badge>;
    }
    
    if (!page.implemented) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Não Implementado</Badge>;
    }
    
    if (page.hasCustomContent) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Personalizado</Badge>;
    }
    
    return <Badge variant="outline" className="flex items-center gap-1"><Circle className="w-3 h-3" />Padrão</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'média':
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
      case 'baixa':
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
      default:
        return null;
    }
  };

  const implementedPages = pages.filter(p => p.implemented);
  const notImplementedPages = pages.filter(p => !p.implemented);
  const customizedPages = implementedPages.filter(p => p.hasCustomContent);
  const defaultPages = implementedPages.filter(p => !p.hasCustomContent);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-comademig-blue">Gerenciar Conteúdo do Site</h1>
        <p className="text-gray-600 mt-2">
          Gerencie o conteúdo das páginas públicas do site COMADEMIG
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-comademig-blue">{customizedPages.length}</p>
                <p className="text-sm text-gray-600">Personalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Circle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-comademig-blue">{defaultPages.length}</p>
                <p className="text-sm text-gray-600">Usando Padrão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-comademig-blue">{notImplementedPages.length}</p>
                <p className="text-sm text-gray-600">Não Implementadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-comademig-blue" />
              <div>
                <p className="text-2xl font-bold text-comademig-blue">{pages.length}</p>
                <p className="text-sm text-gray-600">Total de Páginas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Páginas Implementadas */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold text-comademig-blue">Páginas Implementadas</h2>
          <Badge variant="secondary">{implementedPages.length}</Badge>
        </div>
        
        <div className="grid gap-4">
          {implementedPages.map((page) => {
            const IconComponent = page.icon;
            const preview = getContentPreview(page);
            
            return (
              <Card key={page.key} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-comademig-light rounded-lg">
                        <IconComponent className="h-6 w-6 text-comademig-blue" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-lg">{page.name}</CardTitle>
                          {getStatusBadge(page)}
                          {getPriorityBadge(page.priority)}
                        </div>
                        
                        <CardDescription className="mb-3">
                          {page.description}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            {preview.text}
                          </p>
                          
                          {preview.details.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {preview.details.map((detail, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {detail}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex items-center space-x-2"
                      >
                        <a href={page.publicUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          <span>Ver</span>
                        </a>
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="bg-comademig-blue hover:bg-comademig-blue/90 flex items-center space-x-2"
                      >
                        <Link to={page.editorUrl}>
                          <Edit className="h-4 w-4" />
                          <span>Editar</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Páginas Não Implementadas */}
      {notImplementedPages.length > 0 && (
        <div>
          <Separator className="my-6" />
          
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-comademig-blue">Páginas Não Implementadas</h2>
            <Badge variant="destructive">{notImplementedPages.length}</Badge>
          </div>
          
          <div className="grid gap-4">
            {notImplementedPages.map((page) => {
              const IconComponent = page.icon;
              
              return (
                <Card key={page.key} className="opacity-75 border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <CardTitle className="text-lg text-gray-600">{page.name}</CardTitle>
                            {getStatusBadge(page)}
                            {getPriorityBadge(page.priority)}
                          </div>
                          
                          <CardDescription className="mb-3">
                            {page.description}
                          </CardDescription>
                          
                          <p className="text-sm text-gray-500">
                            Editor ainda não implementado. Esta página usará conteúdo estático.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex items-center space-x-2"
                        >
                          <a href={page.publicUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </a>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="flex items-center space-x-2 opacity-50"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Em Breve</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Rodapé com Informações */}
      <Card className="bg-comademig-light border-comademig-blue/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Info className="w-6 h-6 text-comademig-blue mt-1" />
            <div>
              <h3 className="font-semibold text-comademig-blue mb-2">Como Funciona o Gerenciador de Conteúdo</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <strong>Personalizado:</strong> Conteúdo foi editado e salvo no banco de dados</p>
                <p>• <strong>Padrão:</strong> Usando conteúdo estático definido no código</p>
                <p>• <strong>Não Implementado:</strong> Editor ainda não foi desenvolvido</p>
                <p>• <strong>Prioridade:</strong> Indica a importância da página para o site</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ContentManagementWithErrorBoundary = () => (
  <ErrorBoundary>
    <ContentManagement />
  </ErrorBoundary>
);

export default ContentManagementWithErrorBoundary;
