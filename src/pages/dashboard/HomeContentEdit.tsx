import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image, Home, BarChart3, Star, Newspaper, Target } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useHomeContent } from "@/hooks/useContent";
import { useUpdateContent } from "@/hooks/useContentMutation";
import { ImageUpload } from "@/components/ui/ImageUpload";
import ContentFormLayout from "@/components/admin/ContentFormLayout";
import ContentFormSection from "@/components/admin/ContentFormSection";
import SaveButton from "@/components/admin/SaveButton";
import ContentPreview from "@/components/admin/ContentPreview";

interface BannerData {
    titulo_principal: string;
    subtitulo: string;
    texto_botao: string;
    link_botao: string;
}

interface CardData {
    titulo: string;
    descricao: string;
    link_botao: string;
}

interface EventoDestaque {
    titulo_evento: string;
    imagem_evento: string;
    subtitulo: string;
    link_evento: string;
}

interface NoticiaRecente {
    titulo_noticia: string;
    imagem_noticia: string;
    data_noticia: string;
    resumo_noticia: string;
    link_noticia: string;
}

interface MissaoData {
    titulo_principal: string;
    subtitulo: string;
    texto_botao: string;
    link_botao: string;
}

interface HomeContentData {
    banner_principal: BannerData;
    cards_acao: CardData[];
    destaques_convencao: EventoDestaque[];
    noticias_recentes: NoticiaRecente[];
    junte_se_missao: MissaoData;
}

const HomeContentEdit = () => {
    const { isAdmin, loading } = useAuth();
    
    // Usar o hook de conteúdo para carregar dados
    const { content: homeContent, isLoading: contentLoading, error: contentError, hasCustomContent } = useHomeContent();
    const updateContentMutation = useUpdateContent();
    
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [contentData, setContentData] = useState<HomeContentData>({
        banner_principal: {
            titulo_principal: '',
            subtitulo: '',
            texto_botao: '',
            link_botao: ''
        },
        cards_acao: [
            { titulo: '', descricao: '', link_botao: '' },
            { titulo: '', descricao: '', link_botao: '' },
            { titulo: '', descricao: '', link_botao: '' },
            { titulo: '', descricao: '', link_botao: '' }
        ],
        destaques_convencao: [],
        noticias_recentes: [],
        junte_se_missao: {
            titulo_principal: '',
            subtitulo: '',
            texto_botao: '',
            link_botao: ''
        }
    });



    // Carregar dados quando disponíveis (apenas uma vez)
    useEffect(() => {
        if (homeContent && !isDirty) {
            setContentData(homeContent);
        }
    }, [homeContent]); // Removido isDirty da dependência para evitar loop

    // Marcar como dirty quando dados mudarem (com debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (homeContent && JSON.stringify(contentData) !== JSON.stringify(homeContent)) {
                setIsDirty(true);
            } else if (!homeContent || JSON.stringify(contentData) === JSON.stringify(homeContent)) {
                setIsDirty(false);
            }
        }, 100); // Debounce de 100ms

        return () => clearTimeout(timeoutId);
    }, [contentData, homeContent]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log('🔍 Salvando conteúdo da página inicial:', contentData);
            
            await updateContentMutation.mutateAsync({
                pageName: 'home',
                content: contentData
            });

            toast.success('Conteúdo da página inicial salvo com sucesso!');
            setIsDirty(false);
        } catch (error) {
            console.error('❌ Erro ao salvar conteúdo:', error);
            toast.error('Erro ao salvar conteúdo. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };



    const addDestaque = () => {
        setContentData(prev => ({
            ...prev,
            destaques_convencao: [
                ...prev.destaques_convencao,
                { titulo_evento: '', imagem_evento: '', subtitulo: '', link_evento: '' }
            ]
        }));
    };

    const removeDestaque = (index: number) => {
        setContentData(prev => ({
            ...prev,
            destaques_convencao: prev.destaques_convencao.filter((_, i) => i !== index)
        }));
    };

    const addNoticia = () => {
        setContentData(prev => ({
            ...prev,
            noticias_recentes: [
                ...prev.noticias_recentes,
                { titulo_noticia: '', imagem_noticia: '', data_noticia: '', resumo_noticia: '', link_noticia: '' }
            ]
        }));
    };

    const removeNoticia = (index: number) => {
        setContentData(prev => ({
            ...prev,
            noticias_recentes: prev.noticias_recentes.filter((_, i) => i !== index)
        }));
    };

    if (loading || contentLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
            </div>
        );
    }

    if (!isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    if (contentError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Erro ao carregar conteúdo da página inicial</p>
                    <Button onClick={() => window.location.reload()}>
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <ContentFormLayout
            title="Editar Página: Início"
            description="Configure o conteúdo da página inicial do site"
            backUrl="/dashboard/content"
            publicUrl="/"
            onSave={handleSave}
            isSaving={isSaving}
            isDirty={isDirty}
            hasErrors={updateContentMutation.isError}
            errorMessage={updateContentMutation.error?.message}
        >
            {/* Preview Toggle */}
            <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                >
                    {showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
                </Button>
            </div>

            {/* Preview */}
            {showPreview && (
                <ContentPreview
                    title="Preview da Página Inicial"
                    description="Visualização das alterações em tempo real"
                    isVisible={showPreview}
                    onToggleVisibility={() => setShowPreview(!showPreview)}
                    publicUrl="/"
                    hasChanges={isDirty}
                >
                    <div className="space-y-4">
                        <div className="bg-comademig-blue text-white p-6 rounded-lg">
                            <h1 className="text-2xl font-bold mb-2">
                                {contentData.banner_principal.titulo_principal || 'Título Principal'}
                            </h1>
                            <p className="mb-4">
                                {contentData.banner_principal.subtitulo || 'Subtítulo'}
                            </p>
                            <button className="bg-comademig-gold px-4 py-2 rounded">
                                {contentData.banner_principal.texto_botao || 'Botão'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {contentData.cards_acao.map((card, index) => (
                                <div key={index} className="border p-4 rounded">
                                    <h3 className="font-semibold">{card.titulo || `Card ${index + 1}`}</h3>
                                    <p className="text-sm text-gray-600">{card.descricao || 'Descrição'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </ContentPreview>
            )}

            <Tabs defaultValue="banner" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="banner">Banner Principal</TabsTrigger>
                    <TabsTrigger value="cards">Cards de Ação</TabsTrigger>
                    <TabsTrigger value="destaques">Destaques</TabsTrigger>
                    <TabsTrigger value="noticias">Notícias</TabsTrigger>
                    <TabsTrigger value="missao">Missão</TabsTrigger>
                </TabsList>

                {/* Banner Principal */}
                <TabsContent value="banner">
                    <ContentFormSection
                        title="Banner Principal"
                        description="Configure o banner de destaque da página inicial"
                        icon={<Home className="w-5 h-5 text-comademig-blue" />}
                        step={1}
                        totalSteps={5}
                        isRequired={true}
                        isCompleted={!!(contentData.banner_principal.titulo_principal && contentData.banner_principal.subtitulo)}
                    >
                            <div>
                                <Label htmlFor="banner-titulo">Título Principal</Label>
                                <Input
                                    id="banner-titulo"
                                    value={contentData.banner_principal.titulo_principal}
                                    onChange={(e) => setContentData(prev => ({
                                        ...prev,
                                        banner_principal: { ...prev.banner_principal, titulo_principal: e.target.value }
                                    }))}
                                    placeholder="Ex: Fortalecendo o Reino de Deus"
                                />
                            </div>

                            <div>
                                <Label htmlFor="banner-subtitulo">Subtítulo</Label>
                                <Textarea
                                    id="banner-subtitulo"
                                    value={contentData.banner_principal.subtitulo}
                                    onChange={(e) => setContentData(prev => ({
                                        ...prev,
                                        banner_principal: { ...prev.banner_principal, subtitulo: e.target.value }
                                    }))}
                                    placeholder="Descrição do banner"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="banner-texto-botao">Texto do Botão</Label>
                                    <Input
                                        id="banner-texto-botao"
                                        value={contentData.banner_principal.texto_botao}
                                        onChange={(e) => setContentData(prev => ({
                                            ...prev,
                                            banner_principal: { ...prev.banner_principal, texto_botao: e.target.value }
                                        }))}
                                        placeholder="Ex: Saiba Mais"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="banner-link-botao">Link do Botão</Label>
                                    <Input
                                        id="banner-link-botao"
                                        value={contentData.banner_principal.link_botao}
                                        onChange={(e) => setContentData(prev => ({
                                            ...prev,
                                            banner_principal: { ...prev.banner_principal, link_botao: e.target.value }
                                        }))}
                                        placeholder="Ex: /sobre"
                                    />
                                </div>
                            </div>
                    </ContentFormSection>
                </TabsContent>   
             {/* Cards de Ação */}
                <TabsContent value="cards">
                    <ContentFormSection
                        title="Cards de Ação"
                        description="Configure os 4 cards principais (Inscrição, Filiação, Regularização, Ao Vivo)"
                        icon={<BarChart3 className="w-5 h-5 text-comademig-blue" />}
                        step={2}
                        totalSteps={5}
                        isRequired={true}
                        isCompleted={contentData.cards_acao.every(card => card.titulo && card.descricao)}
                    >
                            {contentData.cards_acao.map((card, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-4">
                                    <h4 className="font-semibold">Card {index + 1}</h4>

                                    <div>
                                        <Label htmlFor={`card-titulo-${index}`}>Título</Label>
                                        <Input
                                            id={`card-titulo-${index}`}
                                            value={card.titulo}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                cards_acao: prev.cards_acao.map((c, i) =>
                                                    i === index ? { ...c, titulo: e.target.value } : c
                                                )
                                            }))}
                                            placeholder="Título do card"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`card-descricao-${index}`}>Descrição</Label>
                                        <Textarea
                                            id={`card-descricao-${index}`}
                                            value={card.descricao}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                cards_acao: prev.cards_acao.map((c, i) =>
                                                    i === index ? { ...c, descricao: e.target.value } : c
                                                )
                                            }))}
                                            placeholder="Descrição do card"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`card-link-${index}`}>Link do Botão</Label>
                                        <Input
                                            id={`card-link-${index}`}
                                            value={card.link_botao}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                cards_acao: prev.cards_acao.map((c, i) =>
                                                    i === index ? { ...c, link_botao: e.target.value } : c
                                                )
                                            }))}
                                            placeholder="URL do link"
                                        />
                                    </div>
                                </div>
                            ))}
                    </ContentFormSection>
                </TabsContent>

                {/* Destaques da Convenção */}
                <TabsContent value="destaques">
                    <ContentFormSection
                        title="Destaques da Convenção"
                        description="Gerencie os eventos em destaque"
                        icon={<Star className="w-5 h-5 text-comademig-blue" />}
                        step={3}
                        totalSteps={5}
                        isRequired={false}
                        isCompleted={contentData.destaques_convencao.length > 0}
                    >
                        <div className="flex justify-end mb-4">
                            <Button onClick={addDestaque}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Destaque
                            </Button>
                        </div>
                            {contentData.destaques_convencao.map((destaque, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Destaque {index + 1}</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeDestaque(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div>
                                        <Label htmlFor={`destaque-titulo-${index}`}>Título do Evento</Label>
                                        <Input
                                            id={`destaque-titulo-${index}`}
                                            value={destaque.titulo_evento}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                destaques_convencao: prev.destaques_convencao.map((d, i) =>
                                                    i === index ? { ...d, titulo_evento: e.target.value } : d
                                                )
                                            }))}
                                            placeholder="Nome do evento"
                                        />
                                    </div>

                                    <div>
                                        <ImageUpload
                                            currentImage={destaque.imagem_evento}
                                            onImageChange={(url) => {
                                                setContentData(prev => ({
                                                    ...prev,
                                                    destaques_convencao: prev.destaques_convencao.map((d, i) =>
                                                        i === index ? { ...d, imagem_evento: url || '' } : d
                                                    )
                                                }));
                                            }}
                                            section="home/destaques"
                                            index={index}
                                            label="Imagem do Evento"
                                            placeholder="Selecione uma imagem para o evento"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`destaque-subtitulo-${index}`}>Subtítulo</Label>
                                        <Input
                                            id={`destaque-subtitulo-${index}`}
                                            value={destaque.subtitulo}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                destaques_convencao: prev.destaques_convencao.map((d, i) =>
                                                    i === index ? { ...d, subtitulo: e.target.value } : d
                                                )
                                            }))}
                                            placeholder="Subtítulo do evento"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`destaque-link-${index}`}>Link do Evento</Label>
                                        <Input
                                            id={`destaque-link-${index}`}
                                            value={destaque.link_evento}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                destaques_convencao: prev.destaques_convencao.map((d, i) =>
                                                    i === index ? { ...d, link_evento: e.target.value } : d
                                                )
                                            }))}
                                            placeholder="URL do evento"
                                        />
                                    </div>
                                </div>
                            ))}

                            {contentData.destaques_convencao.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhum destaque adicionado ainda.</p>
                                    <p className="text-sm">Clique em "Adicionar Destaque" para começar.</p>
                                </div>
                            )}
                    </ContentFormSection>
                </TabsContent>

                {/* Notícias Recentes */}
                <TabsContent value="noticias">
                    <ContentFormSection
                        title="Notícias Recentes"
                        description="Gerencie as notícias em destaque na página inicial"
                        icon={<Newspaper className="w-5 h-5 text-comademig-blue" />}
                        step={4}
                        totalSteps={5}
                        isRequired={false}
                        isCompleted={contentData.noticias_recentes.length > 0}
                    >
                        <div className="flex justify-end mb-4">
                            <Button onClick={addNoticia}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Notícia
                            </Button>
                        </div>
                            {contentData.noticias_recentes.map((noticia, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Notícia {index + 1}</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeNoticia(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div>
                                        <Label htmlFor={`noticia-titulo-${index}`}>Título da Notícia</Label>
                                        <Input
                                            id={`noticia-titulo-${index}`}
                                            value={noticia.titulo_noticia}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                noticias_recentes: prev.noticias_recentes.map((n, i) =>
                                                    i === index ? { ...n, titulo_noticia: e.target.value } : n
                                                )
                                            }))}
                                            placeholder="Título da notícia"
                                        />
                                    </div>

                                    <div>
                                        <ImageUpload
                                            currentImage={noticia.imagem_noticia}
                                            onImageChange={(url) => {
                                                setContentData(prev => ({
                                                    ...prev,
                                                    noticias_recentes: prev.noticias_recentes.map((n, i) =>
                                                        i === index ? { ...n, imagem_noticia: url || '' } : n
                                                    )
                                                }));
                                            }}
                                            section="home/noticias"
                                            index={index}
                                            label="Imagem da Notícia"
                                            placeholder="Selecione uma imagem para a notícia"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`noticia-data-${index}`}>Data da Notícia</Label>
                                        <Input
                                            id={`noticia-data-${index}`}
                                            type="date"
                                            value={noticia.data_noticia}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                noticias_recentes: prev.noticias_recentes.map((n, i) =>
                                                    i === index ? { ...n, data_noticia: e.target.value } : n
                                                )
                                            }))}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`noticia-resumo-${index}`}>Resumo da Notícia</Label>
                                        <Textarea
                                            id={`noticia-resumo-${index}`}
                                            value={noticia.resumo_noticia}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                noticias_recentes: prev.noticias_recentes.map((n, i) =>
                                                    i === index ? { ...n, resumo_noticia: e.target.value } : n
                                                )
                                            }))}
                                            placeholder="Resumo da notícia"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`noticia-link-${index}`}>Link da Notícia</Label>
                                        <Input
                                            id={`noticia-link-${index}`}
                                            value={noticia.link_noticia}
                                            onChange={(e) => setContentData(prev => ({
                                                ...prev,
                                                noticias_recentes: prev.noticias_recentes.map((n, i) =>
                                                    i === index ? { ...n, link_noticia: e.target.value } : n
                                                )
                                            }))}
                                            placeholder="URL da notícia"
                                        />
                                    </div>
                                </div>
                            ))}

                            {contentData.noticias_recentes.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhuma notícia adicionada ainda.</p>
                                    <p className="text-sm">Clique em "Adicionar Notícia" para começar.</p>
                                </div>
                            )}
                    </ContentFormSection>
                </TabsContent>

                {/* Seção Junte-se à Missão */}
                <TabsContent value="missao">
                    <ContentFormSection
                        title="Seção 'Junte-se à Missão'"
                        description="Configure a seção de call-to-action da página inicial"
                        icon={<Target className="w-5 h-5 text-comademig-blue" />}
                        step={5}
                        totalSteps={5}
                        isRequired={false}
                        isCompleted={!!(contentData.junte_se_missao.titulo_principal && contentData.junte_se_missao.subtitulo)}
                    >
                            <div>
                                <Label htmlFor="missao-titulo">Título Principal</Label>
                                <Input
                                    id="missao-titulo"
                                    value={contentData.junte_se_missao.titulo_principal}
                                    onChange={(e) => setContentData(prev => ({
                                        ...prev,
                                        junte_se_missao: { ...prev.junte_se_missao, titulo_principal: e.target.value }
                                    }))}
                                    placeholder="Ex: Junte-se à Nossa Missão"
                                />
                            </div>

                            <div>
                                <Label htmlFor="missao-subtitulo">Subtítulo</Label>
                                <Textarea
                                    id="missao-subtitulo"
                                    value={contentData.junte_se_missao.subtitulo}
                                    onChange={(e) => setContentData(prev => ({
                                        ...prev,
                                        junte_se_missao: { ...prev.junte_se_missao, subtitulo: e.target.value }
                                    }))}
                                    placeholder="Descrição da missão"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="missao-texto-botao">Texto do Botão</Label>
                                    <Input
                                        id="missao-texto-botao"
                                        value={contentData.junte_se_missao.texto_botao}
                                        onChange={(e) => setContentData(prev => ({
                                            ...prev,
                                            junte_se_missao: { ...prev.junte_se_missao, texto_botao: e.target.value }
                                        }))}
                                        placeholder="Ex: Faça Parte"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="missao-link-botao">Link do Botão</Label>
                                    <Input
                                        id="missao-link-botao"
                                        value={contentData.junte_se_missao.link_botao}
                                        onChange={(e) => setContentData(prev => ({
                                            ...prev,
                                            junte_se_missao: { ...prev.junte_se_missao, link_botao: e.target.value }
                                        }))}
                                        placeholder="Ex: /filiacao"
                                    />
                                </div>
                            </div>
                    </ContentFormSection>
                </TabsContent>
            </Tabs>
        </ContentFormLayout>
    );
};

export default HomeContentEdit;