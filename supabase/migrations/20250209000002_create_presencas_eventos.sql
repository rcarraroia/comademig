-- Criar tabela para registro de presenças em eventos
-- Esta migração implementa o sistema de presença via QR Code

-- Criar tabela de presenças (verificado que não existe)
CREATE TABLE public.presencas_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    evento_id UUID NOT NULL,
    inscricao_id UUID,
    data_presenca TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tipo_registro VARCHAR(20) NOT NULL DEFAULT 'manual',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Garantir que cada usuário só pode ter uma presença por evento
    UNIQUE(user_id, evento_id)
);

-- Adicionar constraint para tipo_registro (sem IF NOT EXISTS que causa erro)
ALTER TABLE public.presencas_eventos 
ADD CONSTRAINT check_tipo_registro 
CHECK (tipo_registro IN ('manual', 'qr_code', 'admin'));

-- Criar índices para performance
CREATE INDEX idx_presencas_user_id ON public.presencas_eventos(user_id);
CREATE INDEX idx_presencas_evento_id ON public.presencas_eventos(evento_id);
CREATE INDEX idx_presencas_data ON public.presencas_eventos(data_presenca);

-- Habilitar RLS
ALTER TABLE public.presencas_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança básicas
CREATE POLICY "users_can_view_own_presencas" ON public.presencas_eventos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_presencas" ON public.presencas_eventos
    FOR INSERT WITH CHECK (auth.uid() = user_id);