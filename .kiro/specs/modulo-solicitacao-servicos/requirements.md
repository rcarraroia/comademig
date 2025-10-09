# Requirements Document - Módulo Unificado de Solicitação de Serviços

## Introduction

Este documento define os requisitos para a criação de um novo módulo unificado de solicitação de serviços (Certidões e Regularização) no sistema COMADEMIG. O objetivo é substituir os fluxos atuais fragmentados por uma solução centralizada, com gestão administrativa completa e checkout transparente integrado ao Asaas.

**Contexto Atual:**
- Sistema possui fluxos separados para Certidões e Regularização
- Checkout não é transparente (problemas identificados nos relatórios)
- Falta gestão centralizada de serviços no painel admin
- Estrutura de banco de dados fragmentada

**Objetivo:**
- Criar módulo unificado e escalável
- Implementar checkout 100% transparente (PIX + Cartão)
- Centralizar gestão no painel admin
- Melhorar experiência do usuário
- Preparar sistema para novos tipos de serviços

---

## Requirements

### Requirement 1: Análise e Preparação do Banco de Dados

**User Story:** Como desenvolvedor, preciso analisar a estrutura atual do banco de dados para planejar a migração segura para o novo modelo unificado.

#### Acceptance Criteria

1. WHEN análise do banco é iniciada THEN sistema SHALL identificar todas as tabelas relacionadas a serviços (certidoes, valores_certidoes, solicitacoes_certidoes, servicos_regularizacao, solicitacoes_regularizacao, asaas_cobrancas)

2. WHEN estrutura atual é mapeada THEN sistema SHALL documentar todas as colunas, tipos de dados, constraints e relacionamentos existentes

3. WHEN RLS policies são verificadas THEN sistema SHALL listar todas as policies ativas e identificar gaps de segurança

4. WHEN dados existentes são analisados THEN sistema SHALL contar registros em cada tabela e identificar dados órfãos ou inconsistentes

5. WHEN análise é concluída THEN sistema SHALL gerar relatório com:
   - Estrutura atual completa
   - Dados existentes (quantidades)
   - RLS policies ativas
   - Problemas identificados
   - Recomendações para migração

---

### Requirement 2: Gestão de Serviços no Painel Admin

**User Story:** Como administrador, quero cadastrar e gerenciar todos os serviços oferecidos pela COMADEMIG em um único local, para ter controle centralizado e facilitar manutenção.

#### Acceptance Criteria

1. WHEN admin acessa painel THEN sistema SHALL exibir menu "Gestão de Serviços" com opções:
   - Listar Serviços
   - Cadastrar Novo Serviço
   - Categorias de Serviços
   - Exigências/Documentos

2. WHEN admin cadastra novo serviço THEN sistema SHALL solicitar campos obrigatórios:
   - Nome (text, obrigatório)
   - Descrição (text, obrigatório)
   - Categoria (select: certidao | regularizacao | outro)
   - Prazo (text, ex: "3-5 dias úteis")
   - Valor (numeric, obrigatório)
   - Ativo (boolean, default: true)
   - Ordem de exibição (integer)

3. WHEN admin configura exigências THEN sistema SHALL permitir adicionar:
   - Documentos obrigatórios (upload)
   - Campos de texto obrigatórios
   - Campos opcionais
   - Instruções específicas

4. WHEN admin configura pagamento THEN sistema SHALL permitir selecionar:
   - Aceita PIX (boolean)
   - Aceita Cartão de Crédito (boolean)
   - Número máximo de parcelas (integer, se cartão ativo)

5. WHEN admin lista serviços THEN sistema SHALL exibir:
   - Tabela com todos os serviços
   - Filtros por categoria e status (ativo/inativo)
   - Ações: Editar, Desativar/Ativar, Excluir (soft delete)
   - Ordenação por categoria e ordem de exibição

6. WHEN admin edita serviço THEN sistema SHALL:
   - Carregar dados atuais
   - Permitir alteração de todos os campos
   - Validar dados antes de salvar
   - Registrar alteração em audit log

7. WHEN admin desativa serviço THEN sistema SHALL:
   - Marcar como inativo (soft delete)
   - Manter histórico de solicitações
   - Não exibir para novos usuários
   - Permitir reativação

---

### Requirement 3: Solicitação de Serviços no Painel Usuário

**User Story:** Como usuário, quero solicitar serviços da COMADEMIG através de um menu unificado e intuitivo, com formulário dinâmico baseado nas exigências de cada serviço.

#### Acceptance Criteria

1. WHEN usuário acessa dashboard THEN sistema SHALL exibir menu "Solicitação de Serviços" com categorias:
   - Certidões
   - Regularização
   - Outros (se houver)

2. WHEN usuário seleciona categoria THEN sistema SHALL exibir:
   - Cards com serviços ativos daquela categoria
   - Nome, descrição resumida, prazo e valor
   - Botão "Solicitar" em cada card

3. WHEN usuário clica "Solicitar" THEN sistema SHALL:
   - Abrir formulário dinâmico
   - Exibir campos conforme exigências configuradas
   - Mostrar instruções específicas do serviço
   - Calcular valor total

4. WHEN usuário preenche formulário THEN sistema SHALL:
   - Validar campos obrigatórios
   - Validar formato de uploads (se houver)
   - Mostrar erros de validação em tempo real
   - Permitir salvar rascunho (opcional)

5. WHEN usuário finaliza formulário THEN sistema SHALL:
   - Validar todos os dados
   - Exibir resumo da solicitação
   - Mostrar valor total
   - Redirecionar para checkout

6. WHEN usuário visualiza histórico THEN sistema SHALL exibir:
   - Tabela com todas as solicitações
   - Status de cada solicitação
   - Valor pago
   - Data de solicitação
   - Ações: Ver detalhes, Baixar comprovante

---

### Requirement 4: Checkout Transparente com Asaas

**User Story:** Como usuário, quero realizar pagamento de serviços sem sair do site, escolhendo entre PIX ou Cartão de Crédito, com processo simples e seguro.

#### Acceptance Criteria

1. WHEN usuário acessa checkout THEN sistema SHALL exibir:
   - Resumo do serviço solicitado
   - Valor total
   - Opções de pagamento disponíveis (PIX e/ou Cartão)
   - Formulário de dados do cliente

2. WHEN usuário preenche dados do cliente THEN sistema SHALL solicitar:
   - Nome completo (obrigatório)
   - CPF/CNPJ (obrigatório, validado)
   - Email (obrigatório, validado)
   - Telefone (opcional)
   - Cidade (obrigatório)
   - Estado (obrigatório)

3. WHEN usuário seleciona PIX THEN sistema SHALL:
   - Aplicar desconto de 5%
   - Atualizar valor total
   - Exibir informação sobre desconto

4. WHEN usuário seleciona Cartão THEN sistema SHALL:
   - Exibir campos de cartão:
     * Número do cartão (obrigatório, validado)
     * Nome no cartão (obrigatório)
     * Validade (mês/ano, obrigatório)
     * CVV (obrigatório, 3-4 dígitos)
     * Número de parcelas (select, conforme configuração)
   - Validar número do cartão (Luhn algorithm)
   - Formatar campos automaticamente

5. WHEN usuário clica "Finalizar Pagamento" THEN sistema SHALL:
   - Validar todos os campos
   - Mostrar loading durante processamento
   - Enviar dados para Asaas via API
   - Tratar erros de forma amigável

6. IF pagamento é PIX THEN sistema SHALL:
   - Gerar QR Code
   - Exibir código copia-e-cola
   - Mostrar instruções de pagamento
   - Aguardar confirmação via webhook

7. IF pagamento é Cartão THEN sistema SHALL:
   - Processar pagamento imediatamente
   - Exibir resultado (aprovado/negado)
   - Mostrar mensagem apropriada
   - Criar registro se aprovado

8. WHEN pagamento é confirmado THEN sistema SHALL:
   - Criar registro em solicitacoes_servicos
   - Criar registro em asaas_cobrancas
   - Enviar email de confirmação
   - Redirecionar para página de sucesso

9. WHEN pagamento falha THEN sistema SHALL:
   - Exibir mensagem de erro clara
   - Permitir tentar novamente
   - Não criar registro de solicitação
   - Logar erro para análise

---

### Requirement 5: Webhook Asaas para Confirmação de Pagamento

**User Story:** Como sistema, preciso receber notificações do Asaas quando pagamentos são confirmados, para criar automaticamente as solicitações de serviço.

#### Acceptance Criteria

1. WHEN webhook Asaas é recebido THEN sistema SHALL:
   - Validar assinatura do webhook
   - Verificar tipo de evento (PAYMENT_CONFIRMED)
   - Extrair dados do pagamento

2. WHEN pagamento é confirmado THEN sistema SHALL:
   - Buscar dados da cobrança em asaas_cobrancas
   - Extrair service_data (tipo de serviço, dados do formulário)
   - Criar registro em solicitacoes_servicos com status 'pago'
   - Gerar número de protocolo único

3. WHEN registro é criado THEN sistema SHALL:
   - Vincular user_id correto
   - Vincular servico_id correto
   - Salvar dados_enviados (jsonb) com formulário
   - Registrar payment_reference (ID Asaas)
   - Definir data_solicitacao

4. WHEN criação é bem-sucedida THEN sistema SHALL:
   - Enviar email para usuário com protocolo
   - Enviar notificação para admin
   - Logar evento em audit_logs
   - Retornar 200 OK para Asaas

5. WHEN webhook falha THEN sistema SHALL:
   - Logar erro detalhado
   - Tentar reprocessar (retry logic)
   - Alertar admin se falhar múltiplas vezes
   - Retornar erro apropriado para Asaas

---

### Requirement 6: Gestão de Solicitações no Painel Admin

**User Story:** Como administrador, quero visualizar e gerenciar todas as solicitações de serviços dos usuários, atualizando status e adicionando observações.

#### Acceptance Criteria

1. WHEN admin acessa gestão de solicitações THEN sistema SHALL exibir:
   - Tabela com todas as solicitações
   - Filtros por: status, categoria, período, usuário
   - Busca por protocolo ou nome
   - Paginação (100 itens por página)

2. WHEN admin visualiza solicitação THEN sistema SHALL exibir:
   - Dados do usuário
   - Serviço solicitado
   - Dados enviados pelo usuário
   - Documentos anexados (se houver)
   - Histórico de status
   - Valor pago e forma de pagamento
   - Observações anteriores

3. WHEN admin atualiza status THEN sistema SHALL permitir:
   - Alterar para: pago → em_analise → aprovada → entregue
   - Ou: pago → em_analise → rejeitada
   - Adicionar observação obrigatória ao rejeitar
   - Registrar data de cada mudança de status

4. WHEN status muda para "aprovada" THEN sistema SHALL:
   - Registrar data_aprovacao
   - Enviar email para usuário
   - Criar notificação no sistema

5. WHEN status muda para "entregue" THEN sistema SHALL:
   - Registrar data_entrega
   - Permitir anexar arquivo (PDF, etc)
   - Enviar email com link para download
   - Marcar como concluída

6. WHEN admin adiciona observação THEN sistema SHALL:
   - Salvar em observacoes_admin
   - Registrar data e autor
   - Opcionalmente enviar para usuário

---

### Requirement 7: Nova Estrutura de Banco de Dados

**User Story:** Como desenvolvedor, preciso de uma estrutura de banco de dados unificada e escalável para suportar o novo módulo de serviços.

#### Acceptance Criteria

1. WHEN nova estrutura é criada THEN sistema SHALL ter tabela `servicos` com colunas:
   - id (uuid, PK)
   - nome (text, not null)
   - descricao (text, not null)
   - categoria (text, not null) - check: certidao | regularizacao | outro
   - prazo (text)
   - valor (numeric, not null)
   - is_active (boolean, default true)
   - sort_order (integer, default 0)
   - aceita_pix (boolean, default true)
   - aceita_cartao (boolean, default true)
   - max_parcelas (integer, default 1)
   - created_at (timestamp)
   - updated_at (timestamp)
   - created_by (uuid, FK → profiles)

2. WHEN exigências são configuradas THEN sistema SHALL ter tabela `servico_exigencias` com:
   - id (uuid, PK)
   - servico_id (uuid, FK → servicos)
   - tipo (text) - check: documento | campo_texto | campo_numero
   - nome (text, not null)
   - descricao (text)
   - obrigatorio (boolean, default true)
   - ordem (integer)
   - opcoes (jsonb) - para campos com opções predefinidas

3. WHEN solicitação é criada THEN sistema SHALL ter tabela `solicitacoes_servicos` com:
   - id (uuid, PK)
   - user_id (uuid, FK → profiles, not null)
   - servico_id (uuid, FK → servicos, not null)
   - numero_protocolo (text, unique, not null)
   - status (text, not null) - check: pago | em_analise | aprovada | rejeitada | entregue
   - valor_total (numeric, not null)
   - payment_reference (text) - ID da cobrança Asaas
   - dados_enviados (jsonb, not null) - formulário preenchido
   - observacoes_usuario (text)
   - observacoes_admin (text)
   - arquivo_entrega (text) - URL do arquivo entregue
   - data_solicitacao (timestamp, not null)
   - data_aprovacao (timestamp)
   - data_entrega (timestamp)
   - created_at (timestamp)
   - updated_at (timestamp)

4. WHEN RLS é configurado THEN sistema SHALL ter policies:
   - SELECT: usuário vê apenas suas solicitações; admin vê todas
   - INSERT: apenas via webhook (service role) ou admin
   - UPDATE: apenas admin pode atualizar status
   - DELETE: ninguém pode deletar (soft delete via is_active)

5. WHEN índices são criados THEN sistema SHALL ter:
   - idx_solicitacoes_user_id (user_id)
   - idx_solicitacoes_servico_id (servico_id)
   - idx_solicitacoes_status (status)
   - idx_solicitacoes_protocolo (numero_protocolo)
   - idx_servicos_categoria (categoria)
   - idx_servicos_active (is_active)

---

### Requirement 8: Migração de Dados Existentes

**User Story:** Como desenvolvedor, preciso migrar dados existentes de certidões e regularizações para a nova estrutura sem perda de informações.

#### Acceptance Criteria

1. WHEN migração inicia THEN sistema SHALL:
   - Criar backup de todas as tabelas antigas
   - Validar integridade dos dados atuais
   - Gerar relatório pré-migração

2. WHEN serviços são migrados THEN sistema SHALL:
   - Migrar valores_certidoes → servicos (categoria: certidao)
   - Migrar servicos_regularizacao → servicos (categoria: regularizacao)
   - Manter IDs originais se possível
   - Mapear campos corretamente

3. WHEN solicitações são migradas THEN sistema SHALL:
   - Migrar solicitacoes_certidoes → solicitacoes_servicos
   - Migrar solicitacoes_regularizacao → solicitacoes_servicos
   - Preservar status, datas e referências
   - Converter dados para formato jsonb

4. WHEN migração é concluída THEN sistema SHALL:
   - Validar contagem de registros (antes = depois)
   - Verificar integridade referencial
   - Gerar relatório pós-migração
   - Marcar tabelas antigas como deprecated

5. IF migração falha THEN sistema SHALL:
   - Fazer rollback automático
   - Restaurar backup
   - Logar erro detalhado
   - Alertar desenvolvedor

---

### Requirement 9: Remoção de Menus Antigos

**User Story:** Como usuário, quero ver apenas o novo menu unificado de serviços, sem confusão com menus antigos duplicados.

#### Acceptance Criteria

1. WHEN novo módulo é validado THEN sistema SHALL remover:
   - Menu "Certidões" do dashboard usuário
   - Menu "Regularização" do dashboard usuário
   - Páginas antigas: /dashboard/certidoes, /dashboard/regularizacao
   - Componentes obsoletos

2. WHEN menus são removidos THEN sistema SHALL:
   - Manter apenas "Solicitação de Serviços"
   - Redirecionar URLs antigas para novo módulo
   - Atualizar navegação do dashboard
   - Remover imports não utilizados

3. WHEN admin acessa painel THEN sistema SHALL:
   - Remover menus antigos de gestão
   - Manter apenas "Gestão de Serviços" e "Gestão de Solicitações"
   - Atualizar sidebar do admin

4. WHEN limpeza é concluída THEN sistema SHALL:
   - Verificar que não há links quebrados
   - Validar que todas as rotas funcionam
   - Confirmar que componentes antigos foram removidos
   - Atualizar documentação

---

### Requirement 10: Logs, Auditoria e Monitoramento

**User Story:** Como administrador, preciso de logs detalhados de todas as operações do módulo de serviços para auditoria e troubleshooting.

#### Acceptance Criteria

1. WHEN operação é realizada THEN sistema SHALL logar:
   - Criação/edição/exclusão de serviços
   - Mudanças de status em solicitações
   - Tentativas de pagamento (sucesso e falha)
   - Webhooks recebidos do Asaas
   - Erros e exceções

2. WHEN log é criado THEN sistema SHALL registrar:
   - Timestamp
   - User ID (se aplicável)
   - Ação realizada
   - Dados antes/depois (para updates)
   - IP do usuário
   - User agent

3. WHEN admin visualiza logs THEN sistema SHALL permitir:
   - Filtrar por tipo de ação
   - Filtrar por usuário
   - Filtrar por período
   - Buscar por ID de solicitação
   - Exportar logs

4. WHEN erro ocorre THEN sistema SHALL:
   - Logar stack trace completo
   - Registrar contexto (dados da requisição)
   - Enviar alerta para admin (se crítico)
   - Exibir mensagem amigável para usuário

5. WHEN webhook falha THEN sistema SHALL:
   - Logar payload completo
   - Registrar tentativas de retry
   - Alertar após 3 falhas consecutivas
   - Permitir reprocessamento manual

---

## Summary

Este documento define 10 requisitos principais para o novo Módulo Unificado de Solicitação de Serviços:

1. **Análise e Preparação** - Mapear estrutura atual
2. **Gestão Admin** - CRUD completo de serviços
3. **Solicitação Usuário** - Interface unificada e dinâmica
4. **Checkout Transparente** - PIX + Cartão sem sair do site
5. **Webhook Asaas** - Confirmação automática de pagamentos
6. **Gestão de Solicitações** - Admin gerencia status
7. **Nova Estrutura BD** - Tabelas unificadas e escaláveis
8. **Migração de Dados** - Preservar histórico existente
9. **Remoção de Menus** - Eliminar duplicidade
10. **Logs e Auditoria** - Rastreabilidade completa

**Total de Acceptance Criteria:** 67 critérios de aceitação detalhados

**Próximos Passos:**
1. Revisar e aprovar requirements
2. Criar design document
3. Criar implementation plan (tasks.md)
4. Executar implementação incremental
