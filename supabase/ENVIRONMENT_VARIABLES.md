# Variáveis de Ambiente - Supabase

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento correto do sistema COMADEMIG.

## 🚨 ATENÇÃO: Configuração Manual Necessária

As variáveis abaixo devem ser configuradas manualmente no painel do Supabase:

**Caminho:** Settings > Edge Functions > Environment Variables

---

## Variáveis Obrigatórias

### 1. RENUM_WALLET_ID

**Descrição:** Wallet ID do Asaas da RENUM para receber splits de pagamentos.

**Tipo:** String

**Exemplo:** `wal_abc123def456`

**Onde obter:**
1. Acesse o painel do Asaas
2. Vá em Configurações > Carteiras
3. Copie o Wallet ID da RENUM

**Uso:**
- Edge Function: `asaas-configure-split`
- Edge Function: `asaas-process-splits`
- Necessário para divisão de pagamentos (40% RENUM)

**Como configurar:**
```bash
# No painel do Supabase:
# Settings > Edge Functions > Environment Variables
# Adicionar nova variável:
# Nome: RENUM_WALLET_ID
# Valor: [seu_wallet_id_aqui]
```

---

## Variáveis Opcionais (Já Configuradas)

### ASAAS_API_KEY
- Chave de API do Asaas
- Já configurada no projeto

### ASAAS_API_URL
- URL base da API do Asaas
- Valor padrão: `https://api.asaas.com`

---

## Validação

Após configurar as variáveis, execute o seguinte teste:

```sql
-- No Editor SQL do Supabase, execute:
SELECT 
  name,
  CASE 
    WHEN value IS NOT NULL THEN '✅ Configurada'
    ELSE '❌ Não configurada'
  END as status
FROM pg_settings
WHERE name LIKE '%RENUM_WALLET_ID%';
```

Ou teste via Edge Function:

```typescript
// Criar uma função de teste temporária
const renumWalletId = Deno.env.get('RENUM_WALLET_ID');
console.log('RENUM_WALLET_ID:', renumWalletId ? '✅ Configurada' : '❌ Não configurada');
```

---

## Troubleshooting

### Erro: "RENUM_WALLET_ID não encontrada"

**Solução:**
1. Verifique se a variável foi adicionada no painel do Supabase
2. Reinicie as Edge Functions (elas precisam ser reiniciadas após adicionar variáveis)
3. Aguarde alguns minutos para propagação

### Erro: "Wallet ID inválido"

**Solução:**
1. Verifique se o Wallet ID está correto no Asaas
2. Certifique-se de que o Wallet ID pertence à conta RENUM
3. Verifique se não há espaços em branco no início ou fim do valor

---

## Checklist de Configuração

- [ ] RENUM_WALLET_ID adicionada no painel do Supabase
- [ ] Edge Functions reiniciadas
- [ ] Validação executada com sucesso
- [ ] Teste de split realizado

---

## Próximos Passos

Após configurar a variável RENUM_WALLET_ID:

1. Execute o script de teste de split (se disponível)
2. Crie um pagamento de teste
3. Verifique se os 3 splits são criados corretamente:
   - 40% COMADEMIG
   - 40% RENUM (usando o Wallet ID configurado)
   - 20% Afiliado (se houver)

---

**Data de criação:** 2025-01-10
**Última atualização:** 2025-01-10
