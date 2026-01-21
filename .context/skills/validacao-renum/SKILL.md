# Skill: Validação RENUM (Auditoria de Qualidade)

Esta skill define o protocolo obrigatório de validação de tarefas antes de qualquer reporte de conclusão.

## ⚖️ Critérios de Aceite

1. **Evidência Técnica**: A IA deve anexar um log de execução, screenshot (via ferramenta de imagem se aplicável) ou saída de terminal que confirme o sucesso.
2. **Vocabulário RENUM**: O status final DEVE usar os prefixos:
   - ✅ **Implementado e validado**: Código funciona e foi testado com sucesso.
   - ⚠️ **Implementado não validado**: Código existe mas não pôde ser testado devido ao ambiente.
   - 🚧 **Mock/Hardcoded**: Solução temporária com dados estáticos.
3. **Persistência de Erros**: Se a IA atingir 3 tentativas de correção no mesmo erro, ela DEVE parar e reportar bloqueio técnico.

## 🛠️ Protocolo de Validação

1. **Verificação de Compilação**: O código compila/roda sem erros de sintaxe?
2. **Teste de Unidade/Integração**: Rodar comandos como `npm run test` ou scripts manuais de verificação.
3. **Auditoria de Conformidade**: As regras do `.spec/` foram 100% atendidas?

---
**Status da Skill**: ✅ Ativa
**Idioma**: PT-BR
