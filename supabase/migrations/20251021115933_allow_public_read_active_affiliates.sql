-- Permitir leitura pública de afiliados ativos (necessário para validação de códigos de indicação)
-- Apenas afiliados com status 'active' podem ser lidos publicamente

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Afiliados ativos são visíveis publicamente" ON affiliates;

-- Criar política para leitura pública de afiliados ativos
CREATE POLICY "Afiliados ativos são visíveis publicamente"
ON affiliates
FOR SELECT
TO public
USING (status = 'active');

-- Comentário explicativo
COMMENT ON POLICY "Afiliados ativos são visíveis publicamente" ON affiliates IS 
'Permite que qualquer pessoa (incluindo usuários não autenticados) visualize afiliados ativos para validação de códigos de indicação durante o processo de filiação';
