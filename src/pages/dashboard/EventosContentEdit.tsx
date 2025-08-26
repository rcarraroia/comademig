import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Upload, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BannerSection {
  titulo_principal: string;
  subtitulo: string;
}

interface Evento {
  titulo: string;
  subtitulo: string;
  data_inicio: string;
  data_fim: string;
  horario: string;
  local: string;
  vagas_disponiveis: number;
  preco: number;
  imagem: string;
  conteudo: string;
}

interface ProximosEventosSection {
  titulo: string;
  eventos: Evento[];
}

interface NaoPercaSection {
  titulo_principal: string;
  subtitulo: string;
}

interface EventosContentData {
  banner_section: BannerSection;
  proximos_eventos: ProximosEventosSection;
  nao_perca_section: NaoPercaSection;
}

const EventosContentEdit = () => {
  const { isAdmin, loading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentData, setContentData] = useState<EventosContentData>({
    banner_section: {
      titulo_principal: '',
      subtitulo: ''
    },
    proximos_eventos: {
      titulo: '',
      eventos: []
    },
    nao_perca_section: {
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
        .eq('page_name', 'events')
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
          page_name: 'events',
          content_json: contentData as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo da página Eventos salvo com sucesso!",
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
      const fileName = `eventos/${section}/${Date.now()}.${fileExt}`;

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

  const addEvento = () => {
    setContentData(prev => ({
      ...prev,
      proximos_eventos: {
        ...prev.proximos_eventos,
        eventos: [
          ...prev.proximos_eventos.eventos,
          {
            titulo: '',
            subtitulo: '',
            data_inicio: '',
            data_fim: '',
            horario: '',
            local: '',
            vagas_disponiveis: 0,
            preco: 0,
            imagem: '',
            conteudo: ''
          }
        ]
      }
    }));
  };

  const removeEvento = (index: number) => {
    setContentData(prev => ({
      ...prev,
      proximos_eventos: {
        ...prev.proximos_eventos,
        eventos: prev.proximos_eventos.eventos.filter((_, i) => i !== index)
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
            Editar Página: Eventos
          </h1>
          <p className="text-gray-600 mt-2">
            Configure o conteúdo da página de Eventos
          </p>
        </div>
      </div>

      <Tabs defaultValue="banner" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banner">Banner Principal</TabsTrigger>
          <TabsTrigger value="proximos-eventos">Próximos Eventos</TabsTrigger>
          <TabsTrigger value="nao-perca">Não Perca Nenhum Evento</TabsTrigger>
        </TabsList>

        {/* Banner Principal */}
        <TabsContent value="banner">
          <Card>
            <CardHeader>
              <CardTitle>Banner Principal</CardTitle>
              <CardDescription>
                Configure o banner principal da página de Eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="banner-titulo">Título Principal</Label>
                <Input
                  id="banner-titulo"
                  value={contentData.banner_section.titulo_principal}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    banner_section: { ...prev.banner_section, titulo_principal: e.target.value }
                  }))}
                  placeholder="Eventos"
                />
              </div>

              <div>
                <Label htmlFor="banner-subtitulo">Subtítulo</Label>
                <Textarea
                  id="banner-subtitulo"
                  value={contentData.banner_section.subtitulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    banner_section: { ...prev.banner_section, subtitulo: e.target.value }
                  }))}
                  placeholder="Subtítulo do banner"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Próximos Eventos */}
        <TabsContent value="proximos-eventos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Próximos Eventos</CardTitle>
                  <CardDescription>
                    Gerencie a lista de próximos eventos
                  </CardDescription>
                </div>
                <Button onClick={addEvento}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Evento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="proximos-titulo">Título da Seção</Label>
                <Input
                  id="proximos-titulo"
                  value={contentData.proximos_eventos.titulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    proximos_eventos: { ...prev.proximos_eventos, titulo: e.target.value }
                  }))}
                  placeholder="Próximos Eventos"
                />
              </div>

              {contentData.proximos_eventos.eventos.map((evento, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Evento {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEvento(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`evento-titulo-${index}`}>Título do Evento</Label>
                      <Input
                        id={`evento-titulo-${index}`}
                        value={evento.titulo}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, titulo: e.target.value } : ev
                            )
                          }
                        }))}
                        placeholder="Título do evento"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-subtitulo-${index}`}>Subtítulo do Evento</Label>
                      <Input
                        id={`evento-subtitulo-${index}`}
                        value={evento.subtitulo}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, subtitulo: e.target.value } : ev
                            )
                          }
                        }))}
                        placeholder="Subtítulo do evento"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-data-inicio-${index}`}>Data de Início</Label>
                      <Input
                        id={`evento-data-inicio-${index}`}
                        type="date"
                        value={evento.data_inicio}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, data_inicio: e.target.value } : ev
                            )
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-data-fim-${index}`}>Data de Fim</Label>
                      <Input
                        id={`evento-data-fim-${index}`}
                        type="date"
                        value={evento.data_fim}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, data_fim: e.target.value } : ev
                            )
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-horario-${index}`}>Horário</Label>
                      <Input
                        id={`evento-horario-${index}`}
                        value={evento.horario}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, horario: e.target.value } : ev
                            )
                          }
                        }))}
                        placeholder="Ex: 14:00 às 18:00"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-local-${index}`}>Local</Label>
                      <Input
                        id={`evento-local-${index}`}
                        value={evento.local}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, local: e.target.value } : ev
                            )
                          }
                        }))}
                        placeholder="Local do evento"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-vagas-${index}`}>Vagas Disponíveis</Label>
                      <Input
                        id={`evento-vagas-${index}`}
                        type="number"
                        value={evento.vagas_disponiveis}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, vagas_disponiveis: parseInt(e.target.value) || 0 } : ev
                            )
                          }
                        }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`evento-preco-${index}`}>Preço (R$)</Label>
                      <Input
                        id={`evento-preco-${index}`}
                        type="number"
                        step="0.01"
                        value={evento.preco}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          proximos_eventos: {
                            ...prev.proximos_eventos,
                            eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                              i === index ? { ...ev, preco: parseFloat(e.target.value) || 0 } : ev
                            )
                          }
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`evento-imagem-${index}`}>Imagem do Evento</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id={`evento-imagem-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'eventos', index);
                            if (url) {
                              setContentData(prev => ({
                                ...prev,
                                proximos_eventos: {
                                  ...prev.proximos_eventos,
                                  eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                                    i === index ? { ...ev, imagem: url } : ev
                                  )
                                }
                              }));
                            }
                          }
                        }}
                        disabled={uploadingImages.has(`eventos-${index}`)}
                      />
                      {uploadingImages.has(`eventos-${index}`) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                      )}
                    </div>
                    {evento.imagem && (
                      <div className="mt-2">
                        <img
                          src={evento.imagem}
                          alt="Preview"
                          className="w-48 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`evento-conteudo-${index}`}>Conteúdo/Descrição</Label>
                    <Textarea
                      id={`evento-conteudo-${index}`}
                      value={evento.conteudo}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        proximos_eventos: {
                          ...prev.proximos_eventos,
                          eventos: prev.proximos_eventos.eventos.map((ev, i) =>
                            i === index ? { ...ev, conteudo: e.target.value } : ev
                          )
                        }
                      }))}
                      placeholder="Descrição detalhada do evento"
                      rows={4}
                    />
                  </div>
                </div>
              ))}

              {contentData.proximos_eventos.eventos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Evento" para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Não Perca Nenhum Evento */}
        <TabsContent value="nao-perca">
          <Card>
            <CardHeader>
              <CardTitle>Não Perca Nenhum Evento</CardTitle>
              <CardDescription>
                Configure a seção de chamada para ação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nao-perca-titulo">Título Principal</Label>
                <Input
                  id="nao-perca-titulo"
                  value={contentData.nao_perca_section.titulo_principal}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    nao_perca_section: { ...prev.nao_perca_section, titulo_principal: e.target.value }
                  }))}
                  placeholder="Não Perca Nenhum Evento"
                />
              </div>

              <div>
                <Label htmlFor="nao-perca-subtitulo">Subtítulo</Label>
                <Textarea
                  id="nao-perca-subtitulo"
                  value={contentData.nao_perca_section.subtitulo}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    nao_perca_section: { ...prev.nao_perca_section, subtitulo: e.target.value }
                  }))}
                  placeholder="Subtítulo da seção"
                  rows={3}
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

export default EventosContentEdit;