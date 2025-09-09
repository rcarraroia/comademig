-- Create notification_templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (category IN ('system', 'financial', 'events', 'communication')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage notification templates" 
  ON public.notification_templates 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_notification_templates_active ON public.notification_templates(active);
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX idx_notification_templates_type ON public.notification_templates(type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_templates_updated_at 
  BEFORE UPDATE ON public.notification_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default templates
INSERT INTO public.notification_templates (name, title, message, type, category) VALUES
('welcome', 'Bem-vindo ao COMADEMIG!', 'Seja bem-vindo à nossa plataforma. Sua conta foi criada com sucesso e você já pode acessar todos os recursos disponíveis.', 'success', 'system'),
('payment_approved', 'Pagamento Aprovado', 'Seu pagamento foi processado com sucesso. Obrigado por manter sua situação regularizada.', 'success', 'financial'),
('payment_pending', 'Pagamento Pendente', 'Identificamos um pagamento pendente em sua conta. Por favor, regularize sua situação para continuar aproveitando nossos serviços.', 'warning', 'financial'),
('event_reminder', 'Lembrete de Evento', 'Não se esqueça! O evento que você se inscreveu acontecerá em breve. Verifique os detalhes e prepare-se.', 'info', 'events'),
('document_required', 'Documentação Necessária', 'Para completar seu cadastro, precisamos de alguns documentos adicionais. Acesse sua área de documentos para enviar.', 'warning', 'system'),
('maintenance_notice', 'Manutenção Programada', 'Informamos que haverá uma manutenção programada no sistema. Durante este período, alguns serviços podem ficar indisponíveis.', 'info', 'system');

-- Add comment
COMMENT ON TABLE public.notification_templates IS 'Templates reutilizáveis para notificações do sistema';