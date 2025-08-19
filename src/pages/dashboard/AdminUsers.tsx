
import UserManagement from "@/components/admin/UserManagement";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";

const AdminUsersPage = () => {
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

  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  );
};

export default AdminUsersPage;
