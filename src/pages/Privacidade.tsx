import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacidade() {
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Política de Privacidade
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Última atualização: Janeiro de 2024
              </p>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h2>1. Informações que Coletamos</h2>
              <p>
                A COMADEMIG coleta informações pessoais quando você se registra em nosso site, 
                se inscreve em eventos, ou utiliza nossos serviços. As informações podem incluir:
              </p>
              <ul>
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone</li>
                <li>CPF</li>
                <li>Informações ministeriais (igreja, cargo, etc.)</li>
              </ul>

              <h2>2. Como Usamos suas Informações</h2>
              <p>Utilizamos suas informações pessoais para:</p>
              <ul>
                <li>Processar sua filiação à COMADEMIG</li>
                <li>Emitir carteira digital e certidões</li>
                <li>Comunicar sobre eventos e atividades</li>
                <li>Fornecer suporte técnico</li>
                <li>Cumprir obrigações legais</li>
              </ul>

              <h2>3. Compartilhamento de Informações</h2>
              <p>
                Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, 
                exceto quando necessário para:
              </p>
              <ul>
                <li>Processar pagamentos (através de gateways seguros)</li>
                <li>Cumprir obrigações legais</li>
                <li>Proteger nossos direitos e segurança</li>
              </ul>

              <h2>4. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança adequadas para proteger suas informações 
                pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>

              <h2>5. Seus Direitos (LGPD)</h2>
              <p>Conforme a Lei Geral de Proteção de Dados, você tem o direito de:</p>
              <ul>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou incorretos</li>
                <li>Solicitar a exclusão de dados</li>
                <li>Revogar consentimento</li>
                <li>Portabilidade dos dados</li>
              </ul>

              <h2>6. Contato</h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                entre em contato conosco:
              </p>
              <p>
                <strong>E-mail:</strong> privacidade@comademig.org.br<br />
                <strong>Telefone:</strong> (31) 3333-4444
              </p>

              <h2>7. Alterações na Política</h2>
              <p>
                Esta política pode ser atualizada periodicamente. Recomendamos que você 
                revise esta página regularmente para se manter informado sobre nossas práticas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}