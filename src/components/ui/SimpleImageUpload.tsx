import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, validateImageFile, compressionOptions } from '@/utils/imageCompression';

interface SimpleImageUploadProps {
  onImageChange: (url: string | null) => void;
  compressionType?: keyof typeof compressionOptions;
  maxSizeMB?: number;
  multiple?: boolean;
  onMultipleImagesChange?: (urls: string[]) => void;
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  onImageChange,
  compressionType = 'album',
  maxSizeMB = 10,
  multiple = false,
  onMultipleImagesChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Se múltiplo, processar todos os arquivos
    if (multiple && files.length > 1) {
      await handleMultipleFiles(Array.from(files));
      return;
    }

    // Se único arquivo, usar lógica original
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setCompressionInfo(null);

    try {
      console.log('🔍 Iniciando upload:', file.name);
      
      // Validação do arquivo
      const validation = validateImageFile(file, maxSizeMB);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Comprimir imagem
      console.log('🗜️ Comprimindo imagem...');
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedFile = await compressImage(file, compressionType);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const reduction = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);
      
      setCompressionInfo(`Comprimido: ${originalSize}MB → ${compressedSize}MB (${reduction}% menor)`);
      console.log('✅ Compressão concluída');

      // Nome único simples
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${compressionType}_${timestamp}_${random}.jpg`;
      
      console.log('🔍 Nome do arquivo:', fileName);

      // Upload do arquivo comprimido
      console.log('🔍 Fazendo upload...');
      const { data, error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      console.log('🔍 Resultado upload:', { data, uploadError });

      if (uploadError) {
        throw uploadError;
      }

      // URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      console.log('🔍 URL pública:', publicUrl);

      onImageChange(publicUrl);
      setSuccess('Upload realizado com sucesso!');

    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      setError(error.message || 'Erro desconhecido');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleMultipleFiles = async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setCompressionInfo(null);
    setUploadProgress('');

    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    try {
      console.log(`📸 Processando ${totalFiles} imagens...`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processando ${i + 1}/${totalFiles}...`);

        // Validação
        const validation = validateImageFile(file, maxSizeMB);
        if (!validation.valid) {
          console.warn(`⚠️ Arquivo ${file.name} inválido:`, validation.error);
          continue; // Pula arquivo inválido
        }

        // Comprimir
        console.log(`🗜️ Comprimindo ${file.name}...`);
        const compressedFile = await compressImage(file, compressionType);

        // Upload
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const fileName = `${compressionType}_${timestamp}_${random}_${i}.jpg`;

        const { data, error: uploadError } = await supabase.storage
          .from('content-images')
          .upload(fileName, compressedFile, {
            upsert: true,
            contentType: 'image/jpeg'
          });

        if (uploadError) {
          console.error(`❌ Erro ao fazer upload de ${file.name}:`, uploadError);
          continue; // Pula arquivo com erro
        }

        // URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('content-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
        console.log(`✅ ${i + 1}/${totalFiles} - ${file.name} enviado`);
      }

      if (uploadedUrls.length > 0) {
        setSuccess(`✅ ${uploadedUrls.length} de ${totalFiles} imagens enviadas com sucesso!`);
        
        // Chamar callback com todas as URLs
        if (onMultipleImagesChange) {
          onMultipleImagesChange(uploadedUrls);
        }
      } else {
        throw new Error('Nenhuma imagem foi enviada com sucesso');
      }

    } catch (error: any) {
      console.error('❌ Erro no upload múltiplo:', error);
      setError(error.message || 'Erro ao enviar imagens');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      // Limpar input será feito no handleFileSelect
    }
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        multiple={multiple}
      />
      
      <Button
        type="button"
        disabled={isUploading}
        className="w-full"
        onClick={handleButtonClick}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {uploadProgress || 'Enviando...'}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {multiple ? 'Selecionar Múltiplas Imagens' : 'Selecionar Arquivo'}
          </>
        )}
      </Button>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
          ❌ Erro: {error}
        </div>
      )}

      {success && (
        <div className="p-2 bg-green-100 text-green-700 rounded text-sm">
          ✅ {success}
        </div>
      )}

      {compressionInfo && (
        <div className="p-2 bg-blue-100 text-blue-700 rounded text-sm">
          🗜️ {compressionInfo}
        </div>
      )}
    </div>
  );
};