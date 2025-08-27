import { Card, CardContent } from "@/components/ui/card";
import { Users, Settings, CheckCircle, XCircle } from "lucide-react";
import type { MemberType } from "@/hooks/useMemberTypes";

interface MemberTypeStatsProps {
  memberTypes: MemberType[];
}

export const MemberTypeStats = ({ memberTypes }: MemberTypeStatsProps) => {
  const stats = {
    total: memberTypes.length,
    active: memberTypes.filter(type => type.is_active).length,
    inactive: memberTypes.filter(type => !type.is_active).length,
    totalUsers: memberTypes.reduce((sum, type) => sum + (type._count?.users || 0), 0)
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Tipos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Tipos Ativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Tipos Inativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Usuários Associados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};