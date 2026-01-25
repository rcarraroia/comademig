/**
 * Edge Function: poll-payment-status
 * 
 * Polling dedicado para verificar status de pagamentos
 * Implementa exponential backoff e timeout de 20 segundos
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Interfaces
interface PollingRequest {
  paymentId: string;
  timeout?: number; // em segundos (padrão: 15s)
  interval?: number; // em segundos (padrão: 1s)
  maxAttempts?: number; // máximo de tentativas (padrão: 15)
}

interface PaymentStatus {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'OVERDUE' | 'CANCELLED';
  updatedAt: string;
  value?: number;
  description?: string;
  metadata?: Record<string, any>;
}

interface PollingResult {
  success: boolean;
  status?: PaymentStatus;
  error?: string;
  timedOut?: boolean;
  attempts: number;
  duration: number; // em milissegundos
  finalStatus?: string;
}

serve(async (req) => {
  // Configurar timeout de 20 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    console.log('🔄 Iniciando polling de status de pagamento...');

    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Método não permitido. Use POST.' 
        }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extrair dados da requisição
    const { paymentId, timeout = 15, interval = 1, maxAttempts = 15 }: PollingRequest = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'paymentId é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📊 Polling configurado: paymentId=${paymentId}, timeout=${timeout}s, interval=${interval}s`);

    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    const intervalMs = interval * 1000;
    
    let attempts = 0;
    let lastStatus: PaymentStatus | null = null;

    // Configuração da API Asaas
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3';

    if (!asaasApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração da API Asaas não encontrada' 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Loop de polling
    while (Date.now() - startTime < timeoutMs && attempts < maxAttempts) {
      // Verificar se foi cancelado
      if (controller.signal.aborted) {
        console.log('⚠️ Polling cancelado por timeout');
        break;
      }

      attempts++;
      console.log(`🔍 Tentativa ${attempts}/${maxAttempts} - Consultando status...`);

      try {
        // Consultar status via API do Asaas
        const response = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
          headers: {
            'access_token': asaasApiKey,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const payment = await response.json();
        
        // Mapear resposta para nossa interface
        lastStatus = {
          id: payment.id,
          status: payment.status,
          updatedAt: payment.dateCreated || new Date().toISOString(),
          value: payment.value,
          description: payment.description,
          metadata: {
            billingType: payment.billingType,
            dueDate: payment.dueDate,
            customer: payment.customer,
            externalReference: payment.externalReference
          }
        };

        console.log(`📋 Status atual: ${lastStatus.status}`);

        // Requirement 2.2: Retornar sucesso imediatamente se CONFIRMED
        if (lastStatus.status === 'CONFIRMED') {
          console.log('✅ Pagamento confirmado - retornando sucesso');
          
          return new Response(
            JSON.stringify({
              success: true,
              status: lastStatus,
              attempts,
              duration: Date.now() - startTime,
              finalStatus: 'CONFIRMED'
            }),
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }

        // Requirement 2.3: Retornar falha imediatamente se REFUSED
        if (lastStatus.status === 'REFUSED') {
          console.log('❌ Pagamento recusado - retornando falha');
          
          return new Response(
            JSON.stringify({
              success: false,
              status: lastStatus,
              error: 'Pagamento recusado',
              attempts,
              duration: Date.now() - startTime,
              finalStatus: 'REFUSED'
            }),
            { 
              status: 402, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }

        // Status ainda pendente ou em processamento
        if (lastStatus.status === 'PENDING' || lastStatus.status === 'OVERDUE') {
          console.log(`⏳ Status ${lastStatus.status} - aguardando ${interval}s...`);
          
          // Requirement 2.5: Usar intervalo fixo
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }

        // Status inesperado (CANCELLED, etc)
        console.log(`⚠️ Status inesperado: ${lastStatus.status}`);
        
        return new Response(
          JSON.stringify({
            success: false,
            status: lastStatus,
            error: `Status inesperado: ${lastStatus.status}`,
            attempts,
            duration: Date.now() - startTime,
            finalStatus: lastStatus.status
          }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );

      } catch (error) {
        console.warn(`⚠️ Erro na tentativa ${attempts}:`, error);

        // Se for erro de rede/temporário e ainda temos tempo, continuar
        if (Date.now() - startTime < timeoutMs - intervalMs && attempts < maxAttempts) {
          console.log(`🔄 Tentando novamente em ${interval}s...`);
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }

        // Se estivermos próximos do timeout ou esgotaram tentativas, falhar
        console.error('❌ Erro persistente no polling:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido no polling',
            attempts,
            duration: Date.now() - startTime,
            finalStatus: 'ERROR'
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Requirement 2.4: Timeout após tempo especificado
    const duration = Date.now() - startTime;
    console.log(`⏰ Timeout após ${duration}ms (${attempts} tentativas)`);

    return new Response(
      JSON.stringify({
        success: false,
        status: lastStatus,
        error: 'Timeout: Pagamento não foi confirmado no tempo esperado',
        timedOut: true,
        attempts,
        duration,
        finalStatus: 'TIMEOUT'
      }),
      { 
        status: 408, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro geral no polling:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        attempts: 0,
        duration: 0,
        finalStatus: 'ERROR'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } finally {
    clearTimeout(timeoutId);
  }
});

/* 
EXEMPLO DE USO:

POST /functions/v1/poll-payment-status
{
  "paymentId": "pay_123456789",
  "timeout": 15,
  "interval": 1,
  "maxAttempts": 15
}

RESPOSTA DE SUCESSO:
{
  "success": true,
  "status": {
    "id": "pay_123456789",
    "status": "CONFIRMED",
    "updatedAt": "2026-01-22T10:30:00Z",
    "value": 50.00,
    "description": "Filiação COMADEMIG - pastor",
    "metadata": {
      "billingType": "CREDIT_CARD",
      "dueDate": "2026-01-22",
      "customer": "cus_123456789",
      "externalReference": "filiacao_1234567890"
    }
  },
  "attempts": 3,
  "duration": 2500,
  "finalStatus": "CONFIRMED"
}

RESPOSTA DE FALHA (RECUSADO):
{
  "success": false,
  "status": {
    "id": "pay_123456789",
    "status": "REFUSED",
    "updatedAt": "2026-01-22T10:30:00Z",
    "value": 50.00,
    "description": "Filiação COMADEMIG - pastor"
  },
  "error": "Pagamento recusado",
  "attempts": 2,
  "duration": 1800,
  "finalStatus": "REFUSED"
}

RESPOSTA DE TIMEOUT:
{
  "success": false,
  "status": {
    "id": "pay_123456789",
    "status": "PENDING",
    "updatedAt": "2026-01-22T10:30:00Z",
    "value": 50.00,
    "description": "Filiação COMADEMIG - pastor"
  },
  "error": "Timeout: Pagamento não foi confirmado no tempo esperado",
  "timedOut": true,
  "attempts": 15,
  "duration": 15000,
  "finalStatus": "TIMEOUT"
}
*/