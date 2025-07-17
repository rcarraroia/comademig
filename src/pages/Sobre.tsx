
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, History, Users } from "lucide-react";

const Sobre = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Sobre a COMADEMIG
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Conheça nossa história, missão e compromisso com o Reino de Deus
            </p>
          </div>
        </div>
      </section>

      {/* Missão e Visão */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-2xl text-comademig-blue">
                  Nossa Missão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-700 text-center leading-relaxed">
                  Fortalecer e unir os ministros das Assembleias de Deus em Minas Gerais, 
                  promovendo a comunhão fraternal, o crescimento espiritual e a expansão 
                  do Reino de Deus através da pregação do Evangelho e da formação ministerial.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-2xl text-comademig-blue">
                  Nossa Visão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-700 text-center leading-relaxed">
                  Ser reconhecida como uma convenção que promove a unidade ministerial, 
                  a excelência na pregação da Palavra e o crescimento saudável das igrejas 
                  locais, impactando positivamente toda a sociedade mineira.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* História */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Nossa História
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Décadas de compromisso com a obra de Deus em Minas Gerais
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-comademig-gold rounded-full flex items-center justify-center mr-4">
                  <History className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-montserrat font-semibold text-xl text-comademig-blue">
                  Fundação e Primeiros Anos
                </h3>
              </div>
              <p className="font-inter text-gray-700 leading-relaxed mb-6">
                A COMADEMIG foi fundada em 1962, nascendo da necessidade de unir os ministros das 
                Assembleias de Deus em Minas Gerais. Desde o início, a convenção teve como objetivo 
                principal fortalecer a comunhão entre os pastores e promover o crescimento ordenado 
                das igrejas locais.
              </p>
              <p className="font-inter text-gray-700 leading-relaxed mb-6">
                Ao longo dos anos, a COMADEMIG tem sido um pilar fundamental na formação ministerial 
                e na organização eclesiástica das Assembleias de Deus em nosso estado. Através de 
                congressos, seminários e encontros, tem contribuído significativamente para o 
                crescimento espiritual e numérico das igrejas.
              </p>
              <p className="font-inter text-gray-700 leading-relaxed">
                Hoje, a COMADEMIG conta com centenas de ministros associados e continua seu trabalho 
                de edificação do corpo de Cristo, sempre pautada nos princípios bíblicos e na 
                tradição pentecostal das Assembleias de Deus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Linha do Tempo */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Marcos Importantes
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Principais acontecimentos que marcaram nossa trajetória
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Marco 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                  <span className="font-montserrat font-bold text-white">1962</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-montserrat font-semibold text-xl text-comademig-blue mb-2">
                    Fundação da COMADEMIG
                  </h3>
                  <p className="font-inter text-gray-700">
                    Fundação oficial da Convenção de Ministros das Assembleias de Deus em Minas Gerais, 
                    reunindo os primeiros pastores do estado.
                  </p>
                </div>
              </div>

              {/* Marco 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                  <span className="font-montserrat font-bold text-white">1975</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-montserrat font-semibold text-xl text-comademig-blue mb-2">
                    Primeiro Congresso Estadual
                  </h3>
                  <p className="font-inter text-gray-700">
                    Realização do primeiro Congresso Estadual da COMADEMIG, evento que se tornou 
                    uma tradição anual na convenção.
                  </p>
                </div>
              </div>

              {/* Marco 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                  <span className="font-montserrat font-bold text-white">1990</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-montserrat font-semibold text-xl text-comademig-blue mb-2">
                    Expansão para o Interior
                  </h3>
                  <p className="font-inter text-gray-700">
                    Início da expansão organizada para o interior do estado, com a criação 
                    de campos regionais e setores ministeriais.
                  </p>
                </div>
              </div>

              {/* Marco 4 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                  <span className="font-montserrat font-bold text-white">2010</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-montserrat font-semibold text-xl text-comademig-blue mb-2">
                    Modernização e Tecnologia
                  </h3>
                  <p className="font-inter text-gray-700">
                    Implementação de novos sistemas de comunicação e tecnologia para melhor 
                    atender aos ministros e igrejas associadas.
                  </p>
                </div>
              </div>

              {/* Marco 5 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center">
                  <span className="font-montserrat font-bold text-white">2024</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-montserrat font-semibold text-xl text-comademig-blue mb-2">
                    Nova Identidade Visual
                  </h3>
                  <p className="font-inter text-gray-700">
                    Lançamento da nova identidade visual e plataforma digital, modernizando 
                    a comunicação com o público e fortalecendo a presença online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-16 bg-comademig-blue text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4">
              COMADEMIG em Números
            </h2>
            <p className="font-inter text-xl text-gray-200">
              O impacto da nossa obra em Minas Gerais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="font-montserrat font-bold text-4xl mb-2">500+</div>
              <div className="font-inter text-gray-300">Ministros Associados</div>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="font-montserrat font-bold text-4xl mb-2">1,200+</div>
              <div className="font-inter text-gray-300">Igrejas Locais</div>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="font-montserrat font-bold text-4xl mb-2">60+</div>
              <div className="font-inter text-gray-300">Anos de História</div>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="font-montserrat font-bold text-4xl mb-2">20+</div>
              <div className="font-inter text-gray-300">Campos Regionais</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;
