
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Loader2 } from "lucide-react";
import { useLeadershipContent } from "@/hooks/useContent";

const Lideranca = () => {
  const { content, isLoading, error, hasCustomContent } = useLeadershipContent();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar conteúdo da página de liderança:', error);
    // Continua com conteúdo padrão em caso de erro
  }

  // Dados padrão caso não haja conteúdo personalizado
  const presidente = {
    nome: "Pastor João Silva Santos",
    cargo: "Presidente da COMADEMIG",
    bio: "Pastor há mais de 30 anos, formado em Teologia e Administração Eclesiástica. Lidera a Igreja Assembleia de Deus Central de Belo Horizonte desde 1995. Casado com a Irmã Maria Santos, pai de 3 filhos.",
    imagem: "/placeholder-image.jpg",
    email: "presidencia@comademig.org.br",
    telefone: "(31) 3333-4444"
  };

  const diretoria = [
    {
      nome: "Pastor Carlos Oliveira",
      cargo: "Vice-Presidente",
      bio: "Pastor há 25 anos, responsável pelo campo de Juiz de Fora. Especialista em Missões e Evangelismo.",
      imagem: "/placeholder-image.jpg"
    },
    {
      nome: "Pastor Roberto Lima",
      cargo: "Secretário Geral",
      bio: "Pastor há 20 anos, formado em Teologia e Direito. Atua na área jurídica da convenção.",
      imagem: "/placeholder-image.jpg"
    },
    {
      nome: "Pastor Antônio Pereira",
      cargo: "Tesoureiro",
      bio: "Pastor há 28 anos, contador formado. Responsável pela gestão financeira da convenção.",
      imagem: "/placeholder-image.jpg"
    }
  ];

  const conselho = [
    {
      nome: "Pastor José Martins",
      cargo: "Conselheiro Fiscal",
      bio: "Pastor veterano com mais de 40 anos de ministério. Pioneiro em várias igrejas do interior.",
      imagem: "/placeholder-image.jpg"
    },
    {
      nome: "Pastor Francisco Costa",
      cargo: "Conselheiro Doutrinário",
      bio: "Doutor em Teologia, professor do seminário. Especialista em doutrina bíblica.",
      imagem: "/placeholder-image.jpg"
    },
    {
      nome: "Pastor Miguel Santos",
      cargo: "Conselheiro de Ética",
      bio: "Pastor há 35 anos, especialista em aconselhamento pastoral e ética ministerial.",
      imagem: "/placeholder-image.jpg"
    }
  ];

  const camposRegionais = [
    { nome: "Campo de Belo Horizonte", responsavel: "Pastor João Silva Santos", cidades: "Belo Horizonte, Contagem, Betim" },
    { nome: "Campo de Juiz de Fora", responsavel: "Pastor Carlos Oliveira", cidades: "Juiz de Fora, Muriaé, Cataguases" },
    { nome: "Campo de Uberlândia", responsavel: "Pastor Ricardo Alves", cidades: "Uberlândia, Uberaba, Araguari" },
    { nome: "Campo de Montes Claros", responsavel: "Pastor Paulo Ferreira", cidades: "Montes Claros, Pirapora, Januária" },
    { nome: "Campo de Governador Valadares", responsavel: "Pastor Marcos Souza", cidades: "Gov. Valadares, Ipatinga, Coronel Fabriciano" },
    { nome: "Campo de Pouso Alegre", responsavel: "Pastor André Rodrigues", cidades: "Pouso Alegre, Varginha, Três Corações" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              {content.titulo}
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              {content.descricao}
            </p>
          </div>
        </div>
      </section>

      {/* Presidente */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Presidência
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Liderança que guia a convenção com sabedoria e dedicação
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 font-inter text-sm">Foto do Presidente</span>
                    </div>
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="font-montserrat font-bold text-2xl text-comademig-blue mb-2">
                      {presidente.nome}
                    </h3>
                    <p className="font-inter text-comademig-gold font-semibold text-lg mb-4">
                      {presidente.cargo}
                    </p>
                    <p className="font-inter text-gray-700 leading-relaxed mb-6">
                      {presidente.bio}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail size={18} />
                        <span className="font-inter text-sm">{presidente.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone size={18} />
                        <span className="font-inter text-sm">{presidente.telefone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Diretoria */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Diretoria Executiva
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Equipe executiva que trabalha pela excelência ministerial
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {diretoria.map((membro, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-500 font-inter text-xs">Foto</span>
                  </div>
                  <CardTitle className="font-montserrat text-comademig-blue">
                    {membro.nome}
                  </CardTitle>
                  <CardDescription className="font-inter text-comademig-gold font-semibold">
                    {membro.cargo}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-inter text-gray-700 text-sm leading-relaxed text-center">
                    {membro.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Conselho */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Conselho Administrativo
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Conselheiros que zelam pela ordem e crescimento da convenção
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {conselho.map((membro, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-500 font-inter text-xs">Foto</span>
                  </div>
                  <CardTitle className="font-montserrat text-comademig-blue">
                    {membro.nome}
                  </CardTitle>
                  <CardDescription className="font-inter text-comademig-gold font-semibold">
                    {membro.cargo}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-inter text-gray-700 text-sm leading-relaxed text-center">
                    {membro.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Campos Regionais */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Campos Regionais
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Divisão territorial para melhor atendimento às igrejas locais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camposRegionais.map((campo, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="font-montserrat text-comademig-blue text-lg">
                    {campo.nome}
                  </CardTitle>
                  <CardDescription className="font-inter text-comademig-gold font-semibold">
                    {campo.responsavel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-inter text-gray-700 text-sm">
                    <span className="font-semibold">Principais cidades:</span> {campo.cidades}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Indicador de conteúdo personalizado (apenas para admins) */}
      {hasCustomContent && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Conteúdo Personalizado
          </div>
        </div>
      )}
    </div>
  );
};

export default Lideranca;
