import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Termos() {
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Termos de Uso
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Última atualização: Janeiro de 2024
              </p>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h2>1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o site da COMADEMIG, você concorda em cumprir e estar 
                vinculado aos seguintes termos e condições de uso.
              </p>

              <h2>2. Descrição do Serviço</h2>
              <p>
                O site da COMADEMIG oferece informações sobre a convenção, serviços de 
                filiação, eventos, e acesso ao portal do membro para filiados.
              </p>

              <h2>3. Registro e Conta de Usuário</h2>
              <p>Para acessar certas funcionalidades, você deve:</p>
              <ul>
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a confidencialidade de sua senha</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
                <li>Notificar imediatamente sobre uso não autorizado</li>
              </ul>

              <h2>4. Uso Aceitável</h2>
              <p>Você concorda em NÃO usar o site para:</p>
              <ul>
                <li>Atividades ilegais ou não autorizadas</li>
                <li>Transmitir conteúdo ofensivo ou inadequado</li>
                <li>Interferir no funcionamento do site</li>
                <li>Tentar acessar áreas restritas</li>
                <li>Violar direitos de propriedade intelectual</li>
              </ul>

              <h2>5. Filiação e Pagamentos</h2>
              <p>
                A filiação à COMADEMIG está sujeita a aprovação e pagamento das taxas 
                estabelecidas. Os pagamentos são processados através de gateways seguros 
                e estão sujeitos aos termos dos provedores de pagamento.
              </p>

              <h2>6. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo do site, incluindo textos, imagens, logos e design, 
                é propriedade da COMADEMIG e está protegido por leis de direitos autorais.
              </p>

              <h2>7. Limitação de Responsabilidade</h2>
              <p>
                A COMADEMIG não se responsabiliza por danos diretos, indiretos, 
                incidentais ou consequenciais decorrentes do uso do site.
              </p>

              <h2>8. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alterações entrarão em vigor imediatamente após a publicação no site.
              </p>

              <h2>9. Rescisão</h2>
              <p>
                Podemos suspender ou encerrar sua conta a qualquer momento, por qualquer 
                motivo, incluindo violação destes termos.
              </p>

              <h2>10. Lei Aplicável</h2>
              <p>
                Estes termos são regidos pelas leis brasileiras, e qualquer disputa 
                será resolvida nos tribunais competentes de Belo Horizonte, MG.
              </p>

              <h2>11. Contato</h2>
              <p>
                Para questões sobre estes termos, entre em contato:
              </p>
              <p>
                <strong>E-mail:</strong> juridico@comademig.org.br<br />
                <strong>Telefone:</strong> (31) 3333-4444<br />
                <strong>Endereço:</strong> Belo Horizonte, MG
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}