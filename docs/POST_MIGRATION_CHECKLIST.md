# Checklist de Limpeza Pós-Migração

## Pré-requisitos

### ✅ Verificações Obrigatórias
- [ ] Payment First Flow está em 100% de rollout
- [ ] Sistema está estável há pelo menos 7 dias
- [ ] Não há registros pendentes críticos
- [ ] Backup completo foi criado
- [ ] Equipe foi notificada sobre a limpeza

### ✅ Métricas de Validação
- [ ] Taxa de sucesso ≥ 98% nos últimos 7 dias
- [ ] Taxa de erro ≤ 2% nos últimos 7 dias
- [ ] Tempo médio de processamento ≤ 20s
- [ ] Zero tickets críticos relacionados ao novo fluxo

## Fase 1: Preparação

### 📋 Análise Prévia
- [ ] Executar análise de código legado: `node scripts/post-migration-cleanup.js --dry-run`
- [ ] Revisar relatório de itens a serem removidos
- [ ] Identificar dependências não mapeadas
- [ ] Validar que backup está completo

### 📊 Verificação de Estado
```sql
-- Verificar status da migração
SELECT check_migration_complete();

-- Gerar relatório completo
SELECT * FROM generate_migration_report();

-- Ver estatísticas detalhadas
SELECT * FROM post_migration_stats;
```

### 💾 Backup de Segurança
- [ ] Backup do código fonte (Git tag)
- [ ] Backup do banco de dados
- [ ] Backup de configurações
- [ ] Backup de logs importantes

## Fase 2: Limpeza de Código

### 🗑️ Remoção de Arquivos Legados
- [ ] Executar: `node scripts/post-migration-cleanup.js`
- [ ] Verificar arquivos removidos
- [ ] Confirmar que build ainda funciona
- [ ] Executar testes automatizados

### ✂️ Limpeza de Código Inline
- [ ] Remover comentários "TODO: Remove after migration"
- [ ] Remover blocos condicionais do fluxo antigo
- [ ] Limpar imports não utilizados
- [ ] Remover variáveis de feature flag antigas

### 📝 Arquivos Específicos a Revisar
```
src/hooks/useFiliacaoPayment.ts
├── Remover fallback para fluxo antigo
├── Limpar código condicional
└── Simplificar lógica

src/pages/Filiacao.tsx
├── Remover modo legado
├── Limpar imports desnecessários
└── Otimizar componente

src/components/payments/
├── Remover componentes antigos
├── Consolidar componentes similares
└── Atualizar documentação
```

## Fase 3: Limpeza de Banco de Dados

### 🗄️ Limpeza de Dados Temporários
```sql
-- Executar limpeza automática
SELECT cleanup_temporary_data();

-- Verificar resultado
SELECT * FROM post_migration_stats;
```

### 🚩 Remoção de Feature Flags
- [ ] `payment_first_flow_beta`
- [ ] `payment_first_flow_test`
- [ ] `legacy_payment_flow_fallback`
- [ ] Outras flags temporárias identificadas

### 📊 Otimização de Performance
```sql
-- Otimizar tabelas
SELECT optimize_tables_post_cleanup();

-- Verificar índices
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'user_subscriptions', 'payment_first_flow_logs');
```

## Fase 4: Validação Pós-Limpeza

### 🧪 Testes Funcionais
- [ ] Teste de registro completo (novo usuário)
- [ ] Teste de login de usuário existente
- [ ] Teste de dashboard de usuário
- [ ] Teste de funcionalidades administrativas
- [ ] Teste de relatórios financeiros

### 📊 Verificação de Métricas
- [ ] Taxa de sucesso mantida
- [ ] Tempo de processamento não aumentou
- [ ] Não há erros novos nos logs
- [ ] Performance do banco mantida

### 🔍 Monitoramento
- [ ] Configurar alertas para próximos 30 dias
- [ ] Monitorar logs de erro
- [ ] Acompanhar métricas de negócio
- [ ] Verificar feedback dos usuários

## Fase 5: Documentação e Comunicação

### 📚 Atualização de Documentação
- [ ] README.md - Remover referências ao fluxo antigo
- [ ] docs/ARCHITECTURE.md - Atualizar arquitetura
- [ ] docs/API.md - Remover endpoints legados
- [ ] docs/DEPLOYMENT.md - Atualizar processo de deploy

### 📋 Documentação Nova
- [ ] docs/MIGRATION_COMPLETED.md - Resumo da migração
- [ ] docs/PAYMENT_FIRST_FLOW.md - Documentação do novo fluxo
- [ ] docs/TROUBLESHOOTING.md - Guia de resolução de problemas

### 👥 Comunicação com Equipe
- [ ] Notificar equipe de desenvolvimento
- [ ] Atualizar equipe de suporte
- [ ] Treinar administradores
- [ ] Comunicar stakeholders

## Fase 6: Monitoramento Pós-Limpeza

### 📊 Primeiras 24 Horas
- [ ] Monitoramento contínuo de métricas
- [ ] Verificação de logs a cada 2 horas
- [ ] Resposta rápida a qualquer problema
- [ ] Comunicação proativa com usuários

### 📈 Primeira Semana
- [ ] Relatório diário de métricas
- [ ] Análise de feedback dos usuários
- [ ] Otimizações de performance se necessário
- [ ] Ajustes de configuração

### 📅 Primeiros 30 Dias
- [ ] Relatório semanal de status
- [ ] Análise de métricas de negócio
- [ ] Identificação de melhorias
- [ ] Planejamento de otimizações futuras

## Rollback de Emergência

### 🚨 Critérios para Rollback
- Taxa de erro > 10%
- Taxa de sucesso < 85%
- Problemas críticos de performance
- Feedback negativo massivo

### 🔄 Processo de Rollback
1. **Parar limpeza imediatamente**
2. **Restaurar backup do código**
3. **Restaurar backup do banco**
4. **Reativar feature flags antigas**
5. **Notificar equipe e stakeholders**
6. **Investigar causa raiz**

### ⏱️ Tempo de Rollback
- Código: ~15 minutos
- Banco de dados: ~30 minutos
- Propagação completa: ~1 hora

## Scripts e Comandos Úteis

### 🔧 Scripts de Limpeza
```bash
# Análise prévia (sem alterações)
node scripts/post-migration-cleanup.js --dry-run

# Limpeza completa
node scripts/post-migration-cleanup.js

# Limpeza forçada (mesmo se não 100%)
node scripts/post-migration-cleanup.js --force
```

### 🗄️ Comandos SQL Úteis
```sql
-- Status da migração
SELECT check_migration_complete();

-- Relatório completo
SELECT * FROM generate_migration_report();

-- Limpeza de dados
SELECT cleanup_temporary_data();

-- Otimização
SELECT optimize_tables_post_cleanup();

-- Estatísticas
SELECT * FROM post_migration_stats;
```

### 📊 Monitoramento
```bash
# Logs das Edge Functions
supabase functions logs process-payment-first-registration --tail

# Métricas do banco
supabase db execute "SELECT * FROM post_migration_stats"

# Status das feature flags
supabase db execute "SELECT name, is_enabled, rollout_percentage FROM feature_flags"
```

## Checklist Final

### ✅ Antes de Marcar como Concluído
- [ ] Todos os itens deste checklist foram executados
- [ ] Sistema está funcionando normalmente
- [ ] Métricas estão dentro dos parâmetros esperados
- [ ] Documentação foi atualizada
- [ ] Equipe foi treinada
- [ ] Monitoramento está configurado
- [ ] Plano de rollback está documentado

### 📋 Entregáveis
- [ ] Relatório de limpeza executada
- [ ] Documentação atualizada
- [ ] Código limpo e otimizado
- [ ] Banco de dados otimizado
- [ ] Monitoramento configurado
- [ ] Equipe treinada

---

## Responsáveis

| Fase | Responsável | Prazo |
|------|-------------|-------|
| Preparação | Dev Lead | 1 dia |
| Limpeza de Código | Desenvolvedores | 2 dias |
| Limpeza de BD | DBA/DevOps | 1 dia |
| Validação | QA/Testes | 2 dias |
| Documentação | Tech Writer | 1 dia |
| Monitoramento | DevOps | 30 dias |

## Cronograma

- **Semana 1**: Preparação e análise
- **Semana 2**: Execução da limpeza
- **Semana 3**: Validação e ajustes
- **Semana 4**: Documentação e treinamento
- **Mês 2-3**: Monitoramento e otimização

---

**Última Atualização**: 25/01/2026  
**Versão**: 1.0  
**Status**: Pronto para Execução