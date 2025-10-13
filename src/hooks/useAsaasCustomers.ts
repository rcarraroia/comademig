/**
 * Hook para gestão de clientes Asaas
 * Integra com Edge Function para criar e gerenciar clientes
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CreateCustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
}

export interface AsaasCustomerResponse {
  success: boolean;
  customer_id: string;
  message: string;
  customer_data?: {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
  };
}

export const useAsaasCustomers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * Cria ou reutiliza cliente no Asaas
   * @param customerData - Dados do cliente
   * @param userId - ID do usuário (opcional, usa contexto se não fornecido)
   */
  const createCustomer = async (
    customerData: CreateCustomerData,
    userId?: string
  ): Promise<AsaasCustomerResponse | null> => {
    // Usar userId fornecido ou pegar do contexto
    const effectiveUserId = userId || user?.id;
    
    console.log('🔍 DEBUG createCustomer:');
    console.log('  - userId fornecido:', userId);
    console.log('  - user do contexto:', user?.id);
    console.log('  - effectiveUserId:', effectiveUserId);
    
    if (!effectiveUserId) {
      console.error('❌ Usuário não autenticado');
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      console.log('✅ Criando cliente Asaas para usuário:', effectiveUserId);
      
      // 📤 LOG DETALHADO: Body enviado à Edge Function
      const bodyToSend = {
        user_id: effectiveUserId,
        customer_data: customerData
      };
      
      console.log('📤 ========================================');
      console.log('📤 BODY COMPLETO ENVIADO À EDGE FUNCTION:');
      console.log('📤 ========================================');
      console.log(JSON.stringify(bodyToSend, null, 2));
      console.log('📤 ========================================');
      console.log('📤 CAMPOS INDIVIDUAIS:');
      console.log('📤   user_id:', effectiveUserId);
      console.log('� R  name:', customerData.name);
      console.log('📤   email:', customerData.email);
      console.log('📤   cpfCnpj:', customerData.cpfCnpj, '(length:', customerData.cpfCnpj?.length, ')');
      console.log('📤   phone:', customerData.phone);
      console.log('📤   postalCode:', customerData.postalCode);
      console.log('📤   address:', customerData.address);
      console.log('📤   addressNumber:', customerData.addressNumber);
      console.log('📤   city:', customerData.city);
      console.log('📤   state:', customerData.state);
      console.log('📤 ========================================');
      
      const { data, error } = await supabase.functions.invoke('asaas-create-customer', {
        body: bodyToSend
      });
      
      console.log('📥 ========================================');
      console.log('📥 RESPOSTA DA EDGE FUNCTION:');
      console.log('📥 ========================================');
      console.log('📥 data:', JSON.stringify(data, null, 2));
      console.log('📥 error:', JSON.stringify(error, null, 2));
      console.log('📥 ========================================');

      if (error) {
        throw new Error(error.message || 'Erro ao comunicar com o servidor');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar cliente');
      }

      console.log('Cliente Asaas criado/reutilizado:', data.customer_id);

      toast({
        title: "Sucesso",
        description: data.message || "Cliente configurado com sucesso",
      });

      return data as AsaasCustomerResponse;

    } catch (error) {
      console.error('Erro ao criar cliente Asaas:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro",
        description: `Erro ao configurar cliente: ${errorMessage}`,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Busca cliente existente do usuário atual
   */
  const getExistingCustomer = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      // Verificar se já existe customer_id no perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles' as any)
        .select('asaas_customer_id')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return (profile as any)?.asaas_customer_id || null;
    } catch (error) {
      console.error('Erro ao verificar cliente existente:', error);
      return null;
    }
  };

  /**
   * Cria cliente automaticamente baseado no perfil do usuário
   */
  const createCustomerFromProfile = async (): Promise<AsaasCustomerResponse | null> => {
    if (!user) return null;

    try {
      // Buscar dados do perfil do usuário (usando campos que existem)
      const { data: profile, error } = await supabase
        .from('profiles' as any)
        .select('full_name, cpf_cnpj, email, phone')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error('Erro ao buscar dados do perfil');
      }

      const profileData = profile as any;

      if (!profileData.full_name || !profileData.cpf_cnpj || !profileData.email) {
        throw new Error('Dados obrigatórios faltantes no perfil (nome, CPF/CNPJ, email)');
      }

      // Criar cliente com dados do perfil (usando campos disponíveis)
      const customerData: CreateCustomerData = {
        name: profileData.full_name,
        cpfCnpj: profileData.cpf_cnpj,
        email: profileData.email,
        phone: profileData.phone || undefined,
        country: 'Brasil',
        externalReference: `user_${user.id}`
      };

      return await createCustomer(customerData);

    } catch (error) {
      console.error('Erro ao criar cliente do perfil:', error);
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao configurar cliente',
        variant: "destructive",
      });
      
      return null;
    }
  };

  /**
   * Garante que o usuário tem um customer_id válido
   * Cria se não existir, reutiliza se já existir
   */
  const ensureCustomer = async (): Promise<string | null> => {
    // Primeiro verifica se já existe
    const existingCustomerId = await getExistingCustomer();
    if (existingCustomerId) {
      console.log('Cliente Asaas já existe:', existingCustomerId);
      return existingCustomerId;
    }

    // Se não existe, cria baseado no perfil
    const result = await createCustomerFromProfile();
    return result?.customer_id || null;
  };

  return {
    createCustomer,
    createCustomerFromProfile,
    getExistingCustomer,
    ensureCustomer,
    isLoading
  };
};