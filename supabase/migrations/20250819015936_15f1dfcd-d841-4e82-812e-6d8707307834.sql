
-- Tabela para eventos de webhook (idempotência e auditoria)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de afiliados
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  asaas_wallet_id TEXT NOT NULL, -- walletId exigido pelo Asaas para repasses (formato string)
  contact_email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | suspended
  is_adimplent BOOLEAN NOT NULL DEFAULT true,
  referral_code TEXT UNIQUE, -- código único de indicação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de indicações
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id),
  referred_name TEXT,
  referred_email TEXT,
  charge_id TEXT, -- id da cobrança no Asaas
  amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de transações (histórico detalhado das splits)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id TEXT NOT NULL, -- id do recurso de pagamento no Asaas
  charge_id TEXT, -- id da cobrança
  affiliate_id UUID REFERENCES public.affiliates(id),
  total_amount NUMERIC(12,2),
  affiliate_amount NUMERIC(12,2),
  convention_amount NUMERIC(12,2),
  renum_amount NUMERIC(12,2),
  status TEXT NOT NULL, -- paid | pending | failed
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX idx_referrals_charge_id ON public.referrals(charge_id);
CREATE INDEX idx_transactions_affiliate_id ON public.transactions(affiliate_id);
CREATE INDEX idx_transactions_asaas_payment_id ON public.transactions(asaas_payment_id);
CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);

-- Habilitar RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para affiliates
CREATE POLICY "Usuários podem ver seus próprios dados de afiliado"
  ON public.affiliates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu perfil de afiliado"
  ON public.affiliates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios dados de afiliado"
  ON public.affiliates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os afiliados"
  ON public.affiliates
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Políticas RLS para referrals
CREATE POLICY "Afiliados podem ver suas próprias indicações"
  ON public.referrals
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE id = referrals.affiliate_id AND user_id = auth.uid()
  ));

CREATE POLICY "Sistema pode inserir indicações"
  ON public.referrals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar indicações"
  ON public.referrals
  FOR UPDATE
  USING (true);

-- Políticas RLS para transactions
CREATE POLICY "Afiliados podem ver suas próprias transações"
  ON public.transactions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE id = transactions.affiliate_id AND user_id = auth.uid()
  ));

CREATE POLICY "Sistema pode gerenciar transações"
  ON public.transactions
  FOR ALL
  USING (true);

-- Políticas RLS para webhook_events (apenas sistema)
CREATE POLICY "Sistema pode gerenciar webhook events"
  ON public.webhook_events
  FOR ALL
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_affiliates_updated_at 
  BEFORE UPDATE ON public.affiliates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres alfanuméricos
    new_code := upper(substr(md5(random()::text), 1, 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE referral_code = new_code) INTO code_exists;
    
    -- Se não existe, usar este código
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Trigger para gerar referral_code automaticamente
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();
