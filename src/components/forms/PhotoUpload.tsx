
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PhotoUploadProps {
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export const PhotoUpload = ({ onUploadSuccess, className = '' }: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, removePhoto, uploading, currentPhotoUrl } = useProfilePhoto();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadPhoto(file);
    if (url && onUploadSuccess) {
      onUploadSuccess(url);
    }

    // Reset input
    event.target.value = '';
  };

  const handleRemovePhoto = async () => {
    const success = await removePhoto();
    if (success && onUploadSuccess) {
      onUploadSuccess('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-2" />
              {currentPhotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
            </>
          )}
        </Button>

        {currentPhotoUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemovePhoto}
            disabled={uploading}
            size="icon"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Formatos aceitos: JPG, PNG, GIF. Máximo 5MB.
      </p>
    </div>
  );
};
