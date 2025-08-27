import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AuditLogViewer from "@/components/admin/audit/AuditLogViewer";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const AuditLogs = () => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('manage_system')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuditLogViewer />;
};

export default AuditLogs;"