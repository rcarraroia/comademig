import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Upload, Image } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NoticiaDestaque {
  titulo: string;
  imagem_principal: string;
  conteudo: string;
}

interface OutraNoticia {
  titulo_noticia: string;
  imagem_noticia: string;
  data_publicacao: string;
  autor: string;
  resumo_noticia: string;
  conteudo_completo: string;
  tipo_midia: 'imagem' | 'video';
  link_video?: string;
}

interface NewsletterData {
  titulo_principal: string;
  subtitulo: string;
}

interface NoticiasContentData {
  noticia_destaque: NoticiaDestaque;
  outras_noticias: OutraNoticia[];
  receba_noticias: NewsletterData;
}

const NoticiasContentEdit = () => {
  const { isAdmin, loading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contentData, setContentData] = useState<NoticiasContentData>({
    noticia_destaque: {
      titulo: '',
      imagem_principal: '',
      conteudo: ''
    },
    outras_noticias: [],
    receba_noticias: {
      titulo_principal: '',
      subtitulo: ''
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
        .eq('page_name', 'news')
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
          page_name: 'news',
          content_json: contentData
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo da página de notícias salvo com sucesso!",
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
      const fileName = `noticias/${section}/${Date.now()}.${fileExt}`;

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

  const addNoticia = () => {
    setContentData(prev => ({
      ...prev,
      outras_noticias: [
        ...prev.outras_noticias,
        {
          titulo_noticia: '',
          imagem_noticia: '',
          data_publicacao: '',
          autor: '',
          resumo_noticia: '',
          conteudo_completo: '',
          tipo_midia: 'imagem'
        }
      ]
    }));
  };

  const removeNoticia = (index: number) => {
    setContentData(prev => ({
      ...prev,
      outras_noticias: prev.outras_noticias.filter((_, i) => i !== index)
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
            Editar Página: Notícias
          </h1>
          <p className="text-gray-600 mt-2">
            Configure o conteúdo da página de notícias do site
          </p>
        </div>
      </div>

      <Tabs defaultValue="destaque" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="destaque">Notícia de Destaque</TabsTrigger>
          <TabsTrigger value="outras">Outras Notícias</TabsTrigger>
          <TabsTrigger value="newsletter">Receba Nossas Notícias</TabsTrigger>
        </TabsList>

        {/* Notícia de Destaque */}
        <TabsContent value="destaque">
          <Card>
            <CardHeader>
              <CardTitle>Notícia de Destaque</CardTitle>
              <CardDescription>
                Esta seção permite a edição de uma única notícia principal que aparecerá com mais visibilidade na página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="destaque-titulo">Título</Label>
                <Input
                  id="destaque-titulo"
                  value={contentData.noticia_destaque.titulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    noticia_destaque: { ...prev.noticia_destaque, titulo: e.target.value }
                  }))}
                  placeholder="Título da notícia de destaque"
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="destaque-imagem">Imagem Principal</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="destaque-imagem"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'destaque');
                        if (url) {
                          setContentData(prev => ({
                            ...prev,
                            noticia_destaque: { ...prev.noticia_destaque, imagem_principal: url }
                          }));
                        }
                      }
                    }}
                    disabled={uploadingImages.has('destaque-0')}
                  />
                  {uploadingImages.has('destaque-0') && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                  )}
                </div>
                {contentData.noticia_destaque.imagem_principal && (
                  <div className="mt-2">
                    <img
                      src={contentData.noticia_destaque.imagem_principal}
                      alt="Preview"
                      className="w-48 h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="destaque-conteudo">Conteúdo</Label>
                <Textarea
                  id="destaque-conteudo"
                  value={contentData.noticia_destaque.conteudo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    noticia_destaque: { ...prev.noticia_destaque, conteudo: e.target.value }
                  }))}
                  placeholder="Conteúdo da notícia (pode incluir links para outras páginas do site)"
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Você pode incluir formatação e links para outras notícias ou páginas do site.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outras Notícias */}
        <TabsContent value="outras">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outras Notícias</CardTitle>
                  <CardDescription>
                    Gerencie a lista de notícias secundárias que aparecerão na página.
                  </CardDescription>
                </div>
                <Button onClick={addNoticia}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Notícia
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {contentData.outras_noticias.map((noticia, index) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`noticia-titulo-${index}`}>Título da Notícia</Label>
                      <Input
                        id={`noticia-titulo-${index}`}
                        value={noticia.titulo_noticia}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          outras_noticias: prev.outras_noticias.map((n, i) =>
                            i === index ? { ...n, titulo_noticia: e.target.value } : n
                          )
                        }))}
                        placeholder="Título da notícia"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`noticia-data-${index}`}>Data da Publicação</Label>
                      <Input
                        id={`noticia-data-${index}`}
                        type="date"
                        value={noticia.data_publicacao}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          outras_noticias: prev.outras_noticias.map((n, i) =>
                            i === index ? { ...n, data_publicacao: e.target.value } : n
                          )
                        }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`noticia-autor-${index}`}>Autor</Label>
                    <Input
                      id={`noticia-autor-${index}`}
                      value={noticia.autor}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        outras_noticias: prev.outras_noticias.map((n, i) =>
                          i === index ? { ...n, autor: e.target.value } : n
                        )
                      }))}
                      placeholder="Nome do autor"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`noticia-tipo-midia-${index}`}>Tipo de Mídia</Label>
                    <Select
                      value={noticia.tipo_midia}
                      onValueChange={(value: 'imagem' | 'video') => setContentData(prev => ({
                        ...prev,
                        outras_noticias: prev.outras_noticias.map((n, i) =>
                          i === index ? { ...n, tipo_midia: value, link_video: value === 'imagem' ? undefined : n.link_video } : n
                        )
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de mídia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imagem">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {noticia.tipo_midia === 'imagem' ? (
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
                                  outras_noticias: prev.outras_noticias.map((n, i) =>
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
                  ) : (
                    <div>
                      <Label htmlFor={`noticia-video-${index}`}>Link de Vídeo (YouTube)</Label>
                      <Input
                        id={`noticia-video-${index}`}
                        type="url"
                        value={noticia.link_video || ''}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          outras_noticias: prev.outras_noticias.map((n, i) =>
                            i === index ? { ...n, link_video: e.target.value } : n
                          )
                        }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`noticia-resumo-${index}`}>Resumo da Notícia</Label>
                    <Textarea
                      id={`noticia-resumo-${index}`}
                      value={noticia.resumo_noticia}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        outras_noticias: prev.outras_noticias.map((n, i) =>
                          i === index ? { ...n, resumo_noticia: e.target.value } : n
                        )
                      }))}
                      placeholder="Resumo da notícia"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`noticia-conteudo-${index}`}>Conteúdo Completo</Label>
                    <Textarea
                      id={`noticia-conteudo-${index}`}
                      value={noticia.conteudo_completo}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        outras_noticias: prev.outras_noticias.map((n, i) =>
                          i === index ? { ...n, conteudo_completo: e.target.value } : n
                        )
                      }))}
                      placeholder="Conteúdo detalhado da notícia"
                      rows={6}
                      required
                    />
                  </div>
                </div>
              ))}

              {contentData.outras_noticias.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notícia adicionada ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Notícia" para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Newsletter */}
        <TabsContent value="newsletter">
          <Card>
            <CardHeader>
              <CardTitle>Receba Nossas Notícias</CardTitle>
              <CardDescription>
                Configure o conteúdo da seção de newsletter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newsletter-titulo">Título Principal</Label>
                <Input
                  id="newsletter-titulo"
                  value={contentData.receba_noticias.titulo_principal}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    receba_noticias: { ...prev.receba_noticias, titulo_principal: e.target.value }
                  }))}
                  placeholder="Ex: Receba Nossas Notícias"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="newsletter-subtitulo">Subtítulo</Label>
                <Textarea
                  id="newsletter-subtitulo"
                  value={contentData.receba_noticias.subtitulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    receba_noticias: { ...prev.receba_noticias, subtitulo: e.target.value }
                  }))}
                  placeholder="Descrição da newsletter"
                  rows={3}
                  maxLength={500}
                />
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

export default NoticiasContentEdit;