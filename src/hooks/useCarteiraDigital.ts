
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/hooks/useAuthState';

interface CarteiraDigital {
  id: string;
  user_id: string;
  numero_carteira: string;
  qr_code: string;
  data_emissao: string;
  data_validade: string;
  status: 'ativa' | 'expirada' | 'suspensa';
  foto_url?: string;
  created_at: string;
  updated_at: string;
}

export const useCarteiraDigital = () => {
  const { user } = useAuth();

  const { data: carteira, isLoading, error, refetch } = useSupabaseQuery(
    ['carteira-digital', user?.id],
    async () => {
      if (!user) return null;
      
      const { data, error } = await (supabase as any)
        .from('carteira_digital')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ativa')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    { enabled: !!user }
  );

  const { data: profile } = useSupabaseQuery(
    ['profile', user?.id],
    async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  const gerarCarteira = useSupabaseMutation(
    async () => {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Verificar se o usuário já possui uma carteira ativa
      const { data: carteiraExistente } = await (supabase as any)
        .from('carteira_digital')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'ativa')
        .maybeSingle();
      
      if (carteiraExistente) {
        throw new Error('Usuário já possui uma carteira digital ativa');
      }
      
      // Gerar número único da carteira com timestamp mais preciso
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const numeroCarteira = `COMADEMIG-${timestamp}-${randomSuffix}`;
      
      // Gerar QR Code (URL que aponta para validação pública)
      const baseUrl = window.location.origin;
      const qrCodeUrl = `${baseUrl}/validar-carteira/${numeroCarteira}`;
      
      // Data de validade (1 ano a partir da emissão)
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);
      
      const { data, error } = await (supabase as any)
        .from('carteira_digital')
        .insert({
          user_id: user.id,
          numero_carteira: numeroCarteira,
          qr_code: qrCodeUrl,
          data_validade: dataValidade.toISOString(),
          status: 'ativa'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Carteira digital gerada com sucesso!',
      errorMessage: 'Erro ao gerar carteira digital',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const renovarCarteira = useSupabaseMutation(
    async () => {
      if (!user || !carteira) throw new Error('Dados inválidos');
      
      // Marcar carteira atual como expirada
      await (supabase as any)
        .from('carteira_digital')
        .update({ status: 'expirada' })
        .eq('id', (carteira as CarteiraDigital).id);
      
      // Gerar nova carteira
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const numeroCarteira = `COMADEMIG-${timestamp}-${randomSuffix}`;
      
      const baseUrl = window.location.origin;
      const qrCodeUrl = `${baseUrl}/validar-carteira/${numeroCarteira}`;
      
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);
      
      const { data, error } = await (supabase as any)
        .from('carteira_digital')
        .insert({
          user_id: user.id,
          numero_carteira: numeroCarteira,
          qr_code: qrCodeUrl,
          data_validade: dataValidade.toISOString(),
          status: 'ativa',
          // Manter a foto da carteira anterior se existir
          foto_url: (carteira as CarteiraDigital).foto_url
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Carteira renovada com sucesso!',
      errorMessage: 'Erro ao renovar carteira',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const atualizarFoto = useSupabaseMutation(
    async (fotoUrl: string) => {
      if (!user || !carteira) throw new Error('Dados inválidos');
      
      const { data, error } = await (supabase as any)
        .from('carteira_digital')
        .update({ foto_url: fotoUrl })
        .eq('id', (carteira as CarteiraDigital).id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Foto atualizada com sucesso!',
      errorMessage: 'Erro ao atualizar foto',
      onSuccess: () => {
        refetch();
      }
    }
  );

  const uploadFoto = useSupabaseMutation(
    async (file: File) => {
      if (!user || !carteira) throw new Error('Dados inválidos');
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('carteiras')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('carteiras')
        .getPublicUrl(uploadData.path);
      
      // Atualizar carteira com nova foto
      const { data, error } = await (supabase as any)
        .from('carteira_digital')
        .update({ foto_url: publicUrl })
        .eq('id', (carteira as CarteiraDigital).id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Foto uploaded com sucesso!',
      errorMessage: 'Erro ao fazer upload da foto',
      onSuccess: () => {
        refetch();
      }
    }
  );

  // Função helper para verificar se o usuário pode gerar carteira
  const podeGerarCarteira = () => {
    if (!profile) return false;
    
    // Verificar se o perfil está completo o suficiente
    const profileTyped = profile as Profile;
    const profileCompleto = profileTyped.nome_completo && 
                           profileTyped.status === 'ativo' && 
                           profileTyped.tipo_membro;
    
    return profileCompleto && !carteira;
  };

  return {
    carteira: carteira as CarteiraDigital | null,
    profile: profile as Profile | null,
    isLoading,
    error,
    gerarCarteira,
    renovarCarteira,
    atualizarFoto,
    uploadFoto,
    podeGerarCarteira,
    refetch
  };
};
