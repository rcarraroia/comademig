/**
 * Extensão de tipos para tabelas que não estão no types.ts gerado
 * Este arquivo adiciona tipos para tabelas criadas manualmente
 */

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  asaas_subscription_id: string | null;
  started_at: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSubscriptionInsert {
  id?: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status?: 'pending' | 'active' | 'cancelled' | 'expired';
  asaas_subscription_id?: string | null;
  started_at?: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface MinisterialData {
  id?: string;
  user_id: string;
  cargo_igreja?: string;
  tempo_ministerio?: string;
  created_at?: string;
}

export interface ProfileExtension {
  asaas_customer_id?: string | null;
  asaas_subscription_id?: string | null;
  subscription_source?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
}
