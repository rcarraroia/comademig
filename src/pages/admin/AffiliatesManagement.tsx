import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, BarChart3, Settings } from "lucide-react";
import { AffiliatesList } from "./components/AffiliatesList";
import { ReferralsManagement } from "./components/ReferralsManagement";
import { CommissionsManagement } from "./components/CommissionsManagement";
import { AffiliatesReports } from "./components/AffiliatesReports";
import { AffiliatesSettings } from "./components/AffiliatesSettings";

export default function AffiliatesManagement() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("affiliates");

  // Verificar se é admin ou super_admin
  if (!profile || !['admin', 'super_admin'].includes(profile.tipo_membro)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-comademig-blue">
          Gestão de Afiliados
        </h1>
        <p className="text-muted-foreground">
          Gerencie afiliados, indicações e comissões do programa
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Indicações
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Afiliados */}
        <TabsContent value="affiliates">
          <AffiliatesList />
        </TabsContent>

        {/* Tab: Indicações */}
        <TabsContent value="referrals">
          <ReferralsManagement />
        </TabsContent>

        {/* Tab: Comissões */}
        <TabsContent value="commissions">
          <CommissionsManagement />
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="reports">
          <AffiliatesReports />
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings">
          <AffiliatesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
