import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Video, Image, Radio } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  titulo: string;
  descricao: string;
  thumbnail: string;
  link: string;
}

interface AlbumFoto {
  titulo: string;
  imagem_capa: string;
  link: string;
}

interface VideosSection {
  titulo: string;
  videos: VideoItem[];
}

interface GaleriaSection {
  titulo: string;
  albuns: AlbumFoto[];
}

interface TransmissaoSection {
  titulo: string;
  titulo_transmissao: string;
  horario: string;
  embed_code: string;
  link_botao: string;
  texto_botao: string;
}

interface MultimidiaContentData {
  videos_section: VideosSection;
  galeria_section: GaleriaSection;
  transmissao_section: TransmissaoSection;
}

const MultimidiaContentEdit = () => {
  const { isAdmin, loading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentData, setContentData] = useState<MultimidiaContentData>({
    videos_section: {
      titulo: 'Vídeos',
      videos: []
    },
    galeria_section: {
      titulo: 'Galeria de Fotos',
      albuns: []
    },
    transmissao_section: {
      titulo: 'Transmissão ao Vivo',
      titulo_transmissao: '',
      horario: '',
      embed_code: '',
      link_botao: '',
      texto_botao: ''
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
        .eq('page_name', 'multimedia')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar conteúdo:', error);
        return;
      }

      if (data?.content_json) {
        const jsonData = data.content_json as any;
        setContentData(prev => ({
          ...prev,
          ...jsonData
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
          page_name: 'multimedia',
          content_json: contentData as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo da página Multimídia salvo com sucesso!",
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
      const fileName = `multimidia/${section}/${Date.now()}.${fileExt}`;

      const { data: buckets } = await supabase.storage.listBuckets();
      const contentBucket = buckets?.find(bucket => bucket.name === 'content-images');

      if (!contentBucket) {
        const { error: bucketError } = await supabase.storage.createBucket('content-images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760
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

  const addVideo = () => {
    setContentData(prev => ({
      ...prev,
      videos_section: {
        ...prev.videos_section,
        videos: [
          ...prev.videos_section.videos,
          {
            titulo: '',
            descricao: '',
            thumbnail: '',
            link: ''
          }
        ]
      }
    }));
  };

  const removeVideo = (index: number) => {
    setContentData(prev => ({
      ...prev,
      videos_section: {
        ...prev.videos_section,
        videos: prev.videos_section.videos.filter((_, i) => i !== index)
      }
    }));
  };

  const addAlbum = () => {
    setContentData(prev => ({
      ...prev,
      galeria_section: {
        ...prev.galeria_section,
        albuns: [
          ...prev.galeria_section.albuns,
          {
            titulo: '',
            imagem_capa: '',
            link: ''
          }
        ]
      }
    }));
  };

  const removeAlbum = (index: number) => {
    setContentData(prev => ({
      ...prev,
      galeria_section: {
        ...prev.galeria_section,
        albuns: prev.galeria_section.albuns.filter((_, i) => i !== index)
      }
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
            Editar Página: Multimídia
          </h1>
          <p className="text-gray-600 mt-2">
            Configure o conteúdo da página de Multimídia
          </p>
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="galeria">Galeria de Fotos</TabsTrigger>
          <TabsTrigger value="transmissao">Transmissão ao Vivo</TabsTrigger>
        </TabsList>

        {/* Seção Vídeos */}
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vídeos</CardTitle>
                  <CardDescription>
                    Gerencie a lista de vídeos da página
                  </CardDescription>
                </div>
                <Button onClick={addVideo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="videos-titulo">Título da Seção</Label>
                <Input
                  id="videos-titulo"
                  value={contentData.videos_section.titulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    videos_section: { ...prev.videos_section, titulo: e.target.value }
                  }))}
                  placeholder="Vídeos"
                />
              </div>

              {contentData.videos_section.videos.map((video, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Vídeo {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVideo(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`video-titulo-${index}`}>Título do Vídeo</Label>
                      <Input
                        id={`video-titulo-${index}`}
                        value={video.titulo}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          videos_section: {
                            ...prev.videos_section,
                            videos: prev.videos_section.videos.map((v, i) =>
                              i === index ? { ...v, titulo: e.target.value } : v
                            )
                          }
                        }))}
                        placeholder="Título do vídeo"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`video-link-${index}`}>Link do Vídeo</Label>
                      <Input
                        id={`video-link-${index}`}
                        value={video.link}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          videos_section: {
                            ...prev.videos_section,
                            videos: prev.videos_section.videos.map((v, i) =>
                              i === index ? { ...v, link: e.target.value } : v
                            )
                          }
                        }))}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`video-descricao-${index}`}>Descrição do Vídeo</Label>
                    <Textarea
                      id={`video-descricao-${index}`}
                      value={video.descricao}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        videos_section: {
                          ...prev.videos_section,
                          videos: prev.videos_section.videos.map((v, i) =>
                            i === index ? { ...v, descricao: e.target.value } : v
                          )
                        }
                      }))}
                      placeholder="Descrição do vídeo"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`video-thumbnail-${index}`}>Thumbnail do Vídeo</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id={`video-thumbnail-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'videos', index);
                            if (url) {
                              setContentData(prev => ({
                                ...prev,
                                videos_section: {
                                  ...prev.videos_section,
                                  videos: prev.videos_section.videos.map((v, i) =>
                                    i === index ? { ...v, thumbnail: url } : v
                                  )
                                }
                              }));
                            }
                          }
                        }}
                        disabled={uploadingImages.has(`videos-${index}`)}
                      />
                      {uploadingImages.has(`videos-${index}`) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                      )}
                    </div>
                    {video.thumbnail && (
                      <div className="mt-2">
                        <img
                          src={video.thumbnail}
                          alt="Preview"
                          className="w-48 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {contentData.videos_section.videos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum vídeo adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Vídeo" para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seção Galeria de Fotos */}
        <TabsContent value="galeria">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Galeria de Fotos</CardTitle>
                  <CardDescription>
                    Gerencie os álbuns de fotos da página
                  </CardDescription>
                </div>
                <Button onClick={addAlbum}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Álbum
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="galeria-titulo">Título da Seção</Label>
                <Input
                  id="galeria-titulo"
                  value={contentData.galeria_section.titulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    galeria_section: { ...prev.galeria_section, titulo: e.target.value }
                  }))}
                  placeholder="Galeria de Fotos"
                />
              </div>

              {contentData.galeria_section.albuns.map((album, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Álbum {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAlbum(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`album-titulo-${index}`}>Título do Álbum</Label>
                      <Input
                        id={`album-titulo-${index}`}
                        value={album.titulo}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          galeria_section: {
                            ...prev.galeria_section,
                            albuns: prev.galeria_section.albuns.map((a, i) =>
                              i === index ? { ...a, titulo: e.target.value } : a
                            )
                          }
                        }))}
                        placeholder="Título do álbum"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`album-link-${index}`}>Link do Álbum</Label>
                      <Input
                        id={`album-link-${index}`}
                        value={album.link}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          galeria_section: {
                            ...prev.galeria_section,
                            albuns: prev.galeria_section.albuns.map((a, i) =>
                              i === index ? { ...a, link: e.target.value } : a
                            )
                          }
                        }))}
                        placeholder="https://photos.google.com/..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`album-capa-${index}`}>Imagem de Capa</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id={`album-capa-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'galeria', index);
                            if (url) {
                              setContentData(prev => ({
                                ...prev,
                                galeria_section: {
                                  ...prev.galeria_section,
                                  albuns: prev.galeria_section.albuns.map((a, i) =>
                                    i === index ? { ...a, imagem_capa: url } : a
                                  )
                                }
                              }));
                            }
                          }
                        }}
                        disabled={uploadingImages.has(`galeria-${index}`)}
                      />
                      {uploadingImages.has(`galeria-${index}`) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                      )}
                    </div>
                    {album.imagem_capa && (
                      <div className="mt-2">
                        <img
                          src={album.imagem_capa}
                          alt="Preview"
                          className="w-48 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {contentData.galeria_section.albuns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum álbum adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Álbum" para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seção Transmissão ao Vivo */}
        <TabsContent value="transmissao">
          <Card>
            <CardHeader>
              <CardTitle>Transmissão ao Vivo</CardTitle>
              <CardDescription>
                Configure a seção de transmissão ao vivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transmissao-titulo">Título da Seção</Label>
                <Input
                  id="transmissao-titulo"
                  value={contentData.transmissao_section.titulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    transmissao_section: { ...prev.transmissao_section, titulo: e.target.value }
                  }))}
                  placeholder="Transmissão ao Vivo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transmissao-titulo-evento">Título da Transmissão</Label>
                  <Input
                    id="transmissao-titulo-evento"
                    value={contentData.transmissao_section.titulo_transmissao}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      transmissao_section: { ...prev.transmissao_section, titulo_transmissao: e.target.value }
                    }))}
                    placeholder="Nome do evento ou transmissão"
                  />
                </div>

                <div>
                  <Label htmlFor="transmissao-horario">Horário da Transmissão</Label>
                  <Input
                    id="transmissao-horario"
                    value={contentData.transmissao_section.horario}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      transmissao_section: { ...prev.transmissao_section, horario: e.target.value }
                    }))}
                    placeholder="Ex: Domingos às 19:00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="transmissao-embed">Link de Incorporação (Embed)</Label>
                <Textarea
                  id="transmissao-embed"
                  value={contentData.transmissao_section.embed_code}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    transmissao_section: { ...prev.transmissao_section, embed_code: e.target.value }
                  }))}
                  placeholder="Cole aqui o código de incorporação da plataforma de streaming (ex: YouTube, Facebook Live)"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transmissao-link-botao">Link do Botão</Label>
                  <Input
                    id="transmissao-link-botao"
                    value={contentData.transmissao_section.link_botao}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      transmissao_section: { ...prev.transmissao_section, link_botao: e.target.value }
                    }))}
                    placeholder="https://youtube.com/live/..."
                  />
                </div>

                <div>
                  <Label htmlFor="transmissao-texto-botao">Texto do Botão</Label>
                  <Input
                    id="transmissao-texto-botao"
                    value={contentData.transmissao_section.texto_botao}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      transmissao_section: { ...prev.transmissao_section, texto_botao: e.target.value }
                    }))}
                    placeholder="Assistir ao Vivo"
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

export default MultimidiaContentEdit;