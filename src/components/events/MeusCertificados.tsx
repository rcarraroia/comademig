
import { useCertificadosEventos } from '@/hooks/useCertificadosEventos';
import { CertificadoCard } from './CertificadoCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Award } from 'lucide-react';

export const MeusCertificados = () => {
  const { meusCertificados, isLoading } = useCertificadosEventos();

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (!meusCertificados || meusCertificados.length === 0) {
    return (
      <EmptyState
        icon={<Award className="h-12 w-12 text-gray-400" />}
        title="Nenhum certificado disponível"
        description="Você ainda não possui certificados de eventos. Participe de eventos para receber seus certificados!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {meusCertificados.map((certificado) => (
        <CertificadoCard
          key={certificado.id}
          certificado={certificado}
        />
      ))}
    </div>
  );
};
