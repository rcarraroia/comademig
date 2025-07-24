
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Building, FileText, Gavel, Users, CheckCircle, ArrowRight, Star } from "lucide-react";

const Regularizacao = () => {
  const navigate = useNavigate();

  const handleRegularizeNow = () => {
    navigate("/dashboard/checkout-regularizacao");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-comademig-blue">
          Regularização e Legalização de Igrejas
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Oferecemos serviços completos para a regularização e legalização de igrejas evangélicas no Brasil. 
          Nossa equipe especializada cuida de toda a documentação necessária para que sua igreja opere dentro da legalidade.
        </p>
      </div>

      {/* Hero Section com CTA Principal */}
      <Card className="bg-gradient-to-r from-comademig-blue to-blue-700 text-white">
        <CardContent className="p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl lg:text-3xl font-bold">
                Legalize sua Igreja Agora!
              </h2>
              <p className="text-lg opacity-90">
                Processo completo de regularização com acompanhamento especializado. 
                Documentação segura e dentro dos prazos legais.
              </p>
              <Button 
                onClick={handleRegularizeNow}
                className="bg-comademig-gold hover:bg-comademig-gold/90 text-comademig-blue font-semibold px-8 py-3 text-lg"
              >
                Regularize Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex justify-center">
              <Building className="h-32 w-32 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Serviços Oferecidos */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-comademig-blue text-center">
          Nossos Serviços de Regularização
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <FileText className="h-12 w-12 text-comademig-blue mb-4" />
              <CardTitle className="text-comademig-blue">Estatuto Social</CardTitle>
              <CardDescription>
                Elaboração de estatuto social completo e personalizado para sua igreja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Redação personalizada</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Adequação legal</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Registro em cartório</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <Gavel className="h-12 w-12 text-comademig-blue mb-4" />
              <CardTitle className="text-comademig-blue">Ata de Fundação</CardTitle>
              <CardDescription>
                Documento oficial de fundação da igreja com todas as formalidades legais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Documentação legal</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Validação jurídica</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Registro oficial</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <Users className="h-12 w-12 text-comademig-blue mb-4" />
              <CardTitle className="text-comademig-blue">Ata de Eleição</CardTitle>
              <CardDescription>
                Documentação da eleição da diretoria com validade legal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Processo eleitoral</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Documentação completa</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Registro em cartório</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção CNPJ */}
      <Card className="bg-comademig-light border-comademig-gold border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Badge className="bg-comademig-gold text-comademig-blue text-lg px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Mais Procurado
            </Badge>
          </div>
          <CardTitle className="text-2xl text-comademig-blue">Solicitação de CNPJ</CardTitle>
          <CardDescription className="text-lg">
            Processo completo de obtenção do CNPJ para sua igreja com acompanhamento especializado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-comademig-blue">Documentos Inclusos:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Requerimento de inscrição</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Formulário CNPJ/FCN</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Documentação complementar</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Acompanhamento do processo</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-comademig-blue">Benefícios:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Isenção de impostos</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Abertura de conta bancária</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Emissão de notas fiscais</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Regularidade fiscal</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-4">
            <Button 
              onClick={handleRegularizeNow}
              size="lg"
              className="bg-comademig-blue hover:bg-comademig-blue/90 text-white px-8 py-3"
            >
              Solicitar CNPJ Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Por que Escolher Nossos Serviços */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-comademig-blue text-center">
          Por que Escolher Nossos Serviços?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-4">
            <div className="bg-comademig-blue text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-comademig-blue">Experiência Comprovada</h3>
            <p className="text-gray-600 text-sm">
              Mais de 10 anos de experiência em regularização de igrejas evangélicas
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="bg-comademig-blue text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-comademig-blue">Documentação Completa</h3>
            <p className="text-gray-600 text-sm">
              Todos os documentos necessários para regularização completa da sua igreja
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="bg-comademig-blue text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-comademig-blue">Suporte Especializado</h3>
            <p className="text-gray-600 text-sm">
              Acompanhamento personalizado durante todo o processo de regularização
            </p>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <Card className="bg-comademig-gold text-comademig-blue">
        <CardContent className="p-8 text-center space-y-6">
          <h2 className="text-2xl font-bold">
            Pronto para Regularizar sua Igreja?
          </h2>
          <p className="text-lg">
            Entre em contato conosco e inicie hoje mesmo o processo de regularização da sua igreja.
          </p>
          <Button 
            onClick={handleRegularizeNow}
            size="lg"
            className="bg-comademig-blue hover:bg-comademig-blue/90 text-white px-12 py-4 text-lg"
          >
            Começar Regularização
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Regularizacao;
