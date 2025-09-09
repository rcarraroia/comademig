/**
 * Utilitários para otimização e processamento de imagens
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Comprime uma imagem mantendo a qualidade visual
 */
export const compressImage = (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular dimensões mantendo aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha na compressão da imagem'));
              return;
            }

            // Criar novo arquivo com nome otimizado
            const fileName = file.name.replace(/\.[^/.]+$/, `.${format}`);
            const compressedFile = new File([blob], fileName, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem para compressão'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gera múltiplos tamanhos de uma imagem (thumbnails)
 */
export const generateImageSizes = async (
  file: File,
  sizes: { name: string; width: number; height?: number }[]
): Promise<{ [key: string]: File }> => {
  const results: { [key: string]: File } = {};

  for (const size of sizes) {
    try {
      const compressed = await compressImage(file, {
        maxWidth: size.width,
        maxHeight: size.height || size.width,
        quality: 0.8,
        format: 'webp'
      });
      
      results[size.name] = compressed;
    } catch (error) {
      console.warn(`Falha ao gerar tamanho ${size.name}:`, error);
    }
  }

  return results;
};

/**
 * Valida se um arquivo é uma imagem válida
 */
export const validateImageFile = (
  file: File,
  options: {
    maxSize?: number; // em MB
    allowedFormats?: string[];
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const {
      maxSize = 10,
      allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
      minWidth = 100,
      minHeight = 100
    } = options;

    // Validar tipo
    if (!allowedFormats.includes(file.type)) {
      resolve({
        valid: false,
        error: `Formato não suportado. Use: ${allowedFormats.map(f => f.split('/')[1]).join(', ')}`
      });
      return;
    }

    // Validar tamanho
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      resolve({
        valid: false,
        error: `A imagem deve ter no máximo ${maxSize}MB`
      });
      return;
    }

    // Validar dimensões
    const img = new Image();
    img.onload = () => {
      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          error: `A imagem deve ter pelo menos ${minWidth}x${minHeight} pixels`
        });
        return;
      }

      resolve({ valid: true });
    };

    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Arquivo de imagem inválido'
      });
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gera um nome de arquivo único para upload
 */
export const generateUniqueFileName = (originalName: string, prefix = ''): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}.${extension}`;
};

/**
 * Calcula o tamanho otimizado para diferentes contextos
 */
export const getOptimalImageSize = (context: 'avatar' | 'banner' | 'thumbnail' | 'full') => {
  const sizes = {
    avatar: { width: 200, height: 200, quality: 0.9 },
    banner: { width: 1200, height: 400, quality: 0.8 },
    thumbnail: { width: 300, height: 200, quality: 0.7 },
    full: { width: 1920, height: 1080, quality: 0.8 }
  };

  return sizes[context];
};

/**
 * Converte uma imagem para WebP se suportado pelo navegador
 */
export const convertToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Verificar suporte a WebP
    const canvas = document.createElement('canvas');
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    if (!webpSupported) {
      resolve(file); // Retornar arquivo original se WebP não for suportado
      return;
    }

    compressImage(file, { format: 'webp', quality: 0.8 })
      .then(resolve)
      .catch(reject);
  });
};