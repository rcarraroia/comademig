import { useState, useEffect } from "react";
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, Trash2, Image, Home, BarChart3, Star, Newspaper, Target } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useHomeContent } from "@/hooks/useContent";
import { useUpdateContent } from "@/hooks/useContentMutation";
import { SimpleImageUpload } from "@/components/ui/SimpleImageUpload";

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

const HomeContentEdit = () => {
    const { isAdmin, loading } = useAuth();
    const { content, isLoading, error } = useHomeContent();
    const updateContent = useUpdateContent();
    const [isSaving, setIsSaving] = useState(false);

    // Verificar se o usuário é admin
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isDirty } } = useForm<HomeContentData>({
        defaultValues: content
    });

    const { fields: destaquesFields, append: appendDestaque, remove: removeDestaque } = useFieldArray({
        control,
        name: "destaques_convencao"
    });

    const { fields: noticiasFields, append: appendNoticia, remove: removeNoticia } = useFieldArray({
        control,
        name: "noticias_recentes"
    });

    // Atualizar formulário quando o conteúdo carregar (apenas uma vez)
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (content && !hasInitialized) {
            reset(content);
            setHasInitialized(true);
        }
    }, [content, reset, hasInitialized]);

    const onSubmit = async (data: HomeContentData) => {
        setIsSaving(true);
        try {
            await updateContent.mutateAsync({
                pageName: 'home',
                content: data
            });

            toast.success('Conteúdo da página inicial salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar conteúdo:', error);
            toast.error('Erro ao salvar conteúdo. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const adicionarDestaque = () => {
        appendDestaque({ titulo_evento: '', imagem_evento: '', subtitulo: '', link_evento: '' });
    };

    const adicionarNoticia = () => {
        appendNoticia({ titulo_noticia: '', imagem_noticia: '', data_noticia: '', resumo_noticia: '', link_noticia: '' });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar conteúdo</h1>
                    <p className="text-gray-600 mb-4">Não foi possível carregar o conteúdo da página inicial.</p>
                    <Button asChild>
                        <Link to="/dashboard/content">Voltar</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard/content">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-comademig-blue">Editar Página Início</h1>
                        <p className="text-gray-600">Configure o conteúdo da página inicial do site</p>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving || !isDirty}
                    className="bg-comademig-blue hover:bg-comademig-blue/90"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Banner Principal */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                                <Home className="w-4 h-4 text-white" />
                            </div>
                            Banner Principal
                        </CardTitle>
                        <CardDescription>
                            Configure o banner de destaque da página inicial
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="banner.titulo_principal">Título Principal</Label>
                            <Input
                                id="banner.titulo_principal"
                                {...register("banner_principal.titulo_principal", { required: "Título é obrigatório" })}
                                placeholder="Ex: Fortalecendo o Reino de Deus"
                            />
                            {errors.banner_principal?.titulo_principal && (
                                <p className="text-sm text-red-600 mt-1">{errors.banner_principal.titulo_principal.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="banner.subtitulo">Subtítulo</Label>
                            <Textarea
                                id="banner.subtitulo"
                                {...register("banner_principal.subtitulo", { required: "Subtítulo é obrigatório" })}
                                placeholder="Descrição do banner"
                                rows={3}
                            />
                            {errors.banner_principal?.subtitulo && (
                                <p className="text-sm text-red-600 mt-1">{errors.banner_principal.subtitulo.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="banner.texto_botao">Texto do Botão</Label>
                                <Input
                                    id="banner.texto_botao"
                                    {...register("banner_principal.texto_botao", { required: "Texto do botão é obrigatório" })}
                                    placeholder="Ex: Saiba Mais"
                                />
                                {errors.banner_principal?.texto_botao && (
                                    <p className="text-sm text-red-600 mt-1">{errors.banner_principal.texto_botao.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="banner.link_botao">Link do Botão</Label>
                                <Input
                                    id="banner.link_botao"
                                    {...register("banner_principal.link_botao", { required: "Link do botão é obrigatório" })}
                                    placeholder="Ex: /sobre"
                                />
                                {errors.banner_principal?.link_botao && (
                                    <p className="text-sm text-red-600 mt-1">{errors.banner_principal.link_botao.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cards de Ação */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                                <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            Cards de Ação (4 cards)
                        </CardTitle>
                        <CardDescription>
                            Configure os 4 cards principais da página inicial
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4">
                                <h4 className="font-semibold text-comademig-blue">Card {index + 1}</h4>

                                <div>
                                    <Label htmlFor={`cards_acao.${index}.titulo`}>Título</Label>
                                    <Input
                                        id={`cards_acao.${index}.titulo`}
                                        {...register(`cards_acao.${index}.titulo` as const, { required: "Título é obrigatório" })}
                                        placeholder="Título do card"
                                    />
                                    {errors.cards_acao?.[index]?.titulo && (
                                        <p className="text-sm text-red-600 mt-1">{errors.cards_acao[index]?.titulo?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor={`cards_acao.${index}.descricao`}>Descrição</Label>
                                    <Textarea
                                        id={`cards_acao.${index}.descricao`}
                                        {...register(`cards_acao.${index}.descricao` as const, { required: "Descrição é obrigatória" })}
                                        placeholder="Descrição do card"
                                        rows={3}
                                    />
                                    {errors.cards_acao?.[index]?.descricao && (
                                        <p className="text-sm text-red-600 mt-1">{errors.cards_acao[index]?.descricao?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor={`cards_acao.${index}.link_botao`}>Link do Botão</Label>
                                    <Input
                                        id={`cards_acao.${index}.link_botao`}
                                        {...register(`cards_acao.${index}.link_botao` as const, { required: "Link é obrigatório" })}
                                        placeholder="URL do link"
                                    />
                                    {errors.cards_acao?.[index]?.link_botao && (
                                        <p className="text-sm text-red-600 mt-1">{errors.cards_acao[index]?.link_botao?.message}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Destaques da Convenção */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                                <Star className="w-4 h-4 text-white" />
                            </div>
                            Destaques da Convenção
                        </CardTitle>
                        <CardDescription>
                            Gerencie os eventos em destaque
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-end mb-4">
                            <Button type="button" onClick={adicionarDestaque}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Destaque
                            </Button>
                        </div>
                        {destaquesFields.map((destaque, index) => (
                            <div key={destaque.id} className="p-4 border rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">Destaque {index + 1}</h4>
                                    <Button
                                        type="button"
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
                                        {...register(`destaques_convencao.${index}.titulo_evento` as const, { required: "Título é obrigatório" })}
                                        placeholder="Nome do evento"
                                    />
                                    {errors.destaques_convencao?.[index]?.titulo_evento && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.destaques_convencao[index]?.titulo_evento?.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Imagem do Evento</Label>
                                    <SimpleImageUpload
                                        onImageChange={(url) => {
                                            if (url) {
                                                setValue(`destaques_convencao.${index}.imagem_evento` as const, url, { shouldDirty: true });
                                            }
                                        }}
                                    />
                                    {watch(`destaques_convencao.${index}.imagem_evento`) && (
                                        <div className="mt-2">
                                            <p className="text-sm text-green-600">✅ Imagem carregada com sucesso!</p>
                                            <img
                                                src={watch(`destaques_convencao.${index}.imagem_evento`)}
                                                alt="Preview"
                                                className="w-20 h-20 object-cover rounded border mt-1"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor={`destaque-subtitulo-${index}`}>Subtítulo</Label>
                                    <Input
                                        id={`destaque-subtitulo-${index}`}
                                        {...register(`destaques_convencao.${index}.subtitulo` as const, { required: "Subtítulo é obrigatório" })}
                                        placeholder="Subtítulo do evento"
                                    />
                                    {errors.destaques_convencao?.[index]?.subtitulo && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.destaques_convencao[index]?.subtitulo?.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor={`destaque-link-${index}`}>Link do Evento</Label>
                                    <Input
                                        id={`destaque-link-${index}`}
                                        {...register(`destaques_convencao.${index}.link_evento` as const, { required: "Link é obrigatório" })}
                                        placeholder="URL do evento"
                                    />
                                    {errors.destaques_convencao?.[index]?.link_evento && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.destaques_convencao[index]?.link_evento?.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {destaquesFields.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum destaque adicionado ainda.</p>
                                <p className="text-sm">Clique em "Adicionar Destaque" para começar.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notícias Recentes - GERENCIADAS NO EDITOR DE NOTÍCIAS */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-blue-900">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                <Newspaper className="w-4 h-4 text-white" />
                            </div>
                            Notícias Recentes
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                            As notícias da Home agora são gerenciadas no Editor de Notícias
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-white border border-blue-200 rounded-lg">
                                <p className="text-sm text-gray-700 mb-3">
                                    📰 As notícias exibidas na página inicial agora são gerenciadas através do 
                                    <strong> Editor de Notícias</strong>, onde você pode:
                                </p>
                                <ul className="text-sm text-gray-600 space-y-2 ml-4">
                                    <li>✅ Criar e editar notícias</li>
                                    <li>✅ Marcar notícias para exibir na Home</li>
                                    <li>✅ Definir notícias em destaque</li>
                                    <li>✅ Gerenciar categorias e imagens</li>
                                    <li>✅ Moderar notícias de usuários</li>
                                </ul>
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    asChild
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Link to="/dashboard/admin/content/noticias-editor">
                                        <Newspaper className="w-4 h-4 mr-2" />
                                        Ir para Editor de Notícias
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seção Junte-se à Missão */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <div className="w-8 h-8 bg-comademig-gold rounded-full flex items-center justify-center mr-3">
                                <Target className="w-4 h-4 text-white" />
                            </div>
                            Seção "Junte-se à Missão"
                        </CardTitle>
                        <CardDescription>
                            Configure a seção de call-to-action da página inicial
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="missao-titulo">Título Principal</Label>
                            <Input
                                id="missao-titulo"
                                {...register("junte_se_missao.titulo_principal", { required: "Título é obrigatório" })}
                                placeholder="Ex: Junte-se à nossa missão"
                            />
                            {errors.junte_se_missao?.titulo_principal && (
                                <p className="text-sm text-red-600 mt-1">{errors.junte_se_missao.titulo_principal.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="missao-subtitulo">Subtítulo</Label>
                            <Textarea
                                id="missao-subtitulo"
                                {...register("junte_se_missao.subtitulo", { required: "Subtítulo é obrigatório" })}
                                placeholder="Descrição da missão"
                                rows={3}
                            />
                            {errors.junte_se_missao?.subtitulo && (
                                <p className="text-sm text-red-600 mt-1">{errors.junte_se_missao.subtitulo.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="missao-texto-botao">Texto do Botão</Label>
                                <Input
                                    id="missao-texto-botao"
                                    {...register("junte_se_missao.texto_botao", { required: "Texto do botão é obrigatório" })}
                                    placeholder="Ex: Participar"
                                />
                                {errors.junte_se_missao?.texto_botao && (
                                    <p className="text-sm text-red-600 mt-1">{errors.junte_se_missao.texto_botao.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="missao-link-botao">Link do Botão</Label>
                                <Input
                                    id="missao-link-botao"
                                    {...register("junte_se_missao.link_botao", { required: "Link do botão é obrigatório" })}
                                    placeholder="Ex: /filiacao"
                                />
                                {errors.junte_se_missao?.link_botao && (
                                    <p className="text-sm text-red-600 mt-1">{errors.junte_se_missao.link_botao.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default HomeContentEdit;