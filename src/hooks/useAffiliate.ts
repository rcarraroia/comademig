
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AffiliateData {
  display_name: string;
  cpf_cnpj: string;
  asaas_wallet_id: string;
  contact_email?: string;
  phone?: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  display_name: string;
  cpf_cnpj: string;
  asaas_wallet_id: string;
  contact_email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  is_adimplent: boolean;
  referral_code: string;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  affiliate_id: string;
  referred_name: string;
  referred_email: string;
  charge_id?: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export interface Transaction {
  id: string;
  asaas_payment_id: string;
  affiliate_id: string;
  total_amount: number;
  affiliate_amount: number;
  convention_amount: number;
  renum_amount: number;
  status: string;
  created_at: string;
}

export const useAffiliate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createAffiliate = async (data: AffiliateData) => {
    setLoading(true);
    console.log('Creating affiliate with data:', data);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('affiliates-management', {
        body: data
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Create affiliate result:', result);

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Seu cadastro de afiliado foi criado e está em análise.",
      });

      return result.affiliate;
    } catch (error: any) {
      console.error('Erro ao criar afiliado:', error);
      toast({
        title: "Erro ao criar afiliado",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAffiliate = async (): Promise<Affiliate | null> => {
    setLoading(true);
    console.log('Getting affiliate data...');
    
    try {
      const { data, error } = await supabase.functions.invoke('affiliates-management', {
        body: {},
        method: 'GET'
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Get affiliate result:', data);
      return data?.affiliate || null;
    } catch (error: any) {
      console.error('Erro ao buscar afiliado:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliate = async (data: AffiliateData) => {
    setLoading(true);
    console.log('Updating affiliate with data:', data);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('affiliates-management', {
        body: data,
        method: 'PUT'
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      toast({
        title: "Dados atualizados",
        description: "Suas informações de afiliado foram atualizadas com sucesso.",
      });

      return result.affiliate;
    } catch (error: any) {
      console.error('Erro ao atualizar afiliado:', error);
      toast({
        title: "Erro ao atualizar dados",
        description: error.message || 'Ocorreu um erro inesperado',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getReferrals = async (): Promise<Referral[]> => {
    setLoading(true);
    console.log('Getting referrals...');
    
    try {
      const { data, error } = await supabase.functions.invoke('affiliates-management', {
        body: {},
        method: 'GET'
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Get referrals result:', data?.referrals);
      return data?.referrals || [];
    } catch (error: any) {
      console.error('Erro ao buscar indicações:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTransactions = async (): Promise<Transaction[]> => {
    setLoading(true);
    console.log('Getting transactions...');
    
    try {
      const { data, error } = await supabase.functions.invoke('affiliates-management', {
        body: {},
        method: 'GET'
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Get transactions result:', data?.transactions);
      return data?.transactions || [];
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateReferralUrl = (referralCode: string): string => {
    return `${window.location.origin}/filiacao?ref=${referralCode}`;
  };

  return {
    createAffiliate,
    getAffiliate,
    updateAffiliate,
    getReferrals,
    getTransactions,
    generateReferralUrl,
    loading
  };
};
