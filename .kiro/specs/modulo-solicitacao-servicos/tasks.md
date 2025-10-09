# Implementation Plan - Módulo Unificado de Solicitação de Serviços

## Visão Geral

Este plano de implementação divide o desenvolvimento do Módulo Unificado de Solicitação de Serviços em tarefas incrementais e testáveis. Cada tarefa é autocontida e referencia os requirements correspondentes.

**Estratégia:** Desenvolvimento incremental com validação contínua
**Prioridade:** Funcionalidades core primeiro, otimizações depois
**Testes:** Cada tarefa inclui validação antes de prosseguir

---

## Fase 1: Análise e Preparação do Banco de Dados

- [ ] 1. Analisar estrutura atual do banco de dados
  - Criar script Python para mapear todas as tabelas relacionadas
  - Documentar colunas, tipos, constraints e relacionamentos
  - Contar registros existentes em cada tabela
  - Identificar dados órfãos ou inconsistentes
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2. Verificar e documentar RLS policies existentes
  - Listar todas as policies ativas em certidoes, valores_certidoes, solicitacoes_certidoes
  - Listar todas as policies ativas em servicos_regularizacao, solicitacoes_regularizacao
  - Identificar gaps de segurança
  - Documentar policies que precisam ser migradas
  - _Requirements: 1.3_

- [ ] 3. Gerar relatório de análise prévia
  - Consolidar dados coletados nas tarefas 1 e 2
  - Identificar problemas e riscos
  - Recomendar estratégia de migração
  - Validar com stakeholder antes de prosseguir
  - _Requirements: 1.5_

---

## Fase 2: Estrutura do Banco de Dados

- [ ] 4. Criar tabela `servicos` com schema completo
  - Escrever migration SQL com todas as colunas definidas no design
  - Adicionar constraints (CHECK, NOT NULL, DEFAULT)
  - Criar índices: categoria, is_active, sort_order
  - Adicionar trigger para updated_at
  - _Requirements: 7.1_

- [ ] 5. Criar tabela `servico_exigencias`
  - Escrever migration SQL com schema completo
  - Adicionar FK para servicos com ON DELETE CASCADE
  - Criar índice em servico_id
  - Validar tipos de exigências (documento, campo_texto, etc)
  - _Requirements: 7.2_

- [ ] 6. Criar tabela `solicitacoes_servicos`
  - Escrever migration SQL com schema completo
  - Adicionar FKs para profiles e servicos
  - Criar todos os índices necessários (user_id, servico_id, status, protocolo, payment)
  - Adicionar trigger para updated_at
  - _Requirements: 7.3_

- [ ] 7. Configurar RLS policies para `servicos`
  - Policy: SELECT para serviços ativos (público)
  - Policy: ALL para admin (super_admin)
  - Testar acesso como usuário comum
  - Testar acesso como admin
  - _Requirements: 7.4_

- [ ] 8. Configurar RLS policies para `solicitacoes_servicos`
  - Policy: SELECT para usuário (apenas suas solicitações)
  - Policy: SELECT para admin (todas as solicitações)
  - Policy: INSERT apenas via service role (webhook)
  - Policy: UPDATE apenas para admin
  - Testar todos os cenários
  - _Requirements: 7.4_

- [ ] 9. Executar migrations no banco de desenvolvimento
  - Aplicar todas as migrations criadas
  - Validar que tabelas foram criadas corretamente
  - Validar que índices existem
  - Validar que RLS está ativo
  - _Requirements: 7.5_

---

## Fase 3: Hooks Customizados (Backend Logic)

- [ ] 10. Implementar hook `useServicos`
  - Criar arquivo src/hooks/useServicos.ts
  - Implementar query para buscar todos os serviços
  - Implementar função buscarPorCategoria
  - Implementar mutation criarServico
  - Implementar mutation atualizarServico
  - Implementar mutation desativarServico (soft delete)
  - Adicionar tratamento de erros
  - _Requirements: 2.2, 2.5, 2.6, 2.7_

- [ ] 11. Implementar hook `useServicoExigencias`
  - Criar arquivo src/hooks/useServicoExigencias.ts
  - Implementar query para buscar exigências por servico_id
  - Implementar mutation para adicionar exigência
  - Implementar mutation para atualizar exigência
  - Implementar mutation para remover exigência
  - _Requirements: 2.3_

- [ ] 12. Implementar hook `useSolicitacoes`
  - Criar arquivo src/hooks/useSolicitacoes.ts
  - Implementar query para solicitações do usuário (minhasSolicitacoes)
  - Implementar query para todas as solicitações (admin)
  - Implementar mutation atualizarStatus (admin)
  - Implementar mutation adicionarObservacao (admin)
  - Adicionar invalidação de cache apropriada
  - _Requirements: 3.6, 6.2, 6.3, 6.6_

- [ ] 13. Implementar hook `useCheckoutTransparente`
  - Criar arquivo src/hooks/useCheckoutTransparente.ts
  - Integrar com useAsaasCustomers
  - Integrar com useAsaasPixPayments
  - Integrar com useAsaasCardPayments
  - Implementar função processarCheckout
  - Calcular descontos (PIX 5%)
  - Salvar cobrança em asaas_cobrancas
  - Adicionar tratamento de erros específicos
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

---

## Fase 4: Componentes Compartilhados

- [ ] 14. Criar componente `ServicoCard`
  - Criar arquivo src/components/servicos/ServicoCard.tsx
  - Exibir nome, descrição, prazo e valor
  - Adicionar badge de categoria
  - Botão "Solicitar" com callback
  - Suportar variantes (default, compact)
  - Adicionar hover effects
  - _Requirements: 3.2_

- [ ] 15. Criar componente `ServicoForm`
  - Criar arquivo src/components/servicos/ServicoForm.tsx
  - Renderizar campos dinamicamente baseado em exigências
  - Implementar validação com Zod
  - Suportar upload de documentos
  - Adicionar feedback visual de validação
  - Botões Cancelar e Enviar
  - _Requirements: 3.3, 3.4_

- [ ] 16. Criar componente `CardPaymentForm`
  - Criar arquivo src/components/checkout/CardPaymentForm.tsx
  - Campos: número, nome, validade (mês/ano), CVV
  - Formatação automática do número do cartão
  - Validação Luhn algorithm
  - Seletor de parcelas dinâmico
  - Exibir valor por parcela
  - _Requirements: 4.4_

- [ ] 17. Criar componente `PixPaymentDisplay`
  - Criar arquivo src/components/checkout/PixPaymentDisplay.tsx
  - Exibir QR Code gerado
  - Botão copiar código copia-e-cola
  - Instruções de pagamento
  - Indicador de aguardando confirmação
  - _Requirements: 4.6_

- [ ] 18. Criar componente `SolicitacaoCard`
  - Criar arquivo src/components/solicitacoes/SolicitacaoCard.tsx
  - Exibir número de protocolo, serviço, status
  - Badge de status com cores apropriadas
  - Data de solicitação
  - Botão "Ver Detalhes"
  - _Requirements: 3.6_

- [ ] 19. Criar componente `SolicitacaoDetalhes`
  - Criar arquivo src/components/solicitacoes/SolicitacaoDetalhes.tsx
  - Exibir todos os dados da solicitação
  - Mostrar dados enviados pelo usuário
  - Exibir histórico de status (timeline)
  - Link para download de arquivo (se entregue)
  - _Requirements: 6.2_

---

## Fase 5: Painel do Usuário

- [ ] 20. Criar página `SolicitacaoServicos`
  - Criar arquivo src/pages/dashboard/SolicitacaoServicos.tsx
  - Implementar tabs por categoria (Certidões, Regularização, Outros)
  - Listar serviços ativos por categoria usando ServicoCard
  - Seção "Meu Histórico" com SolicitacaoCard
  - Modal para ServicoForm ao clicar "Solicitar"
  - _Requirements: 3.1, 3.2, 3.6_

- [ ] 21. Implementar fluxo de solicitação no painel usuário
  - Ao clicar "Solicitar", abrir modal com ServicoForm
  - Validar formulário antes de prosseguir
  - Ao submeter, redirecionar para CheckoutServico
  - Passar dados do serviço e formulário
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 22. Criar página `CheckoutServico`
  - Criar arquivo src/pages/dashboard/CheckoutServico.tsx
  - Exibir resumo do serviço solicitado
  - Formulário de dados do cliente
  - Seletor de método de pagamento (PIX/Cartão)
  - Renderizar CardPaymentForm se cartão selecionado
  - Botão "Finalizar Pagamento"
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 23. Implementar processamento de pagamento PIX
  - Ao selecionar PIX, aplicar desconto de 5%
  - Ao clicar "Finalizar", chamar useCheckoutTransparente
  - Exibir PixPaymentDisplay com QR Code
  - Implementar polling para aguardar confirmação
  - Redirecionar para página de sucesso após confirmação
  - _Requirements: 4.3, 4.6, 4.8_

- [ ] 24. Implementar processamento de pagamento Cartão
  - Validar dados do cartão antes de enviar
  - Ao clicar "Finalizar", chamar useCheckoutTransparente
  - Exibir loading durante processamento
  - Mostrar resultado (aprovado/negado)
  - Redirecionar para página de sucesso se aprovado
  - _Requirements: 4.4, 4.7, 4.8_

- [ ] 25. Criar página de resultado de pagamento
  - Exibir mensagem de sucesso/erro
  - Mostrar número de protocolo
  - Instruções sobre próximos passos
  - Botão para voltar ao dashboard
  - Botão para ver detalhes da solicitação
  - _Requirements: 4.8_

---

## Fase 6: Painel Admin - Gestão de Serviços

- [ ] 26. Criar página `ServicosAdmin`
  - Criar arquivo src/pages/admin/ServicosAdmin.tsx
  - Tabela com todos os serviços (ativos e inativos)
  - Filtros por categoria e status
  - Botão "Novo Serviço"
  - Ações: Editar, Desativar/Ativar
  - _Requirements: 2.1, 2.5_

- [ ] 27. Criar modal de criação de serviço
  - Formulário com todos os campos obrigatórios
  - Validação com Zod
  - Seletor de categoria
  - Campos de configuração de pagamento (aceita_pix, aceita_cartao, max_parcelas)
  - Botões Cancelar e Salvar
  - _Requirements: 2.2, 2.4_

- [ ] 28. Criar modal de edição de serviço
  - Carregar dados atuais do serviço
  - Mesmo formulário da criação (reutilizar componente)
  - Permitir alteração de todos os campos
  - Validar antes de salvar
  - Registrar alteração em audit_logs
  - _Requirements: 2.6_

- [ ] 29. Implementar gestão de exigências do serviço
  - Seção "Exigências" no modal de edição
  - Lista de exigências configuradas
  - Botão "Adicionar Exigência"
  - Formulário para nova exigência (tipo, nome, descrição, obrigatório)
  - Permitir reordenar exigências (drag and drop ou botões)
  - Permitir remover exigência
  - _Requirements: 2.3_

- [ ] 30. Implementar ativação/desativação de serviços
  - Botão toggle na tabela
  - Confirmação antes de desativar
  - Soft delete (is_active = false)
  - Atualizar lista após ação
  - Mostrar badge "Inativo" em serviços desativados
  - _Requirements: 2.7_

---

## Fase 7: Painel Admin - Gestão de Solicitações

- [ ] 31. Criar página `SolicitacoesAdmin`
  - Criar arquivo src/pages/admin/SolicitacoesAdmin.tsx
  - Tabela com todas as solicitações
  - Colunas: Protocolo, Usuário, Serviço, Status, Valor, Data
  - Filtros: status, categoria, período
  - Busca por protocolo ou nome de usuário
  - Paginação (100 itens por página)
  - _Requirements: 6.1_

- [ ] 32. Criar modal de detalhes da solicitação
  - Exibir todos os dados do usuário
  - Exibir serviço solicitado
  - Mostrar dados_enviados (formulário preenchido)
  - Exibir documentos anexados (links para download)
  - Mostrar histórico de status com datas
  - Valor pago e forma de pagamento
  - _Requirements: 6.2_

- [ ] 33. Implementar atualização de status
  - Dropdown de status no modal de detalhes
  - Fluxo: pago → em_analise → aprovada → entregue
  - Ou: pago → em_analise → rejeitada
  - Campo de observação obrigatório ao rejeitar
  - Registrar data de cada mudança
  - Enviar notificação ao usuário
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 34. Implementar upload de arquivo de entrega
  - Botão "Anexar Arquivo" quando status = "aprovada"
  - Upload para Supabase Storage
  - Salvar URL em arquivo_entrega
  - Ao mudar para "entregue", enviar email com link
  - _Requirements: 6.5_

- [ ] 35. Implementar adição de observações admin
  - Campo de texto para observações
  - Botão "Adicionar Observação"
  - Salvar em observacoes_admin
  - Opção de enviar para usuário (checkbox)
  - Registrar data e autor
  - _Requirements: 6.6_

---

## Fase 8: Webhook Asaas

- [ ] 36. Criar Edge Function para webhook Asaas
  - Criar arquivo supabase/functions/asaas-webhook/index.ts
  - Validar assinatura do webhook
  - Verificar tipo de evento (PAYMENT_CONFIRMED)
  - Extrair dados do pagamento
  - _Requirements: 5.1_

- [ ] 37. Implementar criação de solicitação após pagamento
  - Buscar dados da cobrança em asaas_cobrancas
  - Extrair service_data (servico_id, dados_formulario)
  - Gerar número de protocolo único
  - Criar registro em solicitacoes_servicos com status 'pago'
  - Vincular user_id, servico_id, payment_reference
  - _Requirements: 5.2, 5.3_

- [ ] 38. Implementar notificações pós-pagamento
  - Enviar email para usuário com número de protocolo
  - Criar notificação no sistema para usuário
  - Criar notificação para admin (nova solicitação)
  - Registrar evento em audit_logs
  - _Requirements: 5.4_

- [ ] 39. Implementar retry logic para webhook
  - Capturar erros durante processamento
  - Logar erro detalhado
  - Implementar retry automático (3 tentativas)
  - Alertar admin após 3 falhas
  - Permitir reprocessamento manual
  - _Requirements: 5.5_

---

## Fase 9: Migração de Dados

- [ ] 40. Criar script de backup das tabelas antigas
  - Script SQL para exportar valores_certidoes
  - Script SQL para exportar servicos_regularizacao
  - Script SQL para exportar solicitacoes_certidoes
  - Script SQL para exportar solicitacoes_regularizacao
  - Validar integridade dos backups
  - _Requirements: 8.1_

- [ ] 41. Migrar serviços de certidões
  - Script para migrar valores_certidoes → servicos
  - Mapear campos corretamente
  - Definir categoria = 'certidao'
  - Configurar aceita_pix = true, aceita_cartao = true
  - Validar contagem de registros
  - _Requirements: 8.2_

- [ ] 42. Migrar serviços de regularização
  - Script para migrar servicos_regularizacao → servicos
  - Mapear campos corretamente
  - Definir categoria = 'regularizacao'
  - Configurar aceita_pix = true, aceita_cartao = true
  - Validar contagem de registros
  - _Requirements: 8.2_

- [ ] 43. Migrar solicitações de certidões
  - Script para migrar solicitacoes_certidoes → solicitacoes_servicos
  - Converter dados para formato jsonb
  - Preservar status, datas e payment_reference
  - Vincular servico_id correto
  - Validar contagem de registros
  - _Requirements: 8.3_

- [ ] 44. Migrar solicitações de regularização
  - Script para migrar solicitacoes_regularizacao → solicitacoes_servicos
  - Converter servicos_selecionados para formato jsonb
  - Preservar status, datas e payment_reference
  - Vincular servico_id correto
  - Validar contagem de registros
  - _Requirements: 8.3_

- [ ] 45. Validar migração completa
  - Verificar contagem total (antes = depois)
  - Validar integridade referencial
  - Testar queries nas novas tabelas
  - Gerar relatório pós-migração
  - _Requirements: 8.4_

- [ ] 46. Marcar tabelas antigas como deprecated
  - Adicionar comentário nas tabelas antigas
  - Documentar que não devem ser mais usadas
  - Manter por 30 dias antes de deletar
  - _Requirements: 8.4_

---

## Fase 10: Atualização de Navegação e Limpeza

- [ ] 47. Adicionar novo menu no dashboard usuário
  - Atualizar src/components/layout/DashboardSidebar.tsx
  - Adicionar item "Solicitação de Serviços"
  - Ícone apropriado
  - Link para /dashboard/solicitacao-servicos
  - _Requirements: 9.1_

- [ ] 48. Adicionar novos menus no painel admin
  - Atualizar src/components/admin/AdminSidebar.tsx
  - Adicionar seção "Serviços"
  - Item "Gestão de Serviços" → /admin/servicos
  - Item "Gestão de Solicitações" → /admin/solicitacoes
  - _Requirements: 9.3_

- [ ] 49. Remover menus antigos do dashboard usuário
  - Remover item "Certidões"
  - Remover item "Regularização"
  - Atualizar rotas para redirecionar para novo módulo
  - _Requirements: 9.1_

- [ ] 50. Remover menus antigos do painel admin
  - Remover itens antigos de gestão de certidões
  - Remover itens antigos de gestão de regularização
  - Limpar rotas obsoletas
  - _Requirements: 9.3_

- [ ] 51. Configurar redirecionamentos de URLs antigas
  - /dashboard/certidoes → /dashboard/solicitacao-servicos?categoria=certidao
  - /dashboard/regularizacao → /dashboard/solicitacao-servicos?categoria=regularizacao
  - Adicionar redirects no router
  - _Requirements: 9.2_

- [ ] 52. Remover componentes obsoletos
  - Deletar src/pages/dashboard/Certidoes.tsx
  - Deletar src/pages/dashboard/Regularizacao.tsx
  - Deletar src/pages/dashboard/CheckoutRegularizacao.tsx
  - Deletar src/components/certidoes/* (exceto se reutilizáveis)
  - Deletar src/components/regularizacao/* (exceto se reutilizáveis)
  - Remover imports não utilizados
  - _Requirements: 9.2_

- [ ] 53. Atualizar documentação do projeto
  - Atualizar README com novo fluxo
  - Documentar estrutura de banco de dados
  - Documentar APIs e hooks
  - Adicionar guia de uso para admin
  - _Requirements: 9.4_

---

## Fase 11: Logs, Auditoria e Monitoramento

- [ ] 54. Implementar logs de operações admin
  - Integrar com useAuditLog existente
  - Logar criação/edição/exclusão de serviços
  - Logar mudanças de status em solicitações
  - Registrar user_id, timestamp, ação, dados antes/depois
  - _Requirements: 10.1, 10.2_

- [ ] 55. Implementar logs de pagamento
  - Logar todas as tentativas de pagamento
  - Registrar sucesso/falha com detalhes
  - Logar webhooks recebidos do Asaas
  - Incluir payload completo em caso de erro
  - _Requirements: 10.1, 10.2_

- [ ] 56. Criar painel de visualização de logs (admin)
  - Página para visualizar audit_logs
  - Filtros: tipo de ação, usuário, período
  - Busca por ID de solicitação
  - Exportar logs (CSV)
  - _Requirements: 10.3_

- [ ] 57. Implementar alertas de erro
  - Configurar alertas para erros críticos
  - Enviar email para admin após 3 falhas de webhook
  - Alertar sobre pagamentos com erro
  - Dashboard de monitoramento de erros
  - _Requirements: 10.4_

- [ ] 58. Implementar retry manual de webhooks
  - Interface admin para ver webhooks falhados
  - Botão "Reprocessar" para tentar novamente
  - Exibir histórico de tentativas
  - Logar resultado do reprocessamento
  - _Requirements: 10.5_

---

## Fase 12: Testes e Validação

- [ ] 59. Testes unitários dos hooks
  - Testar useServicos (todas as funções)
  - Testar useSolicitacoes (queries e mutations)
  - Testar useCheckoutTransparente (fluxo completo)
  - Mock de APIs do Supabase e Asaas
  - Cobertura mínima de 80%
  - _Requirements: Todos_

- [ ] 60. Testes de integração
  - Testar fluxo: Admin cria serviço → Usuário vê serviço
  - Testar fluxo: Usuário solicita → Paga → Webhook cria registro
  - Testar fluxo: Admin atualiza status → Usuário recebe notificação
  - Validar integridade de dados
  - _Requirements: Todos_

- [ ] 61. Testes E2E com Cypress
  - Cenário: Solicitação completa com PIX
  - Cenário: Solicitação completa com Cartão
  - Cenário: Admin gerencia solicitação (início ao fim)
  - Cenário: Validação de erros (cartão inválido, etc)
  - _Requirements: Todos_

- [ ] 62. Testes de segurança (RLS)
  - Validar que usuário comum não vê solicitações de outros
  - Validar que usuário comum não pode atualizar status
  - Validar que apenas admin pode gerenciar serviços
  - Validar que apenas service role pode inserir solicitações
  - _Requirements: 7.4_

- [ ] 63. Testes de performance
  - Medir tempo de carregamento de páginas
  - Validar que queries estão otimizadas
  - Testar com 1000+ serviços
  - Testar com 10000+ solicitações
  - Identificar gargalos
  - _Requirements: Performance_

---

## Fase 13: Deploy e Monitoramento

- [ ] 64. Deploy em ambiente de staging
  - Aplicar todas as migrations
  - Deploy do frontend
  - Deploy da Edge Function (webhook)
  - Configurar variáveis de ambiente
  - _Requirements: Todos_

- [ ] 65. Testes em staging
  - Executar todos os testes E2E
  - Testar com dados reais (sandbox Asaas)
  - Validar webhook com eventos reais
  - Verificar logs e monitoramento
  - _Requirements: Todos_

- [ ] 66. Executar migração de dados em produção
  - Fazer backup completo do banco
  - Executar scripts de migração
  - Validar integridade dos dados
  - Rollback se necessário
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 67. Deploy em produção
  - Aplicar migrations
  - Deploy do frontend
  - Deploy da Edge Function
  - Configurar webhook no Asaas
  - Monitorar logs por 24h
  - _Requirements: Todos_

- [ ] 68. Validação pós-deploy
  - Testar fluxo completo em produção
  - Verificar que menus antigos foram removidos
  - Validar que redirecionamentos funcionam
  - Confirmar que webhooks estão funcionando
  - Monitorar erros e performance
  - _Requirements: Todos_

---

## Resumo

**Total de Tarefas:** 68 tarefas organizadas em 13 fases

**Fases:**
1. Análise e Preparação (3 tarefas)
2. Estrutura do Banco (6 tarefas)
3. Hooks Customizados (4 tarefas)
4. Componentes Compartilhados (6 tarefas)
5. Painel do Usuário (6 tarefas)
6. Painel Admin - Serviços (5 tarefas)
7. Painel Admin - Solicitações (5 tarefas)
8. Webhook Asaas (4 tarefas)
9. Migração de Dados (7 tarefas)
10. Navegação e Limpeza (7 tarefas)
11. Logs e Auditoria (5 tarefas)
12. Testes e Validação (5 tarefas)
13. Deploy e Monitoramento (5 tarefas)

**Estimativa Total:** 4-6 semanas de desenvolvimento

**Prioridade de Execução:**
- Crítico: Fases 1-8 (funcionalidades core)
- Importante: Fases 9-11 (migração e limpeza)
- Desejável: Fases 12-13 (testes e deploy)

**Próximo Passo:** Iniciar Fase 1 - Tarefa 1 (Análise do banco de dados)
