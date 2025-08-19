
-- Criar bucket para fotos das carteiras
INSERT INTO storage.buckets (id, name, public)
VALUES ('carteiras', 'carteiras', true);

-- Criar política RLS para permitir que usuários vejam fotos das carteiras
CREATE POLICY "Fotos das carteiras são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'carteiras');

-- Criar política RLS para permitir que usuários façam upload de suas fotos
CREATE POLICY "Usuários podem fazer upload de fotos de carteira"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'carteiras' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Criar política RLS para permitir que usuários atualizem suas fotos
CREATE POLICY "Usuários podem atualizar fotos de carteira"
ON storage.objects FOR UPDATE
USING (bucket_id = 'carteiras' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Criar política RLS para permitir que usuários deletem suas fotos
CREATE POLICY "Usuários podem deletar fotos de carteira"
ON storage.objects FOR DELETE
USING (bucket_id = 'carteiras' AND auth.uid()::text = (storage.foldername(name))[1]);
