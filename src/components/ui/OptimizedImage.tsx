import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc,
  placeholder,
  lazy = true,
  quality = 80,
  sizes,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Começar a carregar 50px antes de entrar na viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Atualizar src quando prop mudar
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src, currentSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Tentar fallback se disponível
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
      return;
    }
    
    onError?.();
  };

  // Gerar URL otimizada para Supabase Storage
  const getOptimizedUrl = (url: string) => {
    if (!url) return url;
    
    // Se for URL do Supabase Storage, adicionar parâmetros de otimização
    if (url.includes('supabase')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=${quality}&format=webp`;
    }
    
    return url;
  };

  const optimizedSrc = currentSrc ? getOptimizedUrl(currentSrc) : undefined;

  // Renderizar placeholder enquanto não está na viewport
  if (lazy && !isInView) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400",
          className
        )}
      >
        {placeholder || <ImageIcon className="w-8 h-8" />}
      </div>
    );
  }

  // Renderizar estado de erro
  if (hasError || !optimizedSrc) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400",
          className
        )}
      >
        {placeholder || (
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <span className="text-xs">Imagem não disponível</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Imagem otimizada */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        sizes={sizes}
        loading={lazy ? "lazy" : "eager"}
        onLoad={handleLoad}
        onError={handleError}
        // Adicionar atributos para melhor SEO e acessibilidade
        decoding="async"
        fetchPriority={lazy ? "low" : "high"}
      />
    </div>
  );
};

// Hook para preload de imagens críticas
export const useImagePreload = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      if (!url) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      
      // Cleanup
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    });
  }, [urls]);
};

// Componente para avatar otimizado
export const OptimizedAvatar: React.FC<OptimizedImageProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <OptimizedImage
      {...props}
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )}
      placeholder={
        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
          <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
        </div>
      }
    />
  );
};

export default OptimizedImage;