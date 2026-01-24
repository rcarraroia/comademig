-- ============================================
-- Migração: Criar Tabela e Adicionar Páginas Legais
-- Data: 2025-01-18
-- Descrição: Cria tabela content_management e insere registros de 
--            Política de Privacidade e Termos de Uso
-- ============================================

-- A tabela content_management já existe com a estrutura:
-- - page_name (TEXT UNIQUE NOT NULL)
-- - content_json (JSONB)
-- - last_updated_at (TIMESTAMPTZ)
-- - created_at (TIMESTAMPTZ)

-- Não precisa criar a tabela, apenas inserir os dados

-- Inserir Política de Privacidade
INSERT INTO content_management (page_name, content_json, last_updated_at)
VALUES (
  'privacidade',
  '{
    "title": "Política de Privacidade",
    "sections": [
      {
        "title": "1. Informações que Coletamos",
        "content": "A COMADEMIG coleta informações pessoais quando você se registra em nosso site, se inscreve em eventos, ou utiliza nossos serviços. As informações podem incluir:",
        "items": [
          "Nome completo",
          "Endereço de e-mail",
          "Número de telefone",
          "CPF",
          "Informações ministeriais (igreja, cargo, etc.)"
        ]
      },
      {
        "title": "2. Como Usamos suas Informações",
        "content": "Utilizamos suas informações pessoais para:",
        "items": [
          "Processar sua filiação à COMADEMIG",
          "Emitir carteira digital e certidões",
          "Comunicar sobre eventos e atividades",
          "Fornecer suporte técnico",
          "Cumprir obrigações legais"
        ]
      },
      {
        "title": "3. Compartilhamento de Informações",
        "content": "Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto quando necessário para:",
        "items": [
          "Processar pagamentos (através de gateways seguros)",
          "Cumprir obrigações legais",
          "Proteger nossos direitos e segurança"
        ]
      },
      {
        "title": "4. Segurança dos Dados",
        "content": "Implementamos medidas de segurança adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.",
        "items": []
      },
      {
        "title": "5. Seus Direitos (LGPD)",
        "content": "Conforme a Lei Geral de Proteção de Dados, você tem o direito de:",
        "items": [
          "Acessar seus dados pessoais",
          "Corrigir dados incompletos ou incorretos",
          "Solicitar a exclusão de dados",
          "Revogar consentimento",
          "Portabilidade dos dados"
        ]
      },
      {
        "title": "6. Contato",
        "content": "Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco:\n\nE-mail: privacidade@comademig.org.br\nTelefone: (31) 3333-4444",
        "items": []
      },
      {
        "title": "7. Alterações na Política",
        "content": "Esta política pode ser atualizada periodicamente. Recomendamos que você revise esta página regularmente para se manter informado sobre nossas práticas.",
        "items": []
      }
    ]
  }'::jsonb,
  NOW()
)
ON CONFLICT (page_name) 
DO UPDATE SET
  content_json = EXCLUDED.content_json,
  last_updated_at = NOW();
-- Inserir Termos de Uso
INSERT INTO content_management (page_name, content_json, last_updated_at)
VALUES (
  'termos',
  '{
    "title": "Termos de Uso",
    "sections": [
      {
        "title": "1. Aceitação dos Termos",
        "content": "Ao acessar e usar o site da COMADEMIG, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.",
        "items": []
      },
      {
        "title": "2. Descrição do Serviço",
        "content": "O site da COMADEMIG oferece informações sobre a convenção, serviços de filiação, eventos, e acesso ao portal do membro para filiados.",
        "items": []
      },
      {
        "title": "3. Registro e Conta de Usuário",
        "content": "Para acessar certas funcionalidades, você deve:",
        "items": [
          "Fornecer informações verdadeiras e atualizadas",
          "Manter a confidencialidade de sua senha",
          "Ser responsável por todas as atividades em sua conta",
          "Notificar imediatamente sobre uso não autorizado"
        ]
      },
      {
        "title": "4. Uso Aceitável",
        "content": "Você concorda em NÃO usar o site para:",
        "items": [
          "Atividades ilegais ou não autorizadas",
          "Transmitir conteúdo ofensivo ou inadequado",
          "Interferir no funcionamento do site",
          "Tentar acessar áreas restritas",
          "Violar direitos de propriedade intelectual"
        ]
      },
      {
        "title": "5. Filiação e Pagamentos",
        "content": "A filiação à COMADEMIG está sujeita a aprovação e pagamento das taxas estabelecidas. Os pagamentos são processados através de gateways seguros e estão sujeitos aos termos dos provedores de pagamento.",
        "items": []
      },
      {
        "title": "6. Propriedade Intelectual",
        "content": "Todo o conteúdo do site, incluindo textos, imagens, logos e design, é propriedade da COMADEMIG e está protegido por leis de direitos autorais.",
        "items": []
      },
      {
        "title": "7. Limitação de Responsabilidade",
        "content": "A COMADEMIG não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso do site.",
        "items": []
      },
      {
        "title": "8. Modificações dos Termos",
        "content": "Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site.",
        "items": []
      },
      {
        "title": "9. Rescisão",
        "content": "Podemos suspender ou encerrar sua conta a qualquer momento, por qualquer motivo, incluindo violação destes termos.",
        "items": []
      },
      {
        "title": "10. Lei Aplicável",
        "content": "Estes termos são regidos pelas leis brasileiras, e qualquer disputa será resolvida nos tribunais competentes de Belo Horizonte, MG.",
        "items": []
      },
      {
        "title": "11. Contato",
        "content": "Para questões sobre estes termos, entre em contato:\n\nE-mail: juridico@comademig.org.br\nTelefone: (31) 3333-4444\nEndereço: Belo Horizonte, MG",
        "items": []
      }
    ]
  }'::jsonb,
  NOW()
)
ON CONFLICT (page_name) 
DO UPDATE SET
  content_json = EXCLUDED.content_json,
  last_updated_at = NOW();
-- Comentário final
COMMENT ON TABLE content_management IS 'Gerencia conteúdo dinâmico das páginas do site, incluindo páginas legais (LGPD)';
