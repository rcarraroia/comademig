
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye } from "lucide-react";

const Noticias = () => {
  const noticias = [
    {
      id: 1,
      titulo: "Nova Diretoria da COMADEMIG é Empossada",
      resumo: "Cerimônia de posse da nova diretoria aconteceu na sede da convenção com a presença de pastores de todo o estado de Minas Gerais.",
      conteudo: "A cerimônia de posse da nova diretoria da COMADEMIG aconteceu no último sábado, dia 2 de dezembro, na sede da convenção em Belo Horizonte. O evento contou com a presença de mais de 200 pastores de todo o estado...",
      autor: "Pastor João Silva",
      data: "2 de Dezembro de 2024",
      categoria: "institucional",
      imagem: "/placeholder-news.jpg",
      visualizacoes: 245
    },
    {
      id: 2,
      titulo: "Campanha de Arrecadação para Obras Sociais",
      resumo: "A COMADEMIG lança campanha para arrecadação de fundos destinados a obras sociais em comunidades carentes do estado.",
      conteudo: "Com o objetivo de ampliar o alcance das obras sociais em comunidades carentes de Minas Gerais, a COMADEMIG lançou uma campanha de arrecadação de fundos...",
      autor: "Pastor Maria Santos",
      data: "28 de Novembro de 2024",
      categoria: "social",
      imagem: "/placeholder-news.jpg",
      visualizacoes: 189
    },
    {
      id: 3,
      titulo: "Parceria com Seminário Teológico",
      resumo: "Firmada parceria entre a COMADEMIG e o Seminário Teológico das Assembleias de Deus para capacitação ministerial.",
      conteudo: "A COMADEMIG assinou um acordo de parceria com o Seminário Teológico das Assembleias de Deus para oferecer cursos de capacitação ministerial...",
      autor: "Pastor Carlos Oliveira",
      data: "25 de Novembro de 2024",
      categoria: "educacao",
      imagem: "/placeholder-news.jpg",
      visualizacoes: 156
    },
    {
      id: 4,
      titulo: "Congresso Estadual Bate Record de Participação",
      resumo: "O Congresso Estadual 2024 registrou a maior participação da história da COMADEMIG com mais de 2.500 participantes.",
      conteudo: "O Congresso Estadual da COMADEMIG 2024 entrou para a história como o evento com maior participação já registrado pela convenção...",
      autor: "Pastor Roberto Lima",
      data: "20 de Novembro de 2024",
      categoria: "eventos",
      imagem: "/placeholder-news.jpg",
      visualizacoes: 387
    },
    {
      id: 5,
      titulo: "Projeto de Evangelização no Interior",
      resumo: "Novo projeto visa levar a mensagem do Evangelho para cidades do interior mineiro ainda não alcançadas.",
      conteudo: "A COMADEMIG deu início a um ambicioso projeto de evangelização voltado para cidades do interior de Minas Gerais...",
      autor: "Pastor Antônio Pereira",
      data: "15 de Novembro de 2024",
      categoria: "evangelismo",
      imagem: "/placeholder-news.jpg",
      visualizacoes: 298
    },
    {
      id: 6,
      titulo: "Seminário sobre Família Cristã",
      resumo: "Evento especial abordou temas relacionados à família cristã e sua importância na sociedade contemporânea.",
      conteudo: "O seminário sobre família cristã realizado pela COMADEMIG reuniu especialistas e pastores para discutir os desafios enfrentados pela família moderna...",
      autor: "Pastor José Martins",
      data: "10 de Novembro de 2024",
      categoria: "familia",
      imagem: "/placeholder-news.jpg",
      visualizacoes: 167
    }
  ];

  const categorias = [
    { value: "institucional", label: "Institucional", color: "bg-comademig-blue" },
    { value: "social", label: "Social", color: "bg-green-500" },
    { value: "educacao", label: "Educação", color: "bg-purple-500" },
    { value: "eventos", label: "Eventos", color: "bg-comademig-gold" },
    { value: "evangelismo", label: "Evangelismo", color: "bg-red-500" },
    { value: "familia", label: "Família", color: "bg-pink-500" }
  ];

  const getCategoriaInfo = (categoria: string) => {
    return categorias.find(cat => cat.value === categoria) || categorias[0];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Notícias
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Fique por dentro das últimas novidades da COMADEMIG
            </p>
          </div>
        </div>
      </section>

      {/* Notícia Principal */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="md:order-2">
                  <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-inter">Imagem Principal</span>
                  </div>
                </div>
                <div className="md:order-1 p-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className={`${getCategoriaInfo(noticias[0].categoria).color} text-white`}>
                      {getCategoriaInfo(noticias[0].categoria).label}
                    </Badge>
                    <Badge variant="outline" className="text-gray-600">
                      Em Destaque
                    </Badge>
                  </div>
                  <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-comademig-blue mb-4">
                    {noticias[0].titulo}
                  </h2>
                  <p className="font-inter text-gray-700 leading-relaxed mb-6">
                    {noticias[0].resumo}
                  </p>
                  <div className="flex items-center space-x-4 text-gray-600 mb-6">
                    <div className="flex items-center space-x-1">
                      <User size={16} />
                      <span className="font-inter text-sm">{noticias[0].autor}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span className="font-inter text-sm">{noticias[0].data}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye size={16} />
                      <span className="font-inter text-sm">{noticias[0].visualizacoes} visualizações</span>
                    </div>
                  </div>
                  <Button 
                    asChild
                    className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold"
                  >
                    <Link to={`/noticias/${noticias[0].id}`}>Ler Notícia Completa</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Outras Notícias */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Outras Notícias
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Acompanhe todas as novidades e acontecimentos da convenção
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {noticias.slice(1).map((noticia) => (
              <Card key={noticia.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader>
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500 font-inter text-sm">Imagem da Notícia</span>
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={`${getCategoriaInfo(noticia.categoria).color} text-white`}>
                      {getCategoriaInfo(noticia.categoria).label}
                    </Badge>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Eye size={14} />
                      <span className="font-inter text-xs">{noticia.visualizacoes}</span>
                    </div>
                  </div>
                  <CardTitle className="font-montserrat text-comademig-blue line-clamp-2">
                    {noticia.titulo}
                  </CardTitle>
                  <CardDescription className="font-inter text-sm text-gray-500 flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{noticia.autor}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{noticia.data}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-inter text-gray-700 mb-4 line-clamp-3">
                    {noticia.resumo}
                  </p>
                  <Button 
                    asChild
                    size="sm" 
                    variant="outline" 
                    className="border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat"
                  >
                    <Link to={`/noticias/${noticia.id}`}>Ler Mais</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-comademig-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4">
            Receba Nossas Notícias
          </h2>
          <p className="font-inter text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Cadastre-se em nossa newsletter e receba as últimas notícias da COMADEMIG em seu e-mail
          </p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input 
              type="email" 
              placeholder="Seu e-mail" 
              className="flex-grow px-4 py-3 rounded-lg text-gray-900 font-inter"
            />
            <Button 
              size="lg" 
              className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold"
            >
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Noticias;
