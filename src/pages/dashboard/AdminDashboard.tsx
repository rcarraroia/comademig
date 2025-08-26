
import AdminDashboard from "@/components/admin/AdminDashboard";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";

const AdminDashboardPage = () => {
  const { isAdmin, loading } = useUserRoles();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminDashboard />;
};

export default AdminDashboardPage;
