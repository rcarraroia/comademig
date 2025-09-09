-- 🚨 EXECUÇÃO MANUAL OBRIGATÓRIA
-- Este script deve ser executado no Editor SQL do painel do Supabase

-- Corrigir URLs de pagamento existentes que estão NULL
UPDATE asaas_cobrancas 
SET url_pagamento = CASE 
  WHEN forma_pagamento = 'PIX' THEN 'https://www.asaas.com/c/' || asaas_id
  WHEN forma_pagamento = 'BOLETO' THEN 'https://www.asaas.com/c/' || asaas_id
  ELSE 'https://www.asaas.com/c/' || asaas_id
END
WHERE url_pagamento IS NULL 
  AND asaas_id IS NOT NULL;

-- Verificar resultados
SELECT 
  id,
  asaas_id,
  forma_pagamento,
  url_pagamento,
  status,
  created_at
FROM asaas_cobrancas 
ORDER BY created_at DESC 
LIMIT 10;