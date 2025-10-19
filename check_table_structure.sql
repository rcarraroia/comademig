-- Verificar estrutura da tabela content_management
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'content_management'
ORDER BY ordinal_position;
