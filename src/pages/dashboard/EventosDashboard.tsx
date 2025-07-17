
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Clock, Search, Filter } from "lucide-react";

const EventosDashboard = () => {
  const myEvents = [
    {
      id: "E001",
      title: "Congresso Regional - BH",
      date: "2024-03-15",
      time: "19:00",
      location: "Centro de Convenções",
      city: "Belo Horizonte",
      status: "Confirmado",
      type: "Congresso",
      description: "Grande encontro regional com pregações e workshops"
    },
    {
      id: "E002",
      title: "Seminário de Liderança",
      date: "2024-02-20",
      time: "14:00",
      location: "Igreja Central",
      city: "Contagem",
      status: "Aguardando",
      type: "Seminário",
      description: "Capacitação para líderes ministeriais"
    },
    {
      id: "E003",
      title: "Convenção Estadual 2024",
      date: "2024-04-10",
      time: "18:00",
      location: "Mineirinho",
      city: "Belo Horizonte",
      status: "Inscrito",
      type: "Convenção",
      description: "Maior evento anual da COMADEMIG"
    }
  ];

  const availableEvents = [
    {
      id: "E004",
      title: "Workshop de Evangelismo",
      date: "2024-02-25",
      time: "09:00",
      location: "Igreja do Campo",
      city: "Uberlândia",
      vacancies: 45,
      maxVacancies: 60,
      type: "Workshop",
      price: "Gratuito"
    },
    {
      id: "E005",
      title: "Retiro Ministerial",
      date: "2024-03-05",
      time: "16:00",
      location: "Sítio Betel",
      city: "Nova Lima",
      vacancies: 12,
      maxVacancies: 30,
      type: "Retiro",
      price: "R$ 150,00"
    },
    {
      id: "E006",
      title: "Culto de Avivamento",
      date: "2024-02-18",
      time: "19:30",
      location: "Igreja Matriz",
      city: "Montes Claros",
      vacancies: 200,
      maxVacancies: 250,
      type: "Culto",
      price: "Gratuito"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmado":
        return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
      case "Aguardando":
        return <Badge className="bg-yellow-100 text-yellow-800">Aguardando</Badge>;
      case "Inscrito":
        return <Badge className="bg-blue-100 text-blue-800">Inscrito</Badge>;
      case "Cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getVacancyBadge = (vacancies: number, maxVacancies: number) => {
    const percentage = (vacancies / maxVacancies) * 100;
    if (percentage > 70) {
      return <Badge className="bg-green-100 text-green-800">Vagas Disponíveis</Badge>;
    } else if (percentage > 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Poucas Vagas</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Últimas Vagas</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-comademig-blue">Meus Eventos</h1>
        <p className="text-gray-600">Gerencie suas inscrições e descubra novos eventos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Eventos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Eventos em fevereiro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Histórico</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Eventos participados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Para inscrição</p>
          </CardContent>
        </Card>
      </div>

      {/* My Events */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-comademig-blue">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{event.location}, {event.city}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-4 flex space-x-2">
                    <Button size="sm" variant="outline">Ver Detalhes</Button>
                    {event.status === "Confirmado" && (
                      <Button size="sm" className="bg-comademig-blue hover:bg-comademig-blue/90">
                        Certificado
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Events */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Eventos Disponíveis</CardTitle>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Buscar eventos..." className="pl-9 w-64" />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="congresso">Congressos</SelectItem>
                  <SelectItem value="seminario">Seminários</SelectItem>
                  <SelectItem value="workshop">Workshops</SelectItem>
                  <SelectItem value="retiro">Retiros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {availableEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-comademig-blue">{event.title}</h3>
                    <Badge variant="outline" className="mt-1">{event.type}</Badge>
                  </div>
                  {getVacancyBadge(event.vacancies, event.maxVacancies)}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{event.location}, {event.city}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users size={14} />
                    <span>{event.vacancies} vagas de {event.maxVacancies}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-comademig-gold">
                    {event.price}
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline">Ver Mais</Button>
                    <Button size="sm" className="bg-comademig-gold hover:bg-comademig-gold/90">
                      Inscrever-se
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventosDashboard;
