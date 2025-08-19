
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CertificadoEvento {
  id: string;
  numero_certificado: string;
  data_emissao: string;
  qr_code: string;
  status: string;
  eventos: {
    titulo: string;
    data_inicio: string;
    data_fim: string;
    local?: string;
    carga_horaria?: number;
  };
}

interface CertificadoValidacao {
  id: string;
  numero_certificado: string;
  data_emissao: string;
  qr_code: string;
  status: string;
  user_id: string;
  eventos: {
    titulo: string;
    data_inicio: string;
    data_fim: string;
    local?: string;
    carga_horaria?: number;
  };
  profiles: {
    nome_completo: string;
  };
}

export const useCertificadosEventos = () => {
  const { user } = useAuth();

  const { data: meusCertificados, isLoading, refetch } = useSupabaseQuery(
    ['certificados', user?.id],
    async (): Promise<CertificadoEvento[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('certificados_eventos')
        .select(`
          *,
          eventos (
            titulo,
            data_inicio,
            data_fim,
            local,
            carga_horaria
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'emitido')
        .order('data_emissao', { ascending: false });
      
      if (error) throw error;
      return data as CertificadoEvento[];
    },
    { enabled: !!user }
  );

  const validarCertificado = async (numeroCertificado: string): Promise<CertificadoValidacao> => {
    // First get the certificate data
    const { data: certificadoData, error: certificadoError } = await supabase
      .from('certificados_eventos')
      .select(`
        *,
        eventos (
          titulo,
          data_inicio,
          data_fim,
          local,
          carga_horaria
        )
      `)
      .eq('numero_certificado', numeroCertificado)
      .eq('status', 'emitido')
      .single();
    
    if (certificadoError) throw certificadoError;
    
    // Then get the profile data using the user_id from the certificate
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('nome_completo')
      .eq('id', certificadoData.user_id)
      .single();
    
    if (profileError) throw profileError;
    
    // Validate that we have all required data
    if (!profileData?.nome_completo) {
      throw new Error('Dados do certificado incompletos');
    }
    
    // Combine the data
    const result: CertificadoValidacao = {
      ...certificadoData,
      profiles: profileData
    };
    
    return result;
  };

  const gerarCertificado = useSupabaseMutation(
    async (eventoId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Verificar se já existe certificado para este evento
      const { data: existente } = await supabase
        .from('certificados_eventos')
        .select('id')
        .eq('user_id', user.id)
        .eq('evento_id', eventoId)
        .single();
      
      if (existente) {
        throw new Error('Certificado já foi emitido para este evento');
      }
      
      // Gerar número único do certificado
      const numeroCertificado = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const qrCode = `https://comademig.org/validar-certificado/${numeroCertificado}`;
      
      const { data, error } = await supabase
        .from('certificados_eventos')
        .insert({
          user_id: user.id,
          evento_id: eventoId,
          numero_certificado: numeroCertificado,
          qr_code: qrCode,
          status: 'emitido'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Certificado gerado com sucesso!',
      errorMessage: 'Erro ao gerar certificado',
      onSuccess: () => {
        refetch();
      }
    }
  );

  return {
    meusCertificados: (meusCertificados || []) as CertificadoEvento[],
    isLoading,
    validarCertificado,
    gerarCertificado,
    refetch
  };
};
