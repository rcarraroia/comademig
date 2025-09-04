import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from './OptimizedImage';
import { compressImage, validateImageFile, generateUniqueFileName, getOptimalImageSize } from '@/lib/imageUtils';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string | null) => void;
  section: string;
  index?: number;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
  label?: string;
  placeholder?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  section,
  index = 0,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  label,
  placeholder = "Clique para selecionar uma imagem",
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Validação avançada do arquivo
      const validation = await validateImageFile(file, {
        maxSize,
        allowedFormats: acceptedFormats,
        minWidth: 100,
        minHeight: 100
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Comprimir imagem automaticamente
      const optimalSize = getOptimalImageSize('full');
      const compressedFile = await compressImage(file, {
        maxWidth: optimalSize.width,
        maxHeight: optimalSize.height,
        quality: optimalSize.quality,
        format: 'webp'
      });

      // Gerar nome único para o arquivo (sem pasta de usuário)
      const fileName = generateUniqueFileName(compressedFile.name, section);

      // Fazer upload da imagem comprimida diretamente na raiz do bucket
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: compressedFile.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);

      toast({
        title: "Upload realizado",
        description: "Imagem enviada com sucesso!",
      });

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir re-upload do mesmo arquivo
      event.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida com sucesso.",
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        {currentImage ? (
          <div className="space-y-3">
            {/* Preview da imagem */}
            <div className="relative">
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-32 object-cover rounded border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Botão para trocar imagem */}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
                id={`image-upload-${section}-${index}`}
              />
              <Label
                htmlFor={`image-upload-${section}-${index}`}
                className="cursor-pointer"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? 'Enviando...' : 'Trocar Imagem'}
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-500">
                Formatos: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • 
                Máximo: {maxSize}MB
              </p>
              
              <Input
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
                id={`image-upload-${section}-${index}`}
              />
              <Label
                htmlFor={`image-upload-${section}-${index}`}
                className="cursor-pointer"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        )}
      </div>
      
      {/* Informações adicionais */}
      <p className="text-xs text-gray-500">
        Recomendado: imagens com boa qualidade e resolução adequada para web
      </p>
    </div>
  );
};