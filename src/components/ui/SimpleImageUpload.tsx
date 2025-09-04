import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleImageUploadProps {
  onImageChange: (url: string | null) => void;
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  onImageChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔍 Iniciando upload:', file.name);
      
      // Validação básica
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande (máx 5MB)');
      }

      // Nome único simples
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `test_${timestamp}_${random}.${file.name.split('.').pop()}`;
      
      console.log('🔍 Nome do arquivo:', fileName);

      // Upload direto
      console.log('🔍 Fazendo upload...');
      const { data, error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
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

  return (
    <div className="space-y-4 p-4 border rounded">
      <h3 className="font-medium">Teste de Upload Simples</h3>
      
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <Button
        type="button"
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Arquivo
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
    </div>
  );
};