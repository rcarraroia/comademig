# TODO - Auditoria Técnica COMADEMIG - Problemas de Pagamento

## Fase 1: Análise das Edge Functions de pagamento ✅
- [x] Examinar código da Edge Function `asaas-create-payment`
- [x] Examinar código da Edge Function `asaas-create-payment-with-split`
- [x] Verificar estrutura e lógica de ambas as funções
- [x] Identificar possíveis problemas na implementação
- [x] Analisar funções auxiliares (asaas-webhook, asaas-check-payment)
- [x] Documentar problemas encontrados em `/home/ubuntu/comademig/analise_edge_functions_asaas.md`

## Fase 2: Investigação das variáveis de ambiente e configurações ✅
- [x] Verificar variáveis de ambiente das Edge Functions
- [x] Identificar variáveis críticas (ASAAS_API_KEY, SUPABASE_*_KEY)
- [x] Analisar configurações hardcoded (RENUM_WALLET_ID, percentuais)
- [x] Examinar arquivo config.toml do Supabase
- [x] Documentar problemas de configuração em `/home/ubuntu/comademig/analise_variaveis_ambiente.md`
- [ ] Validar chaves de API do Asaas
- [ ] Verificar configurações de ambiente no Supabase
- [ ] Analisar configurações de CORS e headers

## Fase 3: Análise dos logs de execução das Edge Functions ⏳
- [ ] Acessar logs das Edge Functions no Supabase (aguardando login)
- [ ] Identificar erros recorrentes
- [ ] Analisar padrões de falha
- [ ] Documentar problemas encontrados

## Fase 4: Revisão das políticas RLS e estrutura do banco ✅
- [x] Verificar políticas RLS para tabelas relacionadas a pagamentos
- [x] Analisar estrutura das tabelas de pagamento (asaas_cobrancas, affiliates, referrals, transactions)
- [x] Verificar permissões de acesso e possíveis bloqueios RLS
- [x] Validar integridade referencial e constraints
- [x] Documentar problemas encontrados em `/home/ubuntu/comademig/analise_estrutura_banco_rls.md`

## Fase 5: Análise do fluxo de pagamento no frontend ✅
- [x] Examinar componentes de pagamento no frontend (PaymentForm, useAsaasPayments)
- [x] Verificar integração com Edge Functions
- [x] Analisar tratamento de erros e validações
- [x] Testar fluxos de pagamento (filiação, afiliados)
- [x] Documentar problemas encontrados em `/home/ubuntu/comademig/analise_fluxo_frontend.md`

## Fase 6: Implementação de correções e melhorias ⏳
- [x] **CORREÇÃO CRÍTICA:** Implementar redirecionamento para checkout (Filiacao.tsx)
- [x] **CORREÇÃO CRÍTICA:** Corrigir lógica de criação de clientes (asaas-create-payment)
- [x] **CORREÇÃO CRÍTICA:** Padronizar Edge Functions (asaas-create-payment-with-split)
- [x] Adicionar tratamento robusto de erros nas Edge Functions
- [x] Implementar logs detalhados para debugging
- [x] Fazer commit das correções no repositório local
- [ ] Fazer push das correções para repositório remoto (aguardando credenciais)
- [ ] Verificar variáveis de ambiente no Supabase (aguardando login)
- [ ] Fazer deploy das Edge Functions corrigidas
- [ ] Testar fluxo completo de pagamento
- [ ] Implementar melhorias no tratamento de erros
- [ ] Atualizar configurações necessárias
- [ ] Testar correções implementadas

## Fase 7: Documentação final e entrega dos resultados
- [ ] Compilar relatório final da auditoria
- [ ] Documentar correções implementadas
- [ ] Criar guia de manutenção
- [ ] Entregar resultados ao usuário

## Problemas Identificados Anteriormente:
✅ Problemas no menu de Gerenciar Conteúdo - RESOLVIDO
⚠️ Formulário de nova filiação não redireciona para checkout
⚠️ Sistema de certificados não gera métodos de pagamento
⚠️ Sistema de regularização não gera métodos de pagamento
⚠️ Sistema de afiliados com divisão de pagamento não funciona

## Arquivos Importantes:
- `/home/ubuntu/comademig/relatorio_auditoria_tecnica.md`
- `/home/ubuntu/comademig/auditoria_painel_administrativo.md`
- `/home/ubuntu/comademig/auditoria_gerenciar_conteudo.md`
- `/home/ubuntu/comademig/analise_logs_asaas.md`


