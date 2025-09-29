import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import SubscriptionsManagement from "@/components/admin/SubscriptionsManagement";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const Subscriptions = () => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('manage_users')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SubscriptionsManagement />;

export default Subscriptions;