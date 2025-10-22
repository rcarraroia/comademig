import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SystemDiagnostics from '@/components/admin/SystemDiagnostics';

const SystemDiagnosticsPage = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
        <p className="text-gray-600">
          Monitore a saúde e funcionalidade de todos os componentes do COMADEMIG
        </p>
      </div>
      
      <SystemDiagnostics />
    </div>
  );
};

export default SystemDiagnosticsPage;