
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Filter } from "lucide-react";

const Eventos = () => {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroMes, setFiltroMes] = useState<string>("todos");

  const eventos = [
    {
      id: 1,
      titulo: "Congresso Estadual 2024",
      data: "15 a 17 de Novembro de 2024",
      hora: "19:00",
      local: "Centro de Convenções - Belo Horizonte",
      cidade: "Belo Horizonte",
      tipo: "congresso",
      mes: "novembro",
      descricao: "O maior evento do ano reunindo pastores, líderes e membros de todo o estado de Minas Gerais para três dias de adoração, pregação e comunhão.",
      preletor: "Pastor Silas Malafaia",
      vagas: "2000",
      valor: "R$ 120,00",
      status: "inscricoes-abertas"
    },
    {
      id: 2,
      titulo: "Seminário de Liderança Jovem",
      data: "5 a 7 de Outubro de 2024",
      hora: "08:00",
      local: "Igreja AD Central - Juiz de Fora",
      cidade: "Juiz de Fora",
      tipo: "seminario",
      mes: "outubro",
      descricao: "Capacitação específica para líderes jovens, abordando temas como liderança, evangelismo e discipulado na era digital.",
      preletor: "Pastor André Fernandes",
      vagas: "300",
      valor: "R$ 80,00",
      status: "inscricoes-abertas"
    },
    {
      id: 3,
      titulo: "Encontro de Pastores",
      data: "22 a 24 de Setembro de 2024",
      hora: "19:00",
      local: "Hotel Fazenda Recanto - Uberlândia",
      cidade: "Uberlândia",
      tipo: "encontro",
      mes: "setembro",
      descricao: "Encontro exclusivo para pastores, com foco em crescimento ministerial, desafios pastorais e renovação espiritual.",
      preletor: "Pastor José Wellington",
      vagas: "150",
      valor: "R$ 200,00",
      status: "inscricoes-abertas"
    },
    {
      id: 4,
      titulo: "Congresso de Missões",
      data: "10 a 12 de Dezembro de 2024",
      hora: "19:00",
      local: "Igreja AD Betânia - Montes Claros",
      cidade: "Montes Claros",
      tipo: "congresso",
      mes: "dezembro",
      descricao: "Evento focado em missões nacionais e transculturais, com testimonios de missionários e desafios para a igreja local.",
      preletor: "Missionário João Batista",
      vagas: "800",
      valor: "R$ 90,00",
      status: "em-breve"
    },
    {
      id: 5,
      titulo: "Retiro Espiritual de Obreiros",
      data: "18 a 20 de Janeiro de 2025",
      hora: "14:00",
      local: "Chácara Shalom - Pouso Alegre",
      cidade: "Pouso Alegre",
      tipo: "retiro",
      mes: "janeiro",
      descricao: "Retiro espiritual para obreiros e líderes, com momentos de oração, jejum e renovação espiritual.",
      preletor: "Pastor Carlos Oliveira",
      vagas: "100",
      valor: "R$ 150,00",
      status: "em-breve"
    },
    {
      id: 6,
      titulo: "Conferência de Avivamento",
      data: "28 a 30 de Março de 2025",
      hora: "19:00",
      local: "Ginásio Municipal - Governador Valadares",
      cidade: "Governador Valadares",
      tipo: "conferencia",
      mes: "março",
      descricao: "Conferência especial com foco em avivamento espiritual e renovação da igreja local.",
      preletor: "Pastor Claudio Duarte",
      vagas: "1500",
      valor: "R$ 100,00",
      status: "em-breve"
    }
  ];

  const tiposEvento = [
    { value: "todos", label: "Todos os tipos" },
    { value: "congresso", label: "Congressos" },
    { value: "seminario", label: "Seminários" },
    { value: "encontro", label: "Encontros" },
    { value: "retiro", label: "Retiros" },
    { value: "conferencia", label: "Conferências" }
  ];

  const meses = [
    { value: "todos", label: "Todos os meses" },
    { value: "setembro", label: "Setembro" },
    { value: "outubro", label: "Outubro" },
    { value: "novembro", label: "Novembro" },
    { value: "dezembro", label: "Dezembro" },
    { value: "janeiro", label: "Janeiro" },
    { value: "março", label: "Março" }
  ];

  const eventosFiltrados = eventos.filter(evento => {
    const filtroTipoMatch = filtroTipo === "todos" || evento.tipo === filtroTipo;
    const filtroMesMatch = filtroMes === "todos" || evento.mes === filtroMes;
    return filtroTipoMatch && filtroMesMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "inscricoes-abertas":
        return <Badge className="bg-green-500 text-white">Inscrições Abertas</Badge>;
      case "em-breve":
        return <Badge className="bg-yellow-500 text-white">Em Breve</Badge>;
      case "encerrado":
        return <Badge className="bg-gray-500 text-white">Encerrado</Badge>;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipoObj = tiposEvento.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label.slice(0, -1) : tipo;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Eventos
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Participe dos nossos eventos e fortaleça sua fé
            </p>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-8 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-comademig-blue" />
              <span className="font-inter font-medium text-comademig-blue">Filtros:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tiposEvento.map((tipo) => (
                <Button
                  key={tipo.value}
                  variant={filtroTipo === tipo.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroTipo(tipo.value)}
                  className={`font-inter ${
                    filtroTipo === tipo.value
                      ? "bg-comademig-blue text-white"
                      : "border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white"
                  }`}
                >
                  {tipo.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {meses.map((mes) => (
                <Button
                  key={mes.value}
                  variant={filtroMes === mes.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroMes(mes.value)}
                  className={`font-inter ${
                    filtroMes === mes.value
                      ? "bg-comademig-gold text-white"
                      : "border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white"
                  }`}
                >
                  {mes.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Eventos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Próximos Eventos
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Confira nossa agenda de eventos e não perca nenhuma oportunidade de crescimento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventosFiltrados.map((evento) => (
              <Card key={evento.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500 font-inter text-sm">Imagem do Evento</span>
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-comademig-blue text-white">
                      {getTipoLabel(evento.tipo)}
                    </Badge>
                    {getStatusBadge(evento.status)}
                  </div>
                  <CardTitle className="font-montserrat text-comademig-blue">
                    {evento.titulo}
                  </CardTitle>
                  <CardDescription className="font-inter text-comademig-gold font-semibold">
                    {evento.preletor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="font-inter text-sm">{evento.data}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock size={16} />
                      <span className="font-inter text-sm">{evento.hora}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="font-inter text-sm">{evento.local}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users size={16} />
                      <span className="font-inter text-sm">{evento.vagas} vagas</span>
                    </div>
                  </div>
                  
                  <p className="font-inter text-gray-700 text-sm leading-relaxed mb-4">
                    {evento.descricao}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-montserrat font-bold text-comademig-gold text-lg">
                      {evento.valor}
                    </span>
                    <Button 
                      className={`font-montserrat font-semibold ${
                        evento.status === "inscricoes-abertas"
                          ? "bg-comademig-gold hover:bg-comademig-gold/90 text-white"
                          : "bg-gray-400 text-white cursor-not-allowed"
                      }`}
                      disabled={evento.status !== "inscricoes-abertas"}
                    >
                      {evento.status === "inscricoes-abertas" ? "Inscrever-se" : "Em Breve"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {eventosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="font-inter text-gray-600 text-lg">
                Nenhum evento encontrado com os filtros selecionados.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-comademig-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4">
            Não Perca Nenhum Evento
          </h2>
          <p className="font-inter text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Mantenha-se atualizado com nossa agenda de eventos e oportunidades de crescimento espiritual
          </p>
          <Button 
            size="lg" 
            className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold"
          >
            Receber Notificações
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Eventos;
