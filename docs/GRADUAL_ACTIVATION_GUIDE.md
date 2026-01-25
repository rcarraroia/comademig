# Guia de Ativação Gradual - Payment First Flow

## Visão Geral

A ativação gradual permite migrar usuários do fluxo antigo de registro para o novo Payment First Flow de forma controlada e segura, minimizando riscos e permitindo rollback rápido em caso de problemas.

## Arquitetura

### Componentes Principais

1. **Feature Flag System** (`FeatureFlagService`)
   - Controla qual percentual de usuários usa o novo fluxo
   - Permite rollback instantâneo
   - Mantém histórico de mudanças

2. **Monitoring System** (`PaymentFirstFlowLogger`)
   - Coleta métricas em tempo real
   - Monitora taxa de sucesso/erro
   - Registra tempo de processamento

3. **Gradual Activation Script** (`gradual-activation.js`)
   - Automatiza o processo de ativação
   - Verifica saúde do sistema antes de cada step
   - Permite intervenção manual

4. **Admin Dashboard** (`GradualActivationDashboard`)
   - Interface visual para monitoramento
   - Controles manuais de rollout
   - Métricas em tempo real

## Processo de Ativação

### Fase 1: Preparação (Concluída)
- ✅ Deploy em produção com feature flag DESABILITADA
- ✅ Validação de que sistema antigo continua funcionando
- ✅ Configuração de monitoramento

### Fase 2: Ativação Gradual (Em Andamento)

#### Steps de Rollout Recomendados:
1. **5%** - Teste inicial com pequeno grupo
2. **10%** - Validação de estabilidade
3. **25%** - Expansão moderada
4. **50%** - Metade dos usuários
5. **75%** - Maioria dos usuários
6. **100%** - Migração completa

#### Critérios de Saúde para Continuar:
- Taxa de sucesso ≥ 95%
- Taxa de erro ≤ 5%
- Tempo médio de processamento ≤ 30s

### Fase 3: Monitoramento e Ajustes
- Monitoramento contínuo por 24-48h em cada step
- Análise de métricas e feedback
- Ajustes conforme necessário

## Como Usar

### 1. Via Script de Linha de Comando

```bash
# Verificar status atual
node scripts/gradual-activation.js status

# Iniciar ativação gradual interativa
node scripts/gradual-activation.js rollout

# Verificar saúde do sistema
node scripts/gradual-activation.js health

# Rollback de emergência
node scripts/gradual-activation.js rollback "Motivo do rollback"

# Coletar métricas
node scripts/gradual-activation.js metrics
```

### 2. Via Dashboard Administrativo

Acesse: `/admin/gradual-activation`

**Funcionalidades:**
- Visualização de métricas em tempo real
- Controles de rollout manual
- Gráficos de tendência
- Breakdown de erros
- Botão de rollback de emergência

### 3. Via API/Banco de Dados

```sql
-- Verificar status atual
SELECT name, is_enabled, rollout_percentage 
FROM feature_flags 
WHERE name = 'payment_first_flow';

-- Atualizar rollout manualmente
UPDATE feature_flags 
SET rollout_percentage = 25, is_enabled = TRUE 
WHERE name = 'payment_first_flow';

-- Rollback de emergência
UPDATE feature_flags 
SET is_enabled = FALSE, rollout_percentage = 0 
WHERE name = 'payment_first_flow';
```

## Métricas Monitoradas

### Métricas Principais
- **Taxa de Sucesso**: % de registros completados com sucesso
- **Taxa de Erro**: % de registros que falharam
- **Tempo Médio**: Tempo médio de processamento
- **Volume**: Número total de tentativas

### Métricas Detalhadas
- **Breakdown de Erros**: Tipos de erros mais frequentes
- **Tendência Temporal**: Evolução das métricas ao longo do tempo
- **Performance**: Tempo de processamento por etapa

### Alertas Automáticos
- Taxa de sucesso < 95%
- Taxa de erro > 5%
- Tempo de processamento > 30s
- Volume anormalmente baixo/alto

## Rollback de Emergência

### Quando Fazer Rollback
- Taxa de erro > 10%
- Taxa de sucesso < 90%
- Problemas críticos de performance
- Feedback negativo massivo dos usuários

### Como Fazer Rollback

#### Método 1: Script (Mais Rápido)
```bash
node scripts/gradual-activation.js rollback "Descrição do problema"
```

#### Método 2: Dashboard
1. Acessar `/admin/gradual-activation`
2. Clicar em "Rollback de Emergência"
3. Confirmar ação

#### Método 3: Banco de Dados (Emergência)
```sql
UPDATE feature_flags 
SET is_enabled = FALSE, rollout_percentage = 0 
WHERE name = 'payment_first_flow';
```

### Tempo de Rollback
- **Script/Dashboard**: ~30 segundos
- **Banco direto**: ~10 segundos
- **Efeito completo**: ~2-3 minutos (cache TTL)

## Troubleshooting

### Problemas Comuns

#### 1. Feature Flag Não Atualiza
**Sintomas**: Rollout não muda mesmo após atualização
**Causa**: Cache do frontend
**Solução**: Aguardar 2-3 minutos ou limpar cache

#### 2. Métricas Não Aparecem
**Sintomas**: Dashboard vazio ou sem dados
**Causa**: Logs não sendo gerados
**Solução**: Verificar Edge Functions e logging

#### 3. Rollback Não Funciona
**Sintomas**: Usuários continuam no novo fluxo
**Causa**: Cache ou problema de sincronização
**Solução**: Verificar banco de dados e aguardar propagação

### Comandos de Diagnóstico

```bash
# Verificar feature flags
supabase db execute "SELECT * FROM feature_flags WHERE name LIKE '%payment%'"

# Verificar logs recentes
supabase db execute "SELECT * FROM payment_first_flow_logs ORDER BY created_at DESC LIMIT 10"

# Verificar Edge Functions
supabase functions list
supabase functions logs process-payment-first-registration --limit 20
```

## Monitoramento Contínuo

### Dashboards Recomendados
1. **Admin Dashboard**: `/admin/gradual-activation`
2. **System Monitoring**: `/admin/system-settings`
3. **Logs**: Supabase Dashboard > Edge Functions

### Alertas Configurados
- Email para admins em caso de problemas
- Notificações no dashboard
- Logs estruturados para análise

### Métricas de Negócio
- Taxa de conversão de filiação
- Tempo médio de registro
- Satisfação do usuário
- Redução de suporte

## Cronograma Sugerido

### Semana 1: Preparação
- ✅ Deploy com feature flag OFF
- ✅ Configuração de monitoramento
- ✅ Testes de rollback

### Semana 2: Ativação Inicial (5-10%)
- Ativação para 5% dos usuários
- Monitoramento intensivo 24h
- Coleta de feedback inicial
- Ajustes se necessário

### Semana 3: Expansão Moderada (25-50%)
- Aumento gradual baseado em métricas
- Análise de performance
- Otimizações se necessário

### Semana 4: Migração Completa (75-100%)
- Finalização da migração
- Monitoramento pós-migração
- Documentação de lições aprendidas

## Critérios de Sucesso

### Técnicos
- Taxa de sucesso ≥ 98%
- Taxa de erro ≤ 2%
- Tempo médio ≤ 20s
- Zero downtime

### Negócio
- Manutenção da taxa de conversão
- Redução do tempo de registro
- Feedback positivo dos usuários
- Redução de tickets de suporte

## Contatos de Emergência

### Equipe Técnica
- **Desenvolvedor Principal**: [contato]
- **DevOps**: [contato]
- **Suporte**: [contato]

### Procedimento de Emergência
1. Identificar problema
2. Executar rollback imediato
3. Notificar equipe
4. Investigar causa raiz
5. Planejar correção
6. Documentar incidente

## Logs e Auditoria

### Tipos de Log
- **registration_attempt**: Tentativa de registro
- **registration_completed**: Registro concluído
- **registration_failed**: Registro falhou
- **error**: Erro específico
- **rollback**: Rollback executado

### Retenção
- Logs operacionais: 30 dias
- Métricas agregadas: 1 ano
- Histórico de feature flags: Permanente

### Compliance
- LGPD: Dados pessoais anonimizados nos logs
- Auditoria: Todas as mudanças registradas
- Backup: Logs replicados para storage seguro

---

**Última Atualização**: 25/01/2026  
**Versão**: 1.0  
**Status**: Em Produção - Fase de Ativação Gradual