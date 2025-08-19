
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar = ({ size = 'md', className = '' }: UserAvatarProps) => {
  const { profile } = useAuth();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32'
  };

  const fallbackSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  const getInitials = () => {
    if (!profile?.nome_completo) return 'U';
    return profile.nome_completo
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={profile?.foto_url} 
        alt={profile?.nome_completo || 'Usuário'} 
      />
      <AvatarFallback className={`bg-comademig-blue text-white ${fallbackSizes[size]}`}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};
