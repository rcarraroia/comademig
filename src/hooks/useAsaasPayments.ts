import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface PaymentData {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

export interface PaymentResponse {
  id: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
}

export const useAsaasPayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (paymentData: PaymentData): Promise<PaymentResponse | null> => {
    setIsLoading(true);
    
    try {
      // TODO: Implementar integração real com Asaas quando sistema de pagamentos for reconstruído
      console.log('Dados do pagamento:', paymentData);
      
      // Simulação de resposta
      const mockResponse: PaymentResponse = {
        id: `mock_${Date.now()}`,
        invoiceUrl: 'https://example.com/invoice',
        bankSlipUrl: 'https://example.com/boleto',
        pixQrCode: 'mock_qr_code',
        pixCopyAndPaste: 'mock_pix_code'
      };

      toast({
        title: "Pagamento criado",
        description: "O pagamento foi criado com sucesso (modo simulação)",
      });

      return mockResponse;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pagamento. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPayment,
    isLoading
  };
};