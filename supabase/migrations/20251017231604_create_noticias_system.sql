-- ============================================
-- SISTEMA DE GERENCIAMENTO DE NOTÍCIAS
-- ============================================
-- Data: 2025-10-17
-- Objetivo: Criar tabela de notícias com todos os campos necessários
-- Requirements: 3.1, 3.2, 9.4
-- ============================================

-- Criar tabela de notícias
CREATE TABLE IF NOT EXISTS noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    resumo TEXT NOT NULL,
    conteudo_completo TEXT NOT NULL,
    autor TEXT,
    data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    categoria TEXT,
    imagem_url TEXT,
    visualizacoes INTEGER DEFAULT 0,
    destaque BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_noticias_data_publicacao ON noticias(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias(categoria);
CREATE INDEX IF NOT EXISTS idx_noticias_slug ON noticias(slug);
CREATE INDEX IF NOT EXISTS idx_noticias_destaque ON noticias(destaque) WHERE destaque = TRUE;
CREATE INDEX IF NOT EXISTS idx_noticias_ativo ON noticias(ativo) WHERE ativo = TRUE;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_noticias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_noticias_updated_at ON noticias;
CREATE TRIGGER trigger_update_noticias_updated_at
    BEFORE UPDATE ON noticias
    FOR EACH ROW
    EXECUTE FUNCTION update_noticias_updated_at();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública de notícias ativas
CREATE POLICY "Notícias ativas são visíveis publicamente"
    ON noticias
    FOR SELECT
    USING (ativo = TRUE);

-- Política: Admins podem ver todas as notícias
CREATE POLICY "Admins podem ver todas as notícias"
    ON noticias
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Política: Apenas admins podem inserir notícias
CREATE POLICY "Apenas admins podem criar notícias"
    ON noticias
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Política: Apenas admins podem atualizar notícias
CREATE POLICY "Apenas admins podem atualizar notícias"
    ON noticias
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Política: Apenas admins podem deletar notícias
CREATE POLICY "Apenas admins podem deletar notícias"
    ON noticias
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE noticias IS 'Tabela de notícias do site COMADEMIG';
COMMENT ON COLUMN noticias.id IS 'ID único da notícia';
COMMENT ON COLUMN noticias.titulo IS 'Título da notícia';
COMMENT ON COLUMN noticias.slug IS 'Slug único para URL amigável';
COMMENT ON COLUMN noticias.resumo IS 'Resumo curto da notícia';
COMMENT ON COLUMN noticias.conteudo_completo IS 'Conteúdo completo da notícia em HTML ou Markdown';
COMMENT ON COLUMN noticias.autor IS 'Nome do autor da notícia';
COMMENT ON COLUMN noticias.data_publicacao IS 'Data de publicação da notícia';
COMMENT ON COLUMN noticias.categoria IS 'Categoria da notícia (ex: Eventos, Comunicados, Geral)';
COMMENT ON COLUMN noticias.imagem_url IS 'URL da imagem de capa da notícia';
COMMENT ON COLUMN noticias.visualizacoes IS 'Contador de visualizações';
COMMENT ON COLUMN noticias.destaque IS 'Se a notícia deve aparecer em destaque';
COMMENT ON COLUMN noticias.ativo IS 'Se a notícia está ativa/publicada';
COMMENT ON COLUMN noticias.last_updated_by IS 'ID do usuário que fez a última atualização';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Tabela criada: noticias
-- Índices criados: 5
-- Políticas RLS criadas: 5
-- Trigger criado: 1
-- ============================================
