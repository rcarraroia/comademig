# Notas da Documentação Asaas

## Guia de Cobranças

### Fluxo Básico de Cobrança
1. **Criar um cliente** - obtém o `customer` ID
2. **Criar cobrança** nos formatos:
   - Boleto bancário
   - PIX
   - Cartão de crédito
   - Link de pagamento (cliente escolhe forma)
3. **Configurar notificações** (opcional)

### Formas de Pagamento Suportadas
- PIX
- Boleto bancário
- Cartão de crédito
- Cartão de débito
- TED

### Notificações Disponíveis
1. Aviso de cobrança recebida
2. Aviso 10 dias antes do vencimento
3. Aviso no dia do vencimento
4. Aviso de cobrança vencida
5. Aviso a cada 7 dias após vencimento
6. Aviso de cobrança atualizada
7. Linha digitável no dia do vencimento

### Recursos Importantes para Análise
- **Assinaturas (recorrência)** - precisa verificar integração
- **Split de pagamento** - essencial para o projeto
- **Webhooks** - para receber notificações de eventos
- **Link de pagamento** - forma alternativa de cobrança
- **Redirecionamento após pagamento** - UX

## Próximos Passos da Análise
- [ ] Verificar documentação de assinaturas
- [ ] Verificar documentação de split de pagamentos
- [ ] Verificar documentação de webhooks
- [ ] Analisar código do repositório GitHub
- [ ] Verificar banco de dados Supabase




## Assinaturas (Recorrência)

### Conceito
Assinaturas são cobranças periódicas recorrentes (mensal, trimestral, semestral, etc.) diferentes de parcelamentos onde todas as parcelas são geradas de uma vez.

### Diferenças entre Assinaturas e Parcelamentos

**Assinaturas:**
- Uma cobrança é gerada a cada período (mensal, trimestral, etc.)
- Se pago com cartão de crédito, uma nova transação é lançada mensalmente
- Continua até ser removida ou cartão se tornar inválido

**Parcelamentos:**
- Todas as parcelas são geradas de uma só vez
- Valor total é cobrado no cartão de uma vez, parcelando conforme especificado

### Fluxo de Criação de Cobranças

**Cobranças recorrentes são geradas 40 dias antes do vencimento (`dueDate`)**

Exemplo: Assinatura configurada para vencer 5 dias após criação, com vencimento mensal:
- Ao criar a assinatura, duas cobranças já são criadas no sistema
- Notificações da primeira cobrança são enviadas imediatamente
- Notificações da segunda cobrança são enviadas 10 dias antes do vencimento

### Prazo de Geração Personalizável
- Padrão: 40 dias antes do vencimento
- Pode ser alterado para 14 ou 7 dias (mediante solicitação ao Gerente de Contas)

### Páginas Importantes para Análise
- Criando uma assinatura
- Criando assinatura com cartão de crédito
- Fluxo de bloqueio de assinatura por divergência de split
- Split em assinaturas





## Split de Pagamento

### Conceito
Funcionalidade exclusiva da API do Asaas que permite dividir valores recebidos através de pagamentos entre uma ou várias carteiras (contas Asaas) automaticamente.

### Requisitos
- **walletId**: ID da carteira de todos os envolvidos no split
- Retornado automaticamente na criação de subcontas
- Pode ser recuperado via requisição se possuir chave API da conta destino

### Funcionamento
- Valor do split é calculado sobre o `netValue` (valor líquido após taxas)
- Em caso de estorno, o split também é estornado
- Não há limite no número de walletId
- Limitação: valor líquido total da cobrança (valores fixos) ou 100% (valores percentuais)

### Status de Split
- `PENDING`, `AWAITING_CREDIT`, `CANCELLED`, `DONE`, `REFUSED`, `REFUNDED`
- Se `REFUSED`: campo `refusalReason` é preenchido

### Tipos de Valores
1. **Valores fixos** (`fixedValue`): até 2 casas decimais (ex: 9.32)
2. **Valores percentuais** (`percentualValue`): até 4 casas decimais (ex: 92.3444)
3. Pode usar ambos em conjunto

### Bloqueio por Divergência de Split
Quando o valor total do split é superior ao valor líquido:
1. Montante e split são bloqueados
2. Webhook `PAYMENT_SPLIT_DIVERGENCE_BLOCK` é enviado
3. Prazo de 2 dias úteis para ajuste
4. Se ajustado: desbloqueio e processamento
5. Se não ajustado: cancelamento automático com webhook `PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED`

### Split em Assinaturas

**Criação:**
- Enviar array `splits` na requisição de criação da assinatura
- Split configurado serve como template para cada nova cobrança

**Atualização:**
- Recuperar ID da assinatura
- Usar método de atualização de assinatura
- ⚠️ **IMPORTANTE**: Não informar parâmetro `splits` se não quiser alterar (passar `null` ou `[]` desativa o split)
- ⚠️ **Cobranças já geradas não são atualizadas automaticamente** - precisa atualizar manualmente cada cobrança

**Consulta:**
- Usar método Listar Assinaturas ou Recuperar uma única assinatura





## Webhooks

### Conceito
Forma automatizada de enviar informações entre sistemas quando eventos ocorrem. Asaas envia requisições POST para URL configurada.

### Configuração
- Até 10 URLs diferentes de webhooks
- Pode configurar via interface web ou API
- Define quais eventos quer receber em cada URL
- Token opcional para autenticar requisições (enviado no header `asaas-access-token`)

### Boas Práticas
- **Idempotência**: Registrar eventos processados para ignorar duplicatas (cada evento tem ID único)
- **Eventos necessários**: Configurar apenas tipos necessários
- **Processamento assíncrono**: Implementar fila de eventos
- **Resposta HTTP**: Status 200-299 para sucesso
- **Fila interrompida**: Após 15 falhas consecutivas, fila é pausada

### Retenção de Eventos
⚠️ **CRÍTICO**: Asaas guarda eventos por apenas **14 dias**
- Se fila pausada, resolver problema em até 14 dias
- Eventos com mais de 14 dias são excluídos permanentemente

### Eventos para Assinaturas
- `SUBSCRIPTION_CREATED` - Nova assinatura
- `SUBSCRIPTION_UPDATED` - Alteração na assinatura
- `SUBSCRIPTION_INACTIVATED` - Assinatura inativada
- `SUBSCRIPTION_DELETED` - Assinatura removida
- `SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK` - Bloqueada por divergência de split
- `SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED` - Bloqueio finalizado

### Eventos para Cobranças
(Verificar na documentação específica)

### Payload do Webhook
Inclui:
- `id`: ID único do evento
- `event`: Tipo do evento
- `dateCreated`: Data de criação
- `subscription` ou `payment`: Objeto com dados completos
- `split`: Array de split (se configurado)


