import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DadosFiliacao {
  nome_completo: string;
  email: string;
  cpf: string;
  telefone: string;
  data_nascimento?: string;
  rg?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface ResultadoFiliacao {
  success: boolean;
  userId: string;
  message: string;
}

/**
 * Hook para processar filiação com criação automática de conta
 * 
 * FLUXO:
 * 1. Verifica se usuário já existe (email/CPF)
 * 2. Se não existe, cria conta automaticamente
 * 3. Retorna userId para criar pagamento
 * 4. Envia email de ativação
 */
export function useFiliacaoComCadastro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processarFiliacao(dadosFiliacao: DadosFiliacao): Promise<ResultadoFiliacao> {
    setLoading(true);
    setError(null);

    try {
      // PASSO 1: Verificar se usuário já existe
      console.log('🔍 Verificando se usuário já existe...');
      
      const { data: usuarioExistente, error: erroVerificacao } = await supabase
        .from('profiles')
        .select('id, email, cpf')
        .or(`email.eq.${dadosFiliacao.email},cpf.eq.${dadosFiliacao.cpf}`)
        .maybeSingle();

      if (erroVerificacao) {
        throw new Error(`Erro ao verificar usuário: ${erroVerificacao.message}`);
      }

      if (usuarioExistente) {
        throw new Error(
          'Já existe uma conta cadastrada com este email ou CPF. ' +
          'Por favor, faça login para renovar sua filiação.'
        );
      }

      // PASSO 2: Criar conta automaticamente
      console.log('👤 Criando nova conta...');
      
      // Gerar senha temporária (usuário troca no primeiro acesso)
      const senhaTemporaria = gerarSenhaTemporaria();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dadosFiliacao.email,
        password: senhaTemporaria,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nome_completo: dadosFiliacao.nome_completo,
            cpf: dadosFiliacao.cpf,
            telefone: dadosFiliacao.telefone,
            data_nascimento: dadosFiliacao.data_nascimento,
            rg: dadosFiliacao.rg,
            endereco: dadosFiliacao.endereco,
            numero: dadosFiliacao.numero,
            complemento: dadosFiliacao.complemento,
            bairro: dadosFiliacao.bairro,
            cidade: dadosFiliacao.cidade,
            estado: dadosFiliacao.estado,
            cep: dadosFiliacao.cep,
            // Marca que precisa trocar senha
            needs_password_reset: true,
            // Marca como filiação em andamento
            filiacao_em_andamento: true
          }
        }
      });

      if (authError || !authData.user) {
        throw new Error(`Erro ao criar conta: ${authError?.message}`);
      }

      const userId = authData.user.id;
      console.log('✅ Conta criada com sucesso:', userId);

      // PASSO 3: Retornar userId para criar pagamento
      return {
        success: true,
        userId,
        message: 'Conta criada! Agora você pode prosseguir com o pagamento. Verifique seu email para ativar sua conta.'
      };

    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao processar filiação';
      setError(mensagemErro);
      console.error('❌ Erro na filiação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { processarFiliacao, loading, error };
}

/**
 * Gera senha temporária aleatória de 12 caracteres
 * Usuário deve trocar no primeiro acesso
 */
function gerarSenhaTemporaria(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let senha = '';
  for (let i = 0; i < 12; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return senha;
}
