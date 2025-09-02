import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Upload, Image } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    const { isAdmin, loading } = useUserRoles();
    const navigate = useNavigate();
    const { toast } = useToast();

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

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isAdmin()) {
            loadContent();
        }
    }, [isAdmin]);

    const loadContent = async () => {
        try {
            const { data, error } = await supabase
                .from('content_management')
                .select('content_json')
                .eq('page_name', 'home')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao carregar conteúdo:', error);
                return;
            }

            if (data?.content_json) {
                setContentData(prev => ({
                    ...prev,
                    ...data.content_json
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar conteúdo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('content_management')
                .upsert({
                    page_name: 'home',
                    content_json: contentData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'page_name'
                });

            if (error) {
                throw error;
            }

            // Limpar cache do React Query para forçar recarregamento
            if (window.queryClient) {
                window.queryClient.invalidateQueries({ queryKey: ['content', 'home'] });
            }

            toast({
                title: "Sucesso",
                description: "Conteúdo da página inicial salvo com sucesso! As alterações aparecerão no site em alguns segundos.",
            });

            navigate('/dashboard/admin/content');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar o conteúdo",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (file: File, section: string, index?: number): Promise<string | null> => {
        const uploadId = `${section}-${index || 0}`;
        setUploadingImages(prev => new Set(prev).add(uploadId));

        try {
            if (!file.type.startsWith('image/')) {
                throw new Error('Por favor, selecione apenas arquivos de imagem');
            }

            if (file.size > 5 * 1024 * 1024) {
                throw new Error('A imagem deve ter no máximo 5MB');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `home/${section}/${Date.now()}.${fileExt}`;

            // Verificar se bucket existe, se não, criar
            const { data: buckets } = await supabase.storage.listBuckets();
            const contentBucket = buckets?.find(bucket => bucket.name === 'content-images');

            if (!contentBucket) {
                const { error: bucketError } = await supabase.storage.createBucket('content-images', {
                    public: true,
                    allowedMimeTypes: ['image/*'],
                    fileSizeLimit: 10485760 // 10MB
                });

                if (bucketError) {
                    console.error('Erro ao criar bucket:', bucketError);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('content-images')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('content-images')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error: any) {
            console.error('Erro no upload:', error);
            toast({
                title: "Erro no upload",
                description: error.message,
                variant: "destructive"
            });
            return null;
        } finally {
            setUploadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(uploadId);
                return newSet;
            });
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

    if (loading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
            </div>
        );
    }

    if (!isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link to="/dashboard/admin/content">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-comademig-blue">
                        Editar Página: Início
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Configure o conteúdo da página inicial do site
                    </p>
                </div>
            </div>

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
                    <Card>
                        <CardHeader>
                            <CardTitle>Banner Principal</CardTitle>
                            <CardDescription>
                                Configure o banner de destaque da página inicial
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cards de Ação */}
                <TabsContent value="cards">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cards de Ação</CardTitle>
                            <CardDescription>
                                Configure os 4 cards principais (Inscrição, Filiação, Regularização, Ao Vivo)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Destaques da Convenção */}
                <TabsContent value="destaques">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Destaques da Convenção</CardTitle>
                                    <CardDescription>
                                        Gerencie os eventos em destaque
                                    </CardDescription>
                                </div>
                                <Button onClick={addDestaque}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Destaque
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                        <Label htmlFor={`destaque-imagem-${index}`}>Imagem do Evento</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id={`destaque-imagem-${index}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleImageUpload(file, 'destaques', index);
                                                        if (url) {
                                                            setContentData(prev => ({
                                                                ...prev,
                                                                destaques_convencao: prev.destaques_convencao.map((d, i) =>
                                                                    i === index ? { ...d, imagem_evento: url } : d
                                                                )
                                                            }));
                                                        }
                                                    }
                                                }}
                                                disabled={uploadingImages.has(`destaques-${index}`)}
                                            />
                                            {uploadingImages.has(`destaques-${index}`) && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                                            )}
                                        </div>
                                        {destaque.imagem_evento && (
                                            <div className="mt-2">
                                                <img
                                                    src={destaque.imagem_evento}
                                                    alt="Preview"
                                                    className="w-32 h-20 object-cover rounded border"
                                                />
                                            </div>
                                        )}
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notícias Recentes */}
                <TabsContent value="noticias">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Notícias Recentes</CardTitle>
                                    <CardDescription>
                                        Gerencie as notícias em destaque na página inicial
                                    </CardDescription>
                                </div>
                                <Button onClick={addNoticia}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Notícia
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                        <Label htmlFor={`noticia-imagem-${index}`}>Imagem da Notícia</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id={`noticia-imagem-${index}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleImageUpload(file, 'noticias', index);
                                                        if (url) {
                                                            setContentData(prev => ({
                                                                ...prev,
                                                                noticias_recentes: prev.noticias_recentes.map((n, i) =>
                                                                    i === index ? { ...n, imagem_noticia: url } : n
                                                                )
                                                            }));
                                                        }
                                                    }
                                                }}
                                                disabled={uploadingImages.has(`noticias-${index}`)}
                                            />
                                            {uploadingImages.has(`noticias-${index}`) && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                                            )}
                                        </div>
                                        {noticia.imagem_noticia && (
                                            <div className="mt-2">
                                                <img
                                                    src={noticia.imagem_noticia}
                                                    alt="Preview"
                                                    className="w-32 h-20 object-cover rounded border"
                                                />
                                            </div>
                                        )}
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
                                            placeholder="URL da notícia completa"
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Junte-se à Nossa Missão */}
                <TabsContent value="missao">
                    <Card>
                        <CardHeader>
                            <CardTitle>Junte-se à Nossa Missão</CardTitle>
                            <CardDescription>
                                Configure a seção de call-to-action final
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
                <Link to="/dashboard/admin/content">
                    <Button variant="outline">Cancelar</Button>
                </Link>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
};

export default HomeContentEdit;