
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      
      // Gerar número único da carteira
      const numeroCarteira = `COMADEMIG-${Date.now()}`;
      
      // Gerar QR Code (URL que aponta para validação pública)
      const qrCodeUrl = `${window.location.origin}/validar-carteira/${numeroCarteira}`;
      
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
      const numeroCarteira = `COMADEMIG-${Date.now()}`;
      const qrCodeUrl = `${window.location.origin}/validar-carteira/${numeroCarteira}`;
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

  return {
    carteira: carteira as CarteiraDigital | null,
    profile,
    isLoading,
    error,
    gerarCarteira,
    renovarCarteira,
    atualizarFoto,
    refetch
  };
};
