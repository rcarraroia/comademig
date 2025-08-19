
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AdminProfile } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Mail, Phone, MapPin, Building, Calendar } from "lucide-react";

interface ViewUserModalProps {
  user: AdminProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewUserModal = ({ user, isOpen, onClose }: ViewUserModalProps) => {
  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'suspenso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoMembroColor = (tipo: string) => {
    switch (tipo) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderador': return 'bg-blue-100 text-blue-800';
      case 'tesoureiro': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com nome e badges */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{user.nome_completo}</h3>
              <p className="text-gray-600">ID: {user.id}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
              <Badge className={getTipoMembroColor(user.tipo_membro)}>
                {user.tipo_membro}
              </Badge>
            </div>
          </div>

          {/* Informações pessoais */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Informações Pessoais</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">CPF:</span>
                  <span className="font-medium">{user.cpf || '-'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <span className="font-medium">{user.telefone || '-'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Cadastro:</span>
                  <span className="font-medium">
                    {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Informações Eclesiásticas</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Igreja:</span>
                  <span className="font-medium">{user.igreja || '-'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Cargo:</span>
                  <span className="font-medium">{user.cargo || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Estatísticas</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-xs text-gray-600">Eventos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-gray-600">Certificados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-xs text-gray-600">Certidões</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-xs text-gray-600">Tickets</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
