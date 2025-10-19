# 📊 AUDITORIA COMPLETA DE TABELAS DO BANCO DE DADOS

**Data:** 17/10/2025  
**Método:** Análise via types.ts + Verificação de uso no código  
**Objetivo:** Identificar tabelas em uso vs não utilizadas

---

## 📋 TABELAS IDENTIFICADAS (Total: 38)

### ✅ SISTEMA DE AFILIADOS (6 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `affiliates` | ✅ Ativa | Sim - Sistema de afiliados | **MANTER** |
| `affiliate_commissions` | ✅ Ativa | Sim - Comissões | **MANTER** |
| `affiliate_referrals` | ✅ Ativa | Sim - Indicações | **MANTER** |
| `referrals` | ⚠️ Duplicada? | Verificar se é igual a affiliate_referrals | **ANALISAR** |
| `asaas_splits` | ✅ Ativa | Sim - Split de pagamentos | **MANTER** |
| `split_configurations` | ✅ Ativa | Sim - Configurações de split | **MANTER** |
| `split_recipients` | ✅ Ativa | Sim - Destinatários de split | **MANTER** |

### 💰 SISTEMA DE PAGAMENTOS (3 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `asaas_cobrancas` | ✅ Ativa | Sim - Cobranças Asaas | **MANTER** |
| `asaas_webhooks` | ✅ Ativa | Sim - Webhooks Asaas | **MANTER** |
| `transactions` | ✅ Ativa | Sim - Transações | **MANTER** |

### 👤 SISTEMA DE USUÁRIOS (2 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `profiles` | ✅ Ativa | Sim - Perfis de usuários | **MANTER** |
| `user_roles` | ✅ Ativa | Sim - Roles/Permissões | **MANTER** |

### 📄 SISTEMA DE DOCUMENTOS (2 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `carteira_digital` | ✅ Ativa | Sim - Carteiras digitais | **MANTER** |
| `solicitacoes_certidoes` | ✅ Ativa | Sim - Certidões | **MANTER** |
| `certidoes` | ⚠️ Duplicada? | Verificar se é igual a solicitacoes_certidoes | **ANALISAR** |

### 📝 SISTEMA DE CONTEÚDO (1 tabela)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `content_management` | ✅ Ativa | Sim - Gerenciamento de conteúdo | **MANTER** |

### 📰 SISTEMA DE NOTÍCIAS E MÍDIA (2 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `noticias` | ⚠️ Recriada | Verificar se está em uso | **ANALISAR** |
| `multimidia` | ⚠️ Recriada | Verificar se está em uso | **ANALISAR** |

### 🎉 SISTEMA DE EVENTOS (4 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `eventos` | ⚠️ Recriada | Verificar se está em uso | **ANALISAR** |
| `inscricoes_eventos` | ⚠️ Dependente | Depende de eventos | **ANALISAR** |
| `certificados_eventos` | ⚠️ Dependente | Depende de eventos | **ANALISAR** |
| `presenca_eventos` | ⚠️ Dependente | Depende de eventos | **ANALISAR** |

### 💼 SISTEMA DE SERVIÇOS (3 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `servicos` | ⚠️ Desconhecido | Verificar uso | **ANALISAR** |
| `servico_exigencias` | ⚠️ Dependente | Depende de servicos | **ANALISAR** |
| `solicitacoes_servicos` | ⚠️ Dependente | Depende de servicos | **ANALISAR** |

### 💬 SISTEMA DE MENSAGENS (2 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `mensagens` | ⚠️ Desconhecido | Verificar uso | **ANALISAR** |
| `notifications` | ⚠️ Desconhecido | Verificar uso | **ANALISAR** |

### 🎫 SISTEMA DE SUPORTE (2 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `suporte` | ⚠️ Desconhecido | Verificar uso | **ANALISAR** |
| `suporte_mensagens` | ⚠️ Dependente | Depende de suporte | **ANALISAR** |

### 💵 SISTEMA FINANCEIRO (1 tabela)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `financeiro` | ⚠️ Desconhecido | Verificar uso | **ANALISAR** |

### 🔧 SISTEMA (4 tabelas)
| Tabela | Status | Uso no Código | Ação |
|--------|--------|---------------|------|
| `audit_logs` | ✅ Ativa | Sim - Logs de auditoria | **MANTER** |
| `system_settings` | ⚠️ Desconhecido | Verificar uso | **ANALISAR** |
| `webhook_events` | ✅ Ativa | Sim - Eventos de webhook | **MANTER** |
| `webhook_errors` | ✅ Ativa | Sim - Erros de webhook | **MANTER** |

---

## 📊 RESUMO ESTATÍSTICO

| Categoria | Quantidade |
|-----------|------------|
| **Total de tabelas** | 38 |
| **Confirmadas em uso** | 18 |
| **Precisam análise** | 20 |
| **Possíveis duplicadas** | 2 |

---

## 🔍 TABELAS QUE PRECISAM ANÁLISE DETALHADA

### Prioridade ALTA (Possíveis Duplicadas):
1. **`referrals` vs `affiliate_referrals`**
   - Verificar se são a mesma coisa
   - Se sim, manter apenas uma

2. **`certidoes` vs `solicitacoes_certidoes`**
   - Verificar se são a mesma coisa
   - Se sim, manter apenas uma

### Prioridade MÉDIA (Sistemas Completos):
3. **Sistema de Eventos** (4 tabelas)
   - `eventos`, `inscricoes_eventos`, `certificados_eventos`, `presenca_eventos`
   - Verificar se está implementado no código
   - Se não, considerar remover ou documentar como "futuro"

4. **Sistema de Serviços** (3 tabelas)
   - `servicos`, `servico_exigencias`, `solicitacoes_servicos`
   - Verificar se está implementado no código
   - Se não, considerar remover ou documentar como "futuro"

5. **Sistema de Notícias e Mídia** (2 tabelas)
   - `noticias`, `multimidia`
   - Foram deletadas e recriadas recentemente
   - Verificar se estão em uso agora

### Prioridade BAIXA (Tabelas Individuais):
6. **`mensagens`** - Verificar se é usado para comunicação interna
7. **`notifications`** - Verificar se é usado para notificações
8. **`suporte`** e **`suporte_mensagens`** - Verificar sistema de suporte
9. **`financeiro`** - Verificar se é usado para controle financeiro
10. **`system_settings`** - Verificar se é usado para configurações

---

## 🎯 PRÓXIMOS PASSOS

### Passo 1: Buscar Uso no Código
Para cada tabela em análise, executar:

```powershell
# Buscar referências no código
grepSearch -query "nome_da_tabela" -includePattern "*.ts,*.tsx"
```

### Passo 2: Verificar Dados
Para cada tabela, verificar se tem dados:

```python
# Usar script Python para contar registros
# (Ajustar para usar service_role key se necessário)
```

### Passo 3: Decisão
Com base nos resultados:
- **Tem dados + Usado no código** = MANTER
- **Sem dados + Não usado** = CANDIDATA À REMOÇÃO
- **Sem dados + Usado no código** = MANTER (pode ser usada no futuro)
- **Tem dados + Não usado** = INVESTIGAR (pode ser legacy)

---

## ⚠️ AVISOS IMPORTANTES

### NUNCA DELETAR SEM VERIFICAR:
- ❌ Tabelas com dados
- ❌ Tabelas com foreign keys
- ❌ Tabelas do sistema (auth, storage)
- ❌ Tabelas sem backup

### SEMPRE:
- ✅ Fazer backup antes
- ✅ Verificar uso no código
- ✅ Verificar foreign keys
- ✅ Obter aprovação do usuário
- ✅ Documentar decisão

---

## 📝 HISTÓRICO DE LIMPEZAS

### Limpeza 1 - 17/10/2025
**Tabelas removidas:**
- `noticias` (vazia, não usada)
- `multimidia` (vazia, não usada)
- `eventos` (vazia, não usada)

**Método:** Migração via Supabase CLI  
**Status:** ✅ Concluído

**Nota:** Essas tabelas foram recriadas posteriormente com schema correto

---

## 🚀 RECOMENDAÇÕES

### Curto Prazo (Esta Sessão):
1. Verificar uso das 20 tabelas em análise
2. Identificar duplicadas (referrals, certidoes)
3. Documentar decisões

### Médio Prazo (Próxima Semana):
1. Remover tabelas não utilizadas (se houver)
2. Consolidar duplicadas
3. Documentar schema final

### Longo Prazo (Mensal):
1. Auditoria periódica
2. Limpeza de dados antigos
3. Otimização de índices

---

**Status:** 📌 Documento criado - Aguardando análise detalhada
