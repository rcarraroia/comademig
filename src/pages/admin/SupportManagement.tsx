import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SupportManagement from '@/components/admin/SupportManagement';
import TicketChat from '@/components/support/TicketChat';
import type { SupportTicket } from '@/hooks/useSupport';

const SupportManagementPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atendimento ao Membro</h1>
          <p className="text-muted-foreground">
            Gerencie tickets de suporte e atenda os membros da convenção
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      {selectedTicket ? (
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button 
              onClick={handleBackToList}
              className="flex items-center gap-1 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </button>
            <span>/</span>
            <span>Ticket #{selectedTicket.id.slice(0, 8)}</span>
          </div>

          {/* Chat do ticket */}
          <TicketChat
            ticketId={selectedTicket.id}
            onBack={handleBackToList}
          />
        </div>
      ) : (
        <SupportManagement onTicketClick={handleTicketClick} />
      )}
    </div>
  );
};

export default SupportManagementPage;