
-- Criar tabela para solicitações de certidões
CREATE TABLE public.solicitacoes_certidoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_certidao TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'entregue')),
  observacoes_admin TEXT,
  numero_protocolo TEXT NOT NULL UNIQUE,
  data_solicitacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_entrega TIMESTAMP WITH TIME ZONE,
  arquivo_pdf TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS à tabela
ALTER TABLE public.solicitacoes_certidoes ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem suas próprias solicitações
CREATE POLICY "Usuários podem ver suas próprias solicitações" 
  ON public.solicitacoes_certidoes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias solicitações
CREATE POLICY "Usuários podem criar suas próprias solicitações" 
  ON public.solicitacoes_certidoes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para administradores visualizarem todas as solicitações
CREATE POLICY "Administradores podem ver todas as solicitações" 
  ON public.solicitacoes_certidoes 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para administradores atualizarem solicitações
CREATE POLICY "Administradores podem atualizar solicitações" 
  ON public.solicitacoes_certidoes 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_solicitacoes_certidoes_updated_at
  BEFORE UPDATE ON public.solicitacoes_certidoes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
