import imageCompression from 'browser-image-compression';

/**
 * Opções de compressão para diferentes tipos de imagem
 */
export const compressionOptions = {
  // Para fotos de álbuns (qualidade alta)
  album: {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
  },
  // Para capas de álbuns (qualidade média-alta)
  cover: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8,
  },
  // Para thumbnails de vídeos (qualidade média)
  thumbnail: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.75,
  },
  // Para imagens de notícias (qualidade alta)
  news: {
    maxSizeMB: 1.2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.82,
  },
};

/**
 * Comprime uma imagem antes do upload
 * @param file - Arquivo de imagem original
 * @param type - Tipo de compressão a aplicar
 * @returns Arquivo comprimido
 */
export async function compressImage(
  file: File,
  type: keyof typeof compressionOptions = 'album'
): Promise<File> {
  try {
    const options = compressionOptions[type];
    
    console.log(`🖼️ Comprimindo imagem: ${file.name}`);
    console.log(`📊 Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressedFile = await imageCompression(file, options);
    
    console.log(`✅ Tamanho comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📉 Redução: ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`);
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error);
    // Em caso de erro, retorna o arquivo original
    return file;
  }
}

/**
 * Comprime múltiplas imagens em paralelo
 * @param files - Array de arquivos de imagem
 * @param type - Tipo de compressão a aplicar
 * @param onProgress - Callback para progresso (opcional)
 * @returns Array de arquivos comprimidos
 */
export async function compressMultipleImages(
  files: File[],
  type: keyof typeof compressionOptions = 'album',
  onProgress?: (current: number, total: number) => void
): Promise<File[]> {
  const compressedFiles: File[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImage(files[i], type);
    compressedFiles.push(compressed);
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  
  return compressedFiles;
}

/**
 * Valida se o arquivo é uma imagem válida
 * @param file - Arquivo a validar
 * @returns true se for imagem válida
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Valida tamanho máximo do arquivo (antes da compressão)
 * @param file - Arquivo a validar
 * @param maxSizeMB - Tamanho máximo em MB (padrão: 10MB)
 * @returns true se estiver dentro do limite
 */
export function isValidSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Valida arquivo de imagem (tipo e tamanho)
 * @param file - Arquivo a validar
 * @param maxSizeMB - Tamanho máximo em MB
 * @returns Objeto com resultado da validação
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  if (!isValidImage(file)) {
    return {
      valid: false,
      error: 'Formato inválido. Use JPG, PNG ou WebP.',
    };
  }
  
  if (!isValidSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}
