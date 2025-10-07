import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthState } from '@/contexts/AuthContext'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import PaymentNotifications from '@/components/notifications/PaymentNotifications'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function AdminLayout() {
  const { user, profile, isLoading } = useAuthState()
  const { isAdmin } = useRoleAccess()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Verificar se o usuário está logado e é admin
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logout realizado com sucesso')
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botão do menu mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-gray-500">
                  COMADEMIG - Sistema de Gestão
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notificações de pagamento */}
              <PaymentNotifications />

              {/* Informações do usuário */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'Administrador'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(profile?.full_name || user.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botão de logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2024 COMADEMIG. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-4">
              <span>Versão 2.0.0</span>
              <span>•</span>
              <span>Ambiente: {import.meta.env.MODE}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}