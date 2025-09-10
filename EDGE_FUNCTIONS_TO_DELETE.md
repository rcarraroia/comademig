# 🗑️ EDGE FUNCTIONS PARA DELETAR NO PAINEL DO SUPABASE

## 📋 FUNCTIONS IDENTIFICADAS NA IMAGEM:

**DELETAR ESTAS EDGE FUNCTIONS:**
- ❌ `asaas-check-payment`
- ❌ `asaas-create-payment` 
- ❌ `asaas-webhook`
- ❌ `asaas-create-payment-with-split`

**MANTER ESTAS (não relacionadas a pagamento):**
- ✅ `affiliates-management` (se for usado para outras funcionalidades)
- ✅ `quick-action` (não relacionado a pagamentos)

## 🎯 COMO DELETAR NO PAINEL:

1. **Acesse:** Supabase Dashboard > Edge Functions
2. **Para cada function listada acima:**
   - Clique nos 3 pontos (⋯) ao lado da function
   - Selecione "Delete"
   - Confirme a exclusão

## ⚠️ IMPORTANTE:
- **NÃO delete** `affiliates-management` se for usado para gestão de afiliados
- **NÃO delete** `quick-action` se for usado para outras funcionalidades
- **DELETE apenas** as functions relacionadas a `asaas-*` e pagamentos

## ✅ RESULTADO ESPERADO:
Após deletar, deve restar apenas:
- `affiliates-management` (se necessário)
- `quick-action` (se necessário)

## 🔄 PRÓXIMO PASSO:
Após deletar as Edge Functions, execute o script `CLEANUP_FINAL_PAYMENTS.sql` para completar a limpeza do banco de dados.