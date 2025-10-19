-- ============================================
-- MIGRAÇÃO: Sistema de Moderação e Exibição na Home
-- ============================================
-- Data: 2025-10-18
-- Objetivo: Adicionar campos de moderação e controle de exibição na Home
-- Impacto: Adiciona colunas não destrutivas, atualiza notícias existentes
-- ============================================

-- 1. Adicionar coluna autor_id (UUID) para relacionamento com auth.users
ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS autor_id UUID REFERENCES auth.users(id);

-- 2. Adicionar coluna para exibir na Home
ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS exibir_na_home BOOLEAN DEFAULT false;

-- 3. Adicionar campos de moderação
ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado'));

ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS moderado_por UUID REFERENCES auth.users(id);

ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS moderado_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE noticias 
ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_noticias_status ON noticias(status);
CREATE INDEX IF NOT EXISTS idx_noticias_exibir_na_home ON noticias(exibir_na_home);
CREATE INDEX IF NOT EXISTS idx_noticias_autor_id ON noticias(autor_id);
CREATE INDEX IF NOT EXISTS idx_noticias_status_data ON noticias(status, data_publicacao DESC);

-- 5. Atualizar notícias existentes para status 'aprovado'
-- (Assumindo que notícias já existentes foram criadas por admins e estão aprovadas)
UPDATE noticias 
SET status = 'aprovado', 
    moderado_em = NOW()
WHERE status = 'pendente';

-- 6. Comentários nas colunas
COMMENT ON COLUMN noticias.autor_id IS 'ID do usuário autor da notícia (relacionamento com auth.users)';
COMMENT ON COLUMN noticias.exibir_na_home IS 'Define se a notícia aparece na seção de notícias da Home';
COMMENT ON COLUMN noticias.status IS 'Status de moderação: pendente (aguardando), aprovado (publicado), rejeitado (não aprovado)';
COMMENT ON COLUMN noticias.moderado_por IS 'ID do admin que moderou a notícia';
COMMENT ON COLUMN noticias.moderado_em IS 'Data e hora da moderação';
COMMENT ON COLUMN noticias.motivo_rejeicao IS 'Motivo da rejeição (preenchido apenas se status = rejeitado)';

-- ============================================
-- POLÍTICAS RLS ATUALIZADAS
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Notícias públicas são visíveis para todos" ON noticias;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as notícias" ON noticias;

-- POLÍTICA 1: Leitura Pública (SELECT)
-- Usuários não autenticados: apenas notícias aprovadas e ativas
-- Usuários autenticados: suas próprias notícias + notícias aprovadas e ativas
CREATE POLICY "noticias_select_policy" ON noticias
  FOR SELECT
  USING (
    -- Notícias aprovadas e ativas são públicas
    (status = 'aprovado' AND ativo = true)
    OR
    -- Usuário pode ver suas próprias notícias (qualquer status)
    (autor_id = auth.uid())
    OR
    -- Admins podem ver todas
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_membro IN ('admin', 'super_admin')
      )
    )
  );

-- POLÍTICA 2: Criação (INSERT)
-- Usuários autenticados podem criar notícias (sempre com status pendente)
-- Admins podem criar notícias já aprovadas
CREATE POLICY "noticias_insert_policy" ON noticias
  FOR INSERT
  WITH CHECK (
    -- Usuário autenticado
    auth.uid() IS NOT NULL
    AND
    -- Se não for admin, deve criar com status pendente
    (
      -- Admin pode criar com qualquer status
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_membro IN ('admin', 'super_admin')
      )
      OR
      -- Usuário comum só pode criar pendente, sem home, sem destaque
      (
        autor_id = auth.uid()
        AND status = 'pendente'
        AND exibir_na_home = false
        AND destaque = false
      )
    )
  );

-- POLÍTICA 3: Atualização (UPDATE)
-- Usuários podem editar apenas suas notícias pendentes
-- Admins podem editar qualquer notícia
CREATE POLICY "noticias_update_policy" ON noticias
  FOR UPDATE
  USING (
    -- Usuário pode editar suas próprias notícias pendentes
    (autor_id = auth.uid() AND status = 'pendente')
    OR
    -- Admins podem editar qualquer notícia
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_membro IN ('admin', 'super_admin')
      )
    )
  )
  WITH CHECK (
    -- Se não for admin, não pode alterar status, exibir_na_home ou destaque
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_membro IN ('admin', 'super_admin')
      )
    )
    OR
    (
      autor_id = auth.uid()
      AND status = 'pendente'
      AND exibir_na_home = false
      AND destaque = false
    )
  );

-- POLÍTICA 4: Exclusão (DELETE)
-- Usuários podem excluir apenas suas notícias pendentes
-- Admins podem excluir qualquer notícia
CREATE POLICY "noticias_delete_policy" ON noticias
  FOR DELETE
  USING (
    -- Usuário pode excluir suas próprias notícias pendentes
    (autor_id = auth.uid() AND status = 'pendente')
    OR
    -- Admins podem excluir qualquer notícia
    (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_membro IN ('admin', 'super_admin')
      )
    )
  );

-- ============================================
-- FUNCTION: Aprovar Notícia (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION aprovar_noticia(
  p_noticia_id UUID,
  p_exibir_na_home BOOLEAN DEFAULT false,
  p_destaque BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND tipo_membro IN ('admin', 'super_admin')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar notícias';
  END IF;
  
  -- Atualizar notícia
  UPDATE noticias
  SET 
    status = 'aprovado',
    exibir_na_home = p_exibir_na_home,
    destaque = p_destaque,
    moderado_por = auth.uid(),
    moderado_em = NOW(),
    motivo_rejeicao = NULL,
    ativo = true
  WHERE id = p_noticia_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- FUNCTION: Rejeitar Notícia (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION rejeitar_noticia(
  p_noticia_id UUID,
  p_motivo TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND tipo_membro IN ('admin', 'super_admin')
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar notícias';
  END IF;
  
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo da rejeição é obrigatório';
  END IF;
  
  -- Atualizar notícia
  UPDATE noticias
  SET 
    status = 'rejeitado',
    moderado_por = auth.uid(),
    moderado_em = NOW(),
    motivo_rejeicao = p_motivo,
    exibir_na_home = false,
    destaque = false,
    ativo = false
  WHERE id = p_noticia_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================
COMMENT ON FUNCTION aprovar_noticia IS 'Aprova uma notícia pendente e define se aparece na Home/Destaque';
COMMENT ON FUNCTION rejeitar_noticia IS 'Rejeita uma notícia pendente com motivo obrigatório';
