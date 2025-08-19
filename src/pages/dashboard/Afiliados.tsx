
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AffiliateRegistration } from '@/components/affiliates/AffiliateRegistration';
import { AffiliatePanel } from '@/components/affiliates/AffiliatePanel';
import { useAffiliate, type Affiliate } from '@/hooks/useAffiliate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function Afiliados() {
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const { getAffiliate } = useAffiliate();

  useEffect(() => {
    loadAffiliate();
  }, []);

  const loadAffiliate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const affiliateData = await getAffiliate();
      setAffiliate(affiliateData);
    } catch (error) {
      console.error('Erro ao carregar afiliado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    loadAffiliate();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  // Verificar se usuário está ativo e adimplente
  const canParticipate = profile?.status === 'ativo';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!canParticipate && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Para participar do Programa de Afiliados, você precisa estar com a filiação ativa e em dia com suas obrigações.
            </AlertDescription>
          </Alert>
        )}

        {canParticipate && (
          affiliate ? (
            <AffiliatePanel affiliate={affiliate} />
          ) : (
            <AffiliateRegistration onSuccess={handleRegistrationSuccess} />
          )
        )}
      </div>
    </DashboardLayout>
  );
}
