
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCertificadosEventos = () => {
  const { user } = useAuth();

  const { data: meusCertificados, isLoading, refetch } = useSupabaseQuery(
    ['certificados', user?.id],
    async () => {
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
      return data;
    },
    { enabled: !!user }
  );

  const validarCertificado = useSupabaseQuery(
    ['validar_certificado'],
    async (numeroCertificado: string) => {
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
          ),
          profiles (
            nome_completo
          )
        `)
        .eq('numero_certificado', numeroCertificado)
        .eq('status', 'emitido')
        .single();
      
      if (error) throw error;
      return data;
    },
    { enabled: false }
  );

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
    meusCertificados,
    isLoading,
    validarCertificado,
    gerarCertificado,
    refetch
  };
};
