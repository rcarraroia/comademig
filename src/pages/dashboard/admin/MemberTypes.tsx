import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MemberTypesManagement from "@/components/admin/member-types/MemberTypesManagement";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const MemberTypes = () => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('manage_users')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MemberTypesManagement />;
};

export default MemberTypes;