
-- Criar tabela para armazenar cobranças do Asaas
CREATE TABLE public.asaas_cobrancas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asaas_id TEXT NOT NULL UNIQUE, -- ID da cobrança no Asaas
  customer_id TEXT, -- ID do cliente no Asaas
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RECEIVED, OVERDUE, etc
  forma_pagamento TEXT, -- BOLETO, CREDIT_CARD, PIX, etc
  url_pagamento TEXT,
  linha_digitavel TEXT, -- Para boletos
  qr_code_pix TEXT, -- Para PIX
  data_pagamento TIMESTAMP WITH TIME ZONE,
  tipo_cobranca TEXT NOT NULL, -- 'filiacao', 'taxa_anual', 'certidao', etc
  referencia_id UUID, -- ID da referência (solicitação, evento, etc)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para webhooks do Asaas
CREATE TABLE public.asaas_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asaas_payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.asaas_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas para cobranças
CREATE POLICY "Usuários podem ver suas próprias cobranças" 
  ON public.asaas_cobrancas 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir cobranças" 
  ON public.asaas_cobrancas 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar cobranças" 
  ON public.asaas_cobrancas 
  FOR UPDATE 
  USING (true);

-- Políticas para webhooks (apenas sistema)
CREATE POLICY "Sistema pode inserir webhooks" 
  ON public.asaas_webhooks 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar webhooks" 
  ON public.asaas_webhooks 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Sistema pode ver webhooks" 
  ON public.asaas_webhooks 
  FOR SELECT 
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_asaas_cobrancas_updated_at 
  BEFORE UPDATE ON public.asaas_cobrancas 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_asaas_cobrancas_user_id ON public.asaas_cobrancas(user_id);
CREATE INDEX idx_asaas_cobrancas_asaas_id ON public.asaas_cobrancas(asaas_id);
CREATE INDEX idx_asaas_cobrancas_status ON public.asaas_cobrancas(status);
CREATE INDEX idx_asaas_webhooks_payment_id ON public.asaas_webhooks(asaas_payment_id);
CREATE INDEX idx_asaas_webhooks_processed ON public.asaas_webhooks(processed);
