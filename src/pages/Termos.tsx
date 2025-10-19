import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTermosContent } from '@/hooks/useLegalPages';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Termos() {
  const { data: pageData, isLoading, error } = useTermosContent();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !pageData) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-red-600">Erro ao carregar os Termos de Uso.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const content = pageData.content_json;
  const lastUpdated = pageData.last_updated_at 
    ? format(new Date(pageData.last_updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Janeiro de 2024';

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {content.title}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Última atualização: {lastUpdated}
              </p>
            </CardHeader>
            <CardContent className="prose max-w-none">
              {content.sections.map((section, index) => (
                <div key={index} className="mb-6">
                  <h2>{section.title}</h2>
                  <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>
                  {section.items && section.items.length > 0 && (
                    <ul>
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}