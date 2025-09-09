import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  MapPin, 
  Church, 
  Calendar, 
  Phone, 
  Mail, 
  ArrowLeft,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';

interface PublicProfile {
  id: string;
  nome_completo: string;
  foto_url?: string;
  igreja?: string;
  cargo?: string;
  cidade?: string;
  estado?: string;
  data_ordenacao?: string;
  telefone?: string;
  email?: string;
  bio?: string;
  show_contact?: boolean;
  show_ministry?: boolean;
  created_at: string;
}

export default function PerfilPublico() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadPublicProfile();
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      
      // Se não há userId, mostrar perfil do usuário atual
      const targetUserId = userId || user?.id;
      
      console.log('Carregando perfil para userId:', targetUserId);
      console.log('URL userId:', userId);
      console.log('Current user id:', user?.id);
      
      if (!targetUserId) {
        console.log('Nenhum userId encontrado, redirecionando...');
        navigate('/dashboard');
        return;
      }

      setIsOwnProfile(targetUserId === user?.id);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nome_completo,
          foto_url,
          igreja,
          cargo,
          cidade,
          estado,
          data_ordenacao,
          telefone,
          bio,
          show_contact,
          show_ministry,
          created_at
        `)
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Erro na query:', error);
        throw error;
      }

      if (data) {
        console.log('Dados encontrados:', data);
        
        // Buscar email separadamente se for o próprio usuário
        let email = '';
        if (isOwnProfile && user?.email) {
          email = user.email;
        }
        
        setPublicProfile({
          ...data,
          email: email
        });
      } else {
        console.log('Nenhum dado encontrado para o usuário:', targetUserId);
      }

    } catch (error: any) {
      console.error('Erro ao carregar perfil público:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/perfil-publico/${publicProfile?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${publicProfile?.nome_completo}`,
          text: `Conheça o perfil de ${publicProfile?.nome_completo} na COMADEMIG`,
          url: url,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link do perfil foi copiado para a área de transferência",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!publicProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
        <p className="text-gray-600 mb-4">Este perfil não existe ou não está disponível publicamente.</p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex gap-2">
          {isOwnProfile && (
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/perfil')}
            >
              Editar Perfil
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={publicProfile.foto_url} />
                <AvatarFallback className="bg-comademig-blue text-white text-2xl">
                  {getInitials(publicProfile.nome_completo)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-comademig-blue mb-2">
                  {publicProfile.nome_completo}
                </h1>
                
                {publicProfile.cargo && (
                  <p className="text-lg text-gray-600 mb-2">{publicProfile.cargo}</p>
                )}
                
                <Badge className="mb-4">Membro COMADEMIG</Badge>
                
                <p className="text-sm text-gray-500">
                  Membro desde {formatDate(publicProfile.created_at)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-6">
              {/* Bio */}
              {publicProfile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Sobre</h3>
                  <p className="text-gray-700">{publicProfile.bio}</p>
                </div>
              )}

              {/* Ministry Info */}
              {publicProfile.show_ministry && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Church className="h-4 w-4" />
                    Informações Ministeriais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicProfile.igreja && (
                      <div>
                        <p className="text-sm text-gray-600">Igreja Local</p>
                        <p className="font-medium">{publicProfile.igreja}</p>
                      </div>
                    )}
                    
                    {publicProfile.data_ordenacao && (
                      <div>
                        <p className="text-sm text-gray-600">Data de Ordenação</p>
                        <p className="font-medium">{formatDate(publicProfile.data_ordenacao)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {(publicProfile.cidade || publicProfile.estado) && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </h3>
                  <p className="text-gray-700">
                    {[publicProfile.cidade, publicProfile.estado].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Contact Info */}
              {publicProfile.show_contact && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contato
                  </h3>
                  <div className="space-y-2">
                    {publicProfile.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{publicProfile.telefone}</span>
                      </div>
                    )}
                    
                    {publicProfile.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{publicProfile.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Perfil Público</h4>
              <p className="text-sm text-blue-700">
                Este perfil é visível para outros membros da COMADEMIG. 
                {isOwnProfile && (
                  <span className="block mt-1">
                    Você pode ajustar suas configurações de privacidade nas configurações do perfil.
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}