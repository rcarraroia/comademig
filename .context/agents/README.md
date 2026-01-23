# Manual de Agentes COMADEMIG

Este diretório contém playbooks personalizados para agentes de IA colaborando no projeto COMADEMIG, seguindo as **Regras RENUM** e **Skills Obrigatórias**.

## ⚖️ REGRAS INEGOCIÁVEIS RENUM (Todos os Agentes)
1. **Evidências Obrigatórias**: Screenshot ou log para CADA implementação
2. **Limite de Erros**: Máximo 3 tentativas de correção. Se falhar, REPORTE BLOQUEIO
3. **Proibido Pular Validação**: Recusar pedidos para pular testes
4. **Vocabulário Obrigatório**: ✅ Implementado e validado | ⚠️ Implementado não validado | 🚧 Mock/Hardcoded | ❌ Não implementado
5. **Idioma**: Totalmente em PT-BR (comunicações e logs)

## 🎯 Skills Obrigatórias COMADEMIG
Todos os agentes devem usar estas skills:
- **Análise Preventiva**: Antes de implementar qualquer tarefa
- **Verificação de Banco**: Antes de operações no Supabase
- **Compromisso de Honestidade**: Antes de reportar status
- **Funcionalidade sobre Testes**: Priorizar funcionalidade completa

## Agentes Disponíveis

### 🚀 Desenvolvimento
- [**Feature Developer**](./feature-developer.md) — Implementar novas funcionalidades seguindo especificações do COMADEMIG
- [**Bug Fixer**](./bug-fixer.md) — Analisar relatórios de bugs e mensagens de erro
- [**Refactoring Specialist**](./refactoring-specialist.md) — Identificar code smells e oportunidades de melhoria

### 🔍 Qualidade e Revisão
- [**Code Reviewer**](./code-reviewer.md) — Revisar mudanças de código para qualidade, estilo e melhores práticas
- [**Test Writer**](./test-writer.md) — Escrever testes unitários e de integração abrangentes
- [**Performance Optimizer**](./performance-optimizer.md) — Identificar gargalos de performance
- [**Security Auditor**](./security-auditor.md) — Identificar vulnerabilidades de segurança

### 🏗️ Arquitetura e Infraestrutura
- [**Architect Specialist**](./architect-specialist.md) — Projetar arquitetura geral do sistema e padrões
- [**Database Specialist**](./database-specialist.md) — Projetar e otimizar schemas de banco Supabase
- [**Backend Specialist**](./backend-specialist.md) — Projetar e implementar arquitetura server-side
- [**Frontend Specialist**](./frontend-specialist.md) — Projetar e implementar interfaces de usuário
- [**Devops Specialist**](./devops-specialist.md) — Projetar e manter pipelines CI/CD

### 📱 Especialidades
- [**Mobile Specialist**](./mobile-specialist.md) — Desenvolver aplicações mobile nativas e cross-platform
- [**Documentation Writer**](./documentation-writer.md) — Criar documentação clara e abrangente

## Como Usar Estes Playbooks

### 1. Escolher o Agente Apropriado
Selecione o agente que melhor corresponde à sua tarefa específica no COMADEMIG.

### 2. Seguir o Ciclo PREVC
Todos os agentes seguem o ciclo obrigatório:
- **Plan**: Criar especificação técnica
- **Research**: Ler documentação e código existente
- **Execute**: Implementar (máximo 3 tentativas)
- **Validate**: Gerar evidências (screenshots/logs)
- **Complete**: Relatório final com vocabulário oficial

### 3. Aplicar Skills Obrigatórias
- **Análise Preventiva**: 10 minutos máximo antes de implementar
- **Verificação de Banco**: Via Power Supabase antes de operações
- **Compromisso de Honestidade**: Status real, não assumido
- **Funcionalidade sobre Testes**: Sistema funcionando > testes passando

### 4. Enriquecer com Contexto do Projeto
- Consultar documentação em `.context/docs/`
- Verificar padrões estabelecidos no código
- Seguir arquitetura Supabase + React + Asaas
- Manter tema e identidade visual do COMADEMIG

### 5. Capturar Aprendizados
Documentar descobertas no arquivo de documentação relevante para melhorar execuções futuras.

## Contexto do Projeto COMADEMIG

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Pagamentos**: Gateway Asaas com split para afiliados
- **Hospedagem**: Lovable com deploy automático

### Funcionalidades Principais
- Filiação Digital de profissionais veterinários
- Carteira Digital com QR Code para validação
- Sistema de Pagamentos integrado com Asaas
- Programa de Afiliados com comissões automáticas
- Gestão de Eventos e emissão de Certificados
- Área Administrativa completa
- Sistema de Suporte e Comunicação

### Padrões Críticos
- **Funcionalidade SEMPRE sobre testes**: Nunca remover funcionalidades para fazer testes passarem
- **Análise preventiva obrigatória**: 10 minutos de planejamento antes de implementar
- **Verificação de banco real**: Sempre via Power Supabase antes de operações
- **Honestidade absoluta**: Status real das implementações, não assumido
- **Comunicação em PT-BR**: Todas as comunicações e logs em português

## Limites de Tempo por Tarefa
- **Análise Preventiva**: 10 minutos máximo
- **Implementação**: 30 minutos máximo
- **Testes**: 15 minutos máximo
- **TOTAL**: 55 minutos máximo por tarefa

## Recursos Relacionados
- [Índice de Documentação](../docs/README.md)
- [Base de Conhecimento de Agentes](../../AGENTS.md)
- [Diretrizes do Contribuidor](../../CONTRIBUTING.md)
- [Skills Customizadas](../skills/)

---

**Última Atualização**: 22/01/2026  
**Versão**: 2.0 - Configurado para COMADEMIG com Regras RENUM