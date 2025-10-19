import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NoticiaData } from "@/hooks/useNoticias";

interface NoticiasCarouselProps {
  noticias: NoticiaData[];
}

export const NoticiasCarousel = ({ noticias }: NoticiasCarouselProps) => {
  if (!noticias || noticias.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {noticias.map((noticia) => (
        <Card key={noticia.id} className="hover:shadow-lg transition-shadow bg-white">
          {noticia.imagem_url && (
            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
              <OptimizedImage
                src={noticia.imagem_url}
                alt={noticia.titulo}
                className="w-full h-full"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Calendar className="w-4 h-4" />
              {noticia.data_publicacao && format(
                new Date(noticia.data_publicacao), 
                "dd 'de' MMMM 'de' yyyy", 
                { locale: ptBR }
              )}
            </div>
            <CardTitle className="font-montserrat text-comademig-blue line-clamp-2">
              {noticia.titulo}
            </CardTitle>
            <CardDescription className="font-inter line-clamp-3">
              {noticia.resumo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/noticias/${noticia.slug}`}>Ler Mais</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
