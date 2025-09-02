import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Users, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Lider {
  foto: string;
  nome: string;
  cargo: string;
  biografia: string;
  email: string;
  telefone: string;
}

interface CampoRegional {
  nome: string;
  descricao: string;
  responsavel: string;
  links: string[];
}

interface PresidenciaSection {
  titulo: string;
  lider: Lider;
}

interface DiretoriaSection {
  titulo: string;
  membros: Lider[];
}

interface ConselhoSection {
  titulo: string;
  membros: Lider[];
}

interface CamposRegionaisSection {
  titulo: string;
  campos: CampoRegional[];
}

interface LiderancaContentData {
  presidencia: PresidenciaSection;
  diretoria_executiva: DiretoriaSection;
  conselho_administrativo: ConselhoSection;
  campos_regionais: CamposRegionaisSection;
}

const LiderancaContentEdit = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contentData, setContentData] = useState<LiderancaContentData>({
    presidencia: {
      titulo: 'Presidência',
      lider: {
        foto: '',
        nome: '',
        cargo: '',
        biografia: '',
        email: '',
        telefone: ''
      }
    },
    diretoria_executiva: {
      titulo: 'Diretoria Executiva',
      membros: []
    },
    conselho_administrativo: {
      titulo: 'Conselho Administrativo',
      membros: []
    },
    campos_regionais: {
      titulo: 'Campos Regionais',
      campos: []
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
        .eq('page_name', 'leadership')
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
          page_name: 'leadership',
          content_json: contentData as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo da página Liderança salvo com sucesso!",
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
      const fileName = `lideranca/${section}/${Date.now()}.${fileExt}`;

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

  const addMembroDiretoria = () => {
    setContentData(prev => ({
      ...prev,
      diretoria_executiva: {
        ...prev.diretoria_executiva,
        membros: [
          ...prev.diretoria_executiva.membros,
          {
            foto: '',
            nome: '',
            cargo: '',
            biografia: '',
            email: '',
            telefone: ''
          }
        ]
      }
    }));
  };

  const removeMembroDiretoria = (index: number) => {
    setContentData(prev => ({
      ...prev,
      diretoria_executiva: {
        ...prev.diretoria_executiva,
        membros: prev.diretoria_executiva.membros.filter((_, i) => i !== index)
      }
    }));
  };

  const addMembroConselho = () => {
    setContentData(prev => ({
      ...prev,
      conselho_administrativo: {
        ...prev.conselho_administrativo,
        membros: [
          ...prev.conselho_administrativo.membros,
          {
            foto: '',
            nome: '',
            cargo: '',
            biografia: '',
            email: '',
            telefone: ''
          }
        ]
      }
    }));
  };

  const removeMembroConselho = (index: number) => {
    setContentData(prev => ({
      ...prev,
      conselho_administrativo: {
        ...prev.conselho_administrativo,
        membros: prev.conselho_administrativo.membros.filter((_, i) => i !== index)
      }
    }));
  };

  const addCampoRegional = () => {
    setContentData(prev => ({
      ...prev,
      campos_regionais: {
        ...prev.campos_regionais,
        campos: [
          ...prev.campos_regionais.campos,
          {
            nome: '',
            descricao: '',
            responsavel: '',
            links: []
          }
        ]
      }
    }));
  };

  const removeCampoRegional = (index: number) => {
    setContentData(prev => ({
      ...prev,
      campos_regionais: {
        ...prev.campos_regionais,
        campos: prev.campos_regionais.campos.filter((_, i) => i !== index)
      }
    }));
  };

  const addLinkToCampo = (campoIndex: number) => {
    setContentData(prev => ({
      ...prev,
      campos_regionais: {
        ...prev.campos_regionais,
        campos: prev.campos_regionais.campos.map((campo, i) =>
          i === campoIndex ? { ...campo, links: [...campo.links, ''] } : campo
        )
      }
    }));
  };

  const removeLinkFromCampo = (campoIndex: number, linkIndex: number) => {
    setContentData(prev => ({
      ...prev,
      campos_regionais: {
        ...prev.campos_regionais,
        campos: prev.campos_regionais.campos.map((campo, i) =>
          i === campoIndex ? { ...campo, links: campo.links.filter((_, li) => li !== linkIndex) } : campo
        )
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
            Editar Página: Liderança
          </h1>
          <p className="text-gray-600 mt-2">
            Configure o conteúdo da página de Liderança
          </p>
        </div>
      </div>

      <Tabs defaultValue="presidencia" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presidencia">Presidência</TabsTrigger>
          <TabsTrigger value="diretoria">Diretoria Executiva</TabsTrigger>
          <TabsTrigger value="conselho">Conselho Administrativo</TabsTrigger>
          <TabsTrigger value="campos">Campos Regionais</TabsTrigger>
        </TabsList>

        {/* Presidência */}
        <TabsContent value="presidencia">
          <Card>
            <CardHeader>
              <CardTitle>Presidência</CardTitle>
              <CardDescription>
                Configure o perfil do presidente da organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="presidencia-foto">Foto do Líder</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="presidencia-foto"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'presidencia');
                        if (url) {
                          setContentData(prev => ({
                            ...prev,
                            presidencia: {
                              ...prev.presidencia,
                              lider: { ...prev.presidencia.lider, foto: url }
                            }
                          }));
                        }
                      }
                    }}
                    disabled={uploadingImages.has('presidencia-0')}
                  />
                  {uploadingImages.has('presidencia-0') && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                  )}
                </div>
                {contentData.presidencia.lider.foto && (
                  <div className="mt-2">
                    <img
                      src={contentData.presidencia.lider.foto}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-full border"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presidencia-nome">Nome do Líder</Label>
                  <Input
                    id="presidencia-nome"
                    value={contentData.presidencia.lider.nome}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      presidencia: {
                        ...prev.presidencia,
                        lider: { ...prev.presidencia.lider, nome: e.target.value }
                      }
                    }))}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="presidencia-cargo">Cargo</Label>
                  <Input
                    id="presidencia-cargo"
                    value={contentData.presidencia.lider.cargo}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      presidencia: {
                        ...prev.presidencia,
                        lider: { ...prev.presidencia.lider, cargo: e.target.value }
                      }
                    }))}
                    placeholder="Presidente"
                  />
                </div>

                <div>
                  <Label htmlFor="presidencia-email">Email de Contato</Label>
                  <Input
                    id="presidencia-email"
                    type="email"
                    value={contentData.presidencia.lider.email}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      presidencia: {
                        ...prev.presidencia,
                        lider: { ...prev.presidencia.lider, email: e.target.value }
                      }
                    }))}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="presidencia-telefone">Telefone de Contato</Label>
                  <Input
                    id="presidencia-telefone"
                    value={contentData.presidencia.lider.telefone}
                    onChange={(e) => setContentData(prev => ({
                      ...prev,
                      presidencia: {
                        ...prev.presidencia,
                        lider: { ...prev.presidencia.lider, telefone: e.target.value }
                      }
                    }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="presidencia-biografia">Descrição / Biografia</Label>
                <Textarea
                  id="presidencia-biografia"
                  value={contentData.presidencia.lider.biografia}
                  onChange={(e) => setContentData(prev => ({
                    ...prev,
                    presidencia: {
                      ...prev.presidencia,
                      lider: { ...prev.presidencia.lider, biografia: e.target.value }
                    }
                  }))}
                  placeholder="Biografia do líder"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diretoria Executiva */}
        <TabsContent value="diretoria">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Diretoria Executiva</CardTitle>
                  <CardDescription>
                    Gerencie os membros da diretoria executiva
                  </CardDescription>
                </div>
                <Button onClick={addMembroDiretoria}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {contentData.diretoria_executiva.membros.map((membro, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Membro {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMembroDiretoria(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`diretoria-foto-${index}`}>Foto do Líder</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id={`diretoria-foto-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'diretoria', index);
                            if (url) {
                              setContentData(prev => ({
                                ...prev,
                                diretoria_executiva: {
                                  ...prev.diretoria_executiva,
                                  membros: prev.diretoria_executiva.membros.map((m, i) =>
                                    i === index ? { ...m, foto: url } : m
                                  )
                                }
                              }));
                            }
                          }
                        }}
                        disabled={uploadingImages.has(`diretoria-${index}`)}
                      />
                      {uploadingImages.has(`diretoria-${index}`) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                      )}
                    </div>
                    {membro.foto && (
                      <div className="mt-2">
                        <img
                          src={membro.foto}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-full border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`diretoria-nome-${index}`}>Nome do Líder</Label>
                      <Input
                        id={`diretoria-nome-${index}`}
                        value={membro.nome}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          diretoria_executiva: {
                            ...prev.diretoria_executiva,
                            membros: prev.diretoria_executiva.membros.map((m, i) =>
                              i === index ? { ...m, nome: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="Nome completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`diretoria-cargo-${index}`}>Cargo</Label>
                      <Input
                        id={`diretoria-cargo-${index}`}
                        value={membro.cargo}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          diretoria_executiva: {
                            ...prev.diretoria_executiva,
                            membros: prev.diretoria_executiva.membros.map((m, i) =>
                              i === index ? { ...m, cargo: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="Cargo na diretoria"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`diretoria-email-${index}`}>Email de Contato</Label>
                      <Input
                        id={`diretoria-email-${index}`}
                        type="email"
                        value={membro.email}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          diretoria_executiva: {
                            ...prev.diretoria_executiva,
                            membros: prev.diretoria_executiva.membros.map((m, i) =>
                              i === index ? { ...m, email: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`diretoria-telefone-${index}`}>Telefone de Contato</Label>
                      <Input
                        id={`diretoria-telefone-${index}`}
                        value={membro.telefone}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          diretoria_executiva: {
                            ...prev.diretoria_executiva,
                            membros: prev.diretoria_executiva.membros.map((m, i) =>
                              i === index ? { ...m, telefone: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`diretoria-biografia-${index}`}>Descrição / Biografia</Label>
                    <Textarea
                      id={`diretoria-biografia-${index}`}
                      value={membro.biografia}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        diretoria_executiva: {
                          ...prev.diretoria_executiva,
                          membros: prev.diretoria_executiva.membros.map((m, i) =>
                            i === index ? { ...m, biografia: e.target.value } : m
                          )
                        }
                      }))}
                      placeholder="Biografia do membro"
                      rows={4}
                    />
                  </div>
                </div>
              ))}

              {contentData.diretoria_executiva.membros.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum membro adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Membro" para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conselho Administrativo */}
        <TabsContent value="conselho">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conselho Administrativo</CardTitle>
                  <CardDescription>
                    Gerencie os membros do conselho administrativo
                  </CardDescription>
                </div>
                <Button onClick={addMembroConselho}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {contentData.conselho_administrativo.membros.map((membro, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Membro {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMembroConselho(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`conselho-foto-${index}`}>Foto do Líder</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id={`conselho-foto-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleImageUpload(file, 'conselho', index);
                            if (url) {
                              setContentData(prev => ({
                                ...prev,
                                conselho_administrativo: {
                                  ...prev.conselho_administrativo,
                                  membros: prev.conselho_administrativo.membros.map((m, i) =>
                                    i === index ? { ...m, foto: url } : m
                                  )
                                }
                              }));
                            }
                          }
                        }}
                        disabled={uploadingImages.has(`conselho-${index}`)}
                      />
                      {uploadingImages.has(`conselho-${index}`) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-comademig-blue"></div>
                      )}
                    </div>
                    {membro.foto && (
                      <div className="mt-2">
                        <img
                          src={membro.foto}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-full border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`conselho-nome-${index}`}>Nome do Líder</Label>
                      <Input
                        id={`conselho-nome-${index}`}
                        value={membro.nome}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          conselho_administrativo: {
                            ...prev.conselho_administrativo,
                            membros: prev.conselho_administrativo.membros.map((m, i) =>
                              i === index ? { ...m, nome: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="Nome completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`conselho-cargo-${index}`}>Cargo</Label>
                      <Input
                        id={`conselho-cargo-${index}`}
                        value={membro.cargo}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          conselho_administrativo: {
                            ...prev.conselho_administrativo,
                            membros: prev.conselho_administrativo.membros.map((m, i) =>
                              i === index ? { ...m, cargo: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="Cargo no conselho"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`conselho-email-${index}`}>Email de Contato</Label>
                      <Input
                        id={`conselho-email-${index}`}
                        type="email"
                        value={membro.email}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          conselho_administrativo: {
                            ...prev.conselho_administrativo,
                            membros: prev.conselho_administrativo.membros.map((m, i) =>
                              i === index ? { ...m, email: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`conselho-telefone-${index}`}>Telefone de Contato</Label>
                      <Input
                        id={`conselho-telefone-${index}`}
                        value={membro.telefone}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          conselho_administrativo: {
                            ...prev.conselho_administrativo,
                            membros: prev.conselho_administrativo.membros.map((m, i) =>
                              i === index ? { ...m, telefone: e.target.value } : m
                            )
                          }
                        }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`conselho-biografia-${index}`}>Descrição / Biografia</Label>
                    <Textarea
                      id={`conselho-biografia-${index}`}
                      value={membro.biografia}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        conselho_administrativo: {
                          ...prev.conselho_administrativo,
                          membros: prev.conselho_administrativo.membros.map((m, i) =>
                            i === index ? { ...m, biografia: e.target.value } : m
                          )
                        }
                      }))}
                      placeholder="Biografia do membro"
                      rows={4}
                    />
                  </div>
                </div>
              ))}

              {contentData.conselho_administrativo.membros.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum membro adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Membro" para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campos Regionais */}
        <TabsContent value="campos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campos Regionais</CardTitle>
                  <CardDescription>
                    Gerencie os campos regionais da organização
                  </CardDescription>
                </div>
                <Button onClick={addCampoRegional}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo Regional
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {contentData.campos_regionais.campos.map((campo, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Campo Regional {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCampoRegional(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`campo-nome-${index}`}>Nome do Campo Regional</Label>
                      <Input
                        id={`campo-nome-${index}`}
                        value={campo.nome}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          campos_regionais: {
                            ...prev.campos_regionais,
                            campos: prev.campos_regionais.campos.map((c, i) =>
                              i === index ? { ...c, nome: e.target.value } : c
                            )
                          }
                        }))}
                        placeholder="Nome do campo regional"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`campo-responsavel-${index}`}>Membro Responsável</Label>
                      <Input
                        id={`campo-responsavel-${index}`}
                        value={campo.responsavel}
                        onChange={(e) => setContentData(prev => ({
                          ...prev,
                          campos_regionais: {
                            ...prev.campos_regionais,
                            campos: prev.campos_regionais.campos.map((c, i) =>
                              i === index ? { ...c, responsavel: e.target.value } : c
                            )
                          }
                        }))}
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`campo-descricao-${index}`}>Descrição do Campo</Label>
                    <Textarea
                      id={`campo-descricao-${index}`}
                      value={campo.descricao}
                      onChange={(e) => setContentData(prev => ({
                        ...prev,
                        campos_regionais: {
                          ...prev.campos_regionais,
                          campos: prev.campos_regionais.campos.map((c, i) =>
                            i === index ? { ...c, descricao: e.target.value } : c
                          )
                        }
                      }))}
                      placeholder="Descrição do campo regional"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Links Adicionais</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addLinkToCampo(index)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Link
                      </Button>
                    </div>
                    {campo.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex items-center gap-2">
                        <Input
                          value={link}
                          onChange={(e) => setContentData(prev => ({
                            ...prev,
                            campos_regionais: {
                              ...prev.campos_regionais,
                              campos: prev.campos_regionais.campos.map((c, i) =>
                                i === index ? {
                                  ...c,
                                  links: c.links.map((l, li) => li === linkIndex ? e.target.value : l)
                                } : c
                              )
                            }
                          }))}
                          placeholder="https://exemplo.com"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLinkFromCampo(index, linkIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {contentData.campos_regionais.campos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum campo regional adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Campo Regional" para começar.</p>
                </div>
              )}
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

export default LiderancaContentEdit;