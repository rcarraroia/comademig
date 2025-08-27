import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const Subscriptions = () => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('manage_finance')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
        <p className="text-gray-600">Gerencie os planos de assinatura disponíveis no sistema</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Módulo em Desenvolvimento
        </h3>
        <p className="text-blue-800">
          O módulo de gerenciamento de assinaturas será implementado na Fase 2 do projeto.
          Por enquanto, você pode gerenciar tipos de membro no módulo correspondente.
        </p>
      </div>
    </div>
  );
};

export default Subscriptions;