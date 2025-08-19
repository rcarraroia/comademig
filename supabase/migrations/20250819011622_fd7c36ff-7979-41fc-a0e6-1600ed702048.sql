
-- Criar tabela para certificados de eventos
CREATE TABLE public.certificados_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  evento_id UUID REFERENCES eventos(id) NOT NULL,
  numero_certificado TEXT NOT NULL UNIQUE,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  documento_url TEXT,
  qr_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'emitido' CHECK (status IN ('emitido', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para certificados
ALTER TABLE public.certificados_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para certificados
CREATE POLICY "Usuários podem ver seus próprios certificados"
  ON public.certificados_eventos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Certificados emitidos são públicos para validação"
  ON public.certificados_eventos
  FOR SELECT
  USING (status = 'emitido');

-- Criar tabela para controle de presença
CREATE TABLE public.presenca_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  evento_id UUID REFERENCES eventos(id) NOT NULL,
  data_presenca TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tipo_presenca TEXT NOT NULL DEFAULT 'entrada' CHECK (tipo_presenca IN ('entrada', 'saida')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, evento_id, tipo_presenca)
);

-- Adicionar RLS para presença
ALTER TABLE public.presenca_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para presença
CREATE POLICY "Usuários podem ver sua própria presença"
  ON public.presenca_eventos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem registrar sua própria presença"
  ON public.presenca_eventos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Adicionar campos necessários na tabela de eventos existente
ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS organizador_id UUID REFERENCES auth.users,
ADD COLUMN IF NOT EXISTS tipo_evento TEXT DEFAULT 'conferencia' CHECK (tipo_evento IN ('conferencia', 'curso', 'workshop', 'culto', 'retiro')),
ADD COLUMN IF NOT EXISTS certificado_disponivel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requer_presenca BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS carga_horaria INTEGER DEFAULT 0;

-- Adicionar campos na tabela de inscrições
ALTER TABLE public.inscricoes_eventos
ADD COLUMN IF NOT EXISTS data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_certificados_eventos_user_id ON public.certificados_eventos(user_id);
CREATE INDEX IF NOT EXISTS idx_certificados_eventos_evento_id ON public.certificados_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_certificados_eventos_numero ON public.certificados_eventos(numero_certificado);
CREATE INDEX IF NOT EXISTS idx_presenca_eventos_user_evento ON public.presenca_eventos(user_id, evento_id);
CREATE INDEX IF NOT EXISTS idx_eventos_organizador ON public.eventos(organizador_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON public.eventos(data_inicio);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certificados_eventos_updated_at 
  BEFORE UPDATE ON public.certificados_eventos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
