# ESTRUTURAS DETALHADAS DAS TABELAS - COMADEMIG

**Data da Análise:** 06/10/2025 10:21:01  
**Objetivo:** Mapeamento completo da estrutura de cada tabela existente

## MEMBER_TYPES

- **Total de registros:** 6
- **Total de colunas:** 8
- **Status:** ✅ COM DADOS

### Estrutura das Colunas

| Coluna | Tipo | Exemplo |
|--------|------|----------|
| id | UUID | 61649ff8-c956-4766-b3b0-790b6f... |
| name | TEXT | Administrador |
| description | TEXT | Administrador do sistema |
| is_active | BOOLEAN | True |
| sort_order | INTEGER | 3 |
| created_at | TIMESTAMP | 2025-08-27T22:01:49.734063+00:... |
| updated_at | TIMESTAMP | 2025-08-27T22:01:49.734063+00:... |
| created_by | NoneType | None |

### Amostra de Dados

```json
{
  "id": "61649ff8-c956-4766-b3b0-790b6f3e1a30",
  "name": "Administrador",
  "description": "Administrador do sistema",
  "is_active": true,
  "sort_order": 3,
  "created_at": "2025-08-27T22:01:49.734063+00:00",
  "updated_at": "2025-08-27T22:01:49.734063+00:00",
  "created_by": null
}
```

## USER_SUBSCRIPTIONS

- **Total de registros:** 1
- **Total de colunas:** 11
- **Status:** ✅ COM DADOS

### Estrutura das Colunas

| Coluna | Tipo | Exemplo |
|--------|------|----------|
| id | UUID | 3794a691-11be-4de9-8eb4-3b49ab... |
| user_id | UUID | c2e01b5c-f6af-4906-94e3-ea7cdf... |
| subscription_plan_id | UUID | fb2f3276-f351-4ab0-950c-e9d415... |
| member_type_id | UUID | 61649ff8-c956-4766-b3b0-790b6f... |
| status | TEXT | active |
| payment_reference | NoneType | None |
| auto_renew | BOOLEAN | True |
| started_at | TIMESTAMP | 2025-09-28T18:50:45.952722+00:... |
| expires_at | TIMESTAMP | 2035-09-28T18:50:45.952722+00:... |
| created_at | TIMESTAMP | 2025-09-28T18:50:45.952722+00:... |
| updated_at | TIMESTAMP | 2025-09-28T18:50:45.952722+00:... |

### Amostra de Dados

```json
{
  "id": "3794a691-11be-4de9-8eb4-3b49ab44a02a",
  "user_id": "c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a",
  "subscription_plan_id": "fb2f3276-f351-4ab0-950c-e9d4156d0af4",
  "member_type_id": "61649ff8-c956-4766-b3b0-790b6f3e1a30",
  "status": "active",
  "payment_reference": null,
  "auto_renew": true,
  "started_at": "2025-09-28T18:50:45.952722+00:00",
  "expires_at": "2035-09-28T18:50:45.952722+00:00",
  "created_at": "2025-09-28T18:50:45.952722+00:00",
  "updated_at": "2025-09-28T18:50:45.952722+00:00"
}
```

## PROFILES

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## SUBSCRIPTION_PLANS

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## ASAAS_COBRANCAS

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## SOLICITACOES_CERTIDOES

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## NOTIFICATIONS

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## NOTIFICATION_TEMPLATES

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## CONTENT_PAGES

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## AFFILIATES

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## AFFILIATE_COMMISSIONS

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

## CERTIDOES

- **Total de registros:** 0
- **Total de colunas:** 0
- **Status:** ⚠️ VAZIA

