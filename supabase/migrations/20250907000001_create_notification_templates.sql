-- Create notification_templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('system', 'financial', 'events', 'communication')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies (apenas admins podem gerenciar templates)
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates(type);

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
('Pagamento Aprovado', 'Pagamento Aprovado', 'Seu pagamento foi processado com sucesso. Obrigado!', 'success', 'financial'),
('Lembrete de Vencimento', 'Lembrete de Pagamento', 'Sua anuidade vence em breve. Regularize sua situação para manter seus benefícios.', 'warning', 'financial'),
('Novo Evento', 'Novo Evento Disponível', 'Um novo evento foi adicionado. Confira e faça sua inscrição!', 'info', 'events'),
('Documentação Pendente', 'Documentação Pendente', 'Você possui documentos pendentes. Acesse sua área para regularizar.', 'warning', 'system'),
('Bem-vindo', 'Bem-vindo à COMADEMIG', 'Seja bem-vindo! Complete seu perfil para aproveitar todos os recursos.', 'info', 'system');

COMMENT ON TABLE public.notification_templates IS 'Templates reutilizáveis para notificações do sistema';