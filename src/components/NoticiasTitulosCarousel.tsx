import { Link } from "react-router-dom";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Calendar, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoticiaRecente {
  id: string;
  titulo: string;
  slug: string;
  data_publicacao: string | null;
}

interface NoticiasTitulosCarouselProps {
  noticias: NoticiaRecente[];
}

export const NoticiasTitulosCarousel = ({ noticias }: NoticiasTitulosCarouselProps) => {
  const [emblaRef] = useEmblaCarousel(
    { 
      loop: true,
      dragFree: true,
      containScroll: 'trimSnaps',
      align: 'start',
      slidesToScroll: 1,
    },
    [Autoplay({ 
      delay: 2500, 
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      playOnInit: true,
    })]
  );

  if (!noticias || noticias.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-r from-comademig-blue/5 to-comademig-blue/10 py-6 border-y border-comademig-blue/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <Newspaper className="w-5 h-5 text-comademig-blue" />
          <h3 className="text-lg font-montserrat font-semibold text-comademig-blue">
            Últimas Notícias
          </h3>
        </div>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {noticias.map((noticia) => (
              <Link
                key={noticia.id}
                to={`/noticias/${noticia.slug}`}
                className="flex-[0_0_auto] max-w-md group"
              >
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white hover:bg-comademig-blue/5 transition-all duration-200 shadow-sm hover:shadow-md border border-transparent hover:border-comademig-blue/20">
                  <Calendar className="w-4 h-4 text-comademig-gold flex-shrink-0 mt-1" />
                  <div className="min-w-0">
                    {noticia.data_publicacao && (
                      <p className="text-xs text-gray-500 mb-1">
                        {format(new Date(noticia.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                    <p className="font-inter text-sm text-comademig-blue group-hover:text-comademig-gold transition-colors line-clamp-2 font-medium">
                      {noticia.titulo}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
