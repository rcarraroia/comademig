
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useProfilePhoto = () => {
  const [uploading, setUploading] = useState(false);
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil com nova foto
      const { error: updateError } = await updateProfile({
        foto_url: publicUrl
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Sucesso",
        description: "Foto atualizada com sucesso!",
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro inesperado ao fazer upload da foto",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (): Promise<boolean> => {
    if (!user || !profile?.foto_url) return false;

    try {
      // Atualizar perfil removendo foto
      const { error } = await updateProfile({
        foto_url: null
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Foto removida com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover foto",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadPhoto,
    removePhoto,
    uploading,
    currentPhotoUrl: profile?.foto_url
  };
};
