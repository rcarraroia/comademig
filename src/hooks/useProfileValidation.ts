
import { useAuth } from '@/contexts/AuthContext';

export const useProfileValidation = () => {
  const { profile, user } = useAuth();

  const isProfileComplete = () => {
    if (!profile) return false;
    
    const requiredFields = [
      'nome_completo',
      'cpf',
      'rg',
      'endereco',
      'cidade',
      'estado',
      'telefone',
      'igreja',
      'cargo'
    ];
    
    return requiredFields.every(field => 
      profile[field as keyof typeof profile] && 
      profile[field as keyof typeof profile] !== ''
    );
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    const allFields = [
      'nome_completo', 'cpf', 'rg', 'data_nascimento',
      'endereco', 'cidade', 'estado', 'cep', 'telefone',
      'igreja', 'cargo', 'data_ordenacao', 'tempo_ministerio'
    ];
    
    const filledFields = allFields.filter(field => 
      profile[field as keyof typeof profile] && 
      profile[field as keyof typeof profile] !== ''
    );
    
    return Math.round((filledFields.length / allFields.length) * 100);
  };

  const getMissingRequiredFields = () => {
    if (!profile) return [];
    
    const requiredFields = [
      { key: 'nome_completo', label: 'Nome Completo' },
      { key: 'cpf', label: 'CPF' },
      { key: 'rg', label: 'RG' },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'igreja', label: 'Igreja' },
      { key: 'cargo', label: 'Cargo' }
    ];
    
    return requiredFields.filter(field => 
      !profile[field.key as keyof typeof profile] || 
      profile[field.key as keyof typeof profile] === ''
    );
  };

  const canAccessFeature = (feature: string) => {
    if (!user || !profile) return false;
    
    // Verificações baseadas no status do perfil
    switch (feature) {
      case 'carteira-digital':
        return profile.status === 'ativo' && isProfileComplete();
      case 'eventos':
        return profile.status !== 'suspenso';
      case 'financeiro':
        return profile.status === 'ativo';
      case 'certidoes':
        return profile.status === 'ativo' && profile.tipo_membro !== 'visitante';
      case 'regularizacao':
        return profile.status === 'ativo' && profile.cargo && 
               ['pastor', 'pastora'].includes(profile.cargo.toLowerCase());
      default:
        return true;
    }
  };

  return {
    isProfileComplete,
    getProfileCompletionPercentage,
    getMissingRequiredFields,
    canAccessFeature,
    profileStatus: profile?.status || 'pendente',
    memberType: profile?.tipo_membro || 'membro'
  };
};
