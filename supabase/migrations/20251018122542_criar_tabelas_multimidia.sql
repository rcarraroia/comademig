-- ============================================
-- MIGRAÇÃO: Criar Tabelas de Multimídia
-- Data: 2025-10-18
-- Descrição: Cria tabelas para vídeos, álbuns de fotos e fotos
-- ============================================

-- ============================================
-- TABELA: videos
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  url_youtube TEXT NOT NULL,
  duracao TEXT, -- Formato: "10:30" ou "1:05:20"
  categoria TEXT NOT NULL DEFAULT 'geral',
  thumbnail_url TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualizacoes INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para videos
CREATE INDEX IF NOT EXISTS idx_videos_data_publicacao ON videos(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_videos_categoria ON videos(categoria);
CREATE INDEX IF NOT EXISTS idx_videos_destaque ON videos(destaque) WHERE destaque = TRUE;
CREATE INDEX IF NOT EXISTS idx_videos_ativo ON videos(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_videos_autor_id ON videos(autor_id);
-- Comentários
COMMENT ON TABLE videos IS 'Armazena vídeos do YouTube da COMADEMIG';
COMMENT ON COLUMN videos.url_youtube IS 'URL completa ou ID do vídeo do YouTube';
COMMENT ON COLUMN videos.duracao IS 'Duração do vídeo no formato MM:SS ou HH:MM:SS';
COMMENT ON COLUMN videos.categoria IS 'Categoria do vídeo: culto, evento, pregacao, testemunho, etc';
-- ============================================
-- TABELA: albuns_fotos
-- ============================================
CREATE TABLE IF NOT EXISTS albuns_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'eventos',
  data_evento DATE,
  capa_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para albuns_fotos
CREATE INDEX IF NOT EXISTS idx_albuns_data_evento ON albuns_fotos(data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_albuns_categoria ON albuns_fotos(categoria);
CREATE INDEX IF NOT EXISTS idx_albuns_ativo ON albuns_fotos(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_albuns_autor_id ON albuns_fotos(autor_id);
-- Comentários
COMMENT ON TABLE albuns_fotos IS 'Armazena álbuns de fotos de eventos da COMADEMIG';
COMMENT ON COLUMN albuns_fotos.categoria IS 'Categoria do álbum: eventos, cultos, encontros, etc';
COMMENT ON COLUMN albuns_fotos.capa_url IS 'URL da foto de capa do álbum';
-- ============================================
-- TABELA: fotos
-- ============================================
CREATE TABLE IF NOT EXISTS fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albuns_fotos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  legenda TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para fotos
CREATE INDEX IF NOT EXISTS idx_fotos_album_id ON fotos(album_id);
CREATE INDEX IF NOT EXISTS idx_fotos_ordem ON fotos(album_id, ordem);
-- Comentários
COMMENT ON TABLE fotos IS 'Armazena fotos individuais de cada álbum';
COMMENT ON COLUMN fotos.album_id IS 'Referência ao álbum que contém esta foto';
COMMENT ON COLUMN fotos.ordem IS 'Ordem de exibição da foto no álbum';
-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE albuns_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
-- ============================================
-- POLÍTICAS: videos
-- ============================================

-- SELECT: Todos podem ver vídeos ativos
CREATE POLICY "videos_select_public" ON videos
  FOR SELECT
  USING (ativo = TRUE);
-- SELECT: Admins veem todos os vídeos
CREATE POLICY "videos_select_admin" ON videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- INSERT: Apenas admins podem criar vídeos
CREATE POLICY "videos_insert_admin" ON videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- UPDATE: Apenas admins podem atualizar vídeos
CREATE POLICY "videos_update_admin" ON videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- DELETE: Apenas admins podem deletar vídeos
CREATE POLICY "videos_delete_admin" ON videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- ============================================
-- POLÍTICAS: albuns_fotos
-- ============================================

-- SELECT: Todos podem ver álbuns ativos
CREATE POLICY "albuns_select_public" ON albuns_fotos
  FOR SELECT
  USING (ativo = TRUE);
-- SELECT: Admins veem todos os álbuns
CREATE POLICY "albuns_select_admin" ON albuns_fotos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- INSERT: Apenas admins podem criar álbuns
CREATE POLICY "albuns_insert_admin" ON albuns_fotos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- UPDATE: Apenas admins podem atualizar álbuns
CREATE POLICY "albuns_update_admin" ON albuns_fotos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- DELETE: Apenas admins podem deletar álbuns
CREATE POLICY "albuns_delete_admin" ON albuns_fotos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- ============================================
-- POLÍTICAS: fotos
-- ============================================

-- SELECT: Todos podem ver fotos de álbuns ativos
CREATE POLICY "fotos_select_public" ON fotos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM albuns_fotos
      WHERE albuns_fotos.id = fotos.album_id
      AND albuns_fotos.ativo = TRUE
    )
  );
-- SELECT: Admins veem todas as fotos
CREATE POLICY "fotos_select_admin" ON fotos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- INSERT: Apenas admins podem adicionar fotos
CREATE POLICY "fotos_insert_admin" ON fotos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- UPDATE: Apenas admins podem atualizar fotos
CREATE POLICY "fotos_update_admin" ON fotos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- DELETE: Apenas admins podem deletar fotos
CREATE POLICY "fotos_delete_admin" ON fotos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );
-- ============================================
-- TRIGGERS: updated_at
-- ============================================

-- Trigger para atualizar updated_at em videos
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();
-- Trigger para atualizar updated_at em albuns_fotos
CREATE OR REPLACE FUNCTION update_albuns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER albuns_updated_at
  BEFORE UPDATE ON albuns_fotos
  FOR EACH ROW
  EXECUTE FUNCTION update_albuns_updated_at();
-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ============================================

/*
-- Inserir vídeo de exemplo
INSERT INTO videos (titulo, descricao, url_youtube, categoria, destaque, ativo)
VALUES (
  'Culto de Celebração - Janeiro 2025',
  'Culto especial de celebração com pregação do Pr. João Silva',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'culto',
  TRUE,
  TRUE
);

-- Inserir álbum de exemplo
INSERT INTO albuns_fotos (titulo, descricao, categoria, data_evento, ativo)
VALUES (
  'Convenção Estadual 2025',
  'Fotos da Convenção Estadual realizada em Belo Horizonte',
  'eventos',
  '2025-01-15',
  TRUE
);
*/

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================;
