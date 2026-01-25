/**
 * Serviço de Migração de Dados Pendentes
 * 
 * Identifica e migra processos de filiação incompletos para o novo formato
 * Requirements: 9.3
 */

import { supabase } from '@/integrations/supabase/client';
import { paymentFirstFlowLogger } from './PaymentFirstFlowLogger';

export interface PendingRegistration {
  id: string;
  user_email: string;
  user_data: Record<string, any>;
  payment_data: Record<string, any>;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
  member_type: string;
  plan_id: string;
  affiliate_id?: string;
  status: 'pending_payment' | 'payment_confirmed' | 'account_creation_failed' | 'completed';
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface MigrationResult {
  total_found: number;
  successfully_migrated: number;
  failed_migrations: number;
  errors: Array<{
    registration_id: string;
    error: string;
  }>;
}

class PendingDataMigrationService {
  /**
   * Identifica processos de filiação incompletos no sistema antigo
   */
  async identifyIncompleteRegistrations(): Promise<PendingRegistration[]> {
    try {
      // Buscar cobranças pagas sem usuário correspondente
      const { data: paidCharges, error: chargesError } = await supabase
        .from('asaas_cobrancas')
        .select(`
          *,
          profiles!inner(id, email, nome_completo, status)
        `)
        .eq('status', 'RECEIVED')
        .is('profiles.id', null);

      if (chargesError) {
        console.error('Erro ao buscar cobranças pagas:', chargesError);
        return [];
      }

      // Buscar usuários com status pendente há mais de 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: pendingUsers, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions(*)
        `)
        .eq('status', 'pendente')
        .lt('created_at', oneHourAgo);

      if (usersError) {
        console.error('Erro ao buscar usuários pendentes:', usersError);
        return [];
      }

      // Buscar registros na tabela pending_subscriptions
      const { data: pendingSubscriptions, error: pendingError } = await supabase
        .from('pending_subscriptions')
        .select('*')
        .eq('status', 'pending');

      if (pendingError) {
        console.error('Erro ao buscar pending subscriptions:', pendingError);
        return [];
      }

      // Converter para formato unificado
      const incompleteRegistrations: PendingRegistration[] = [];

      // Processar cobranças pagas sem usuário
      if (paidCharges) {
        for (const charge of paidCharges) {
          incompleteRegistrations.push({
            id: `charge_${charge.id}`,
            user_email: charge.customer_email || '',
            user_data: {
              nome_completo: charge.customer_name,
              email: charge.customer_email,
              cpf: charge.customer_cpf,
              telefone: charge.customer_phone
            },
            payment_data: {
              asaas_id: charge.asaas_id,
              value: charge.value,
              payment_method: charge.payment_method
            },
            asaas_customer_id: charge.asaas_customer_id,
            asaas_payment_id: charge.asaas_id,
            member_type: charge.metadata?.member_type || 'membro',
            plan_id: charge.metadata?.plan_id || '',
            affiliate_id: charge.metadata?.affiliate_id,
            status: 'payment_confirmed',
            retry_count: 0,
            created_at: charge.created_at,
            updated_at: charge.updated_at
          });
        }
      }

      // Processar usuários pendentes
      if (pendingUsers) {
        for (const user of pendingUsers) {
          incompleteRegistrations.push({
            id: `user_${user.id}`,
            user_email: user.email,
            user_data: {
              nome_completo: user.nome_completo,
              email: user.email,
              cpf: user.cpf,
              telefone: user.telefone,
              endereco: user.endereco
            },
            payment_data: {},
            member_type: user.tipo_membro || 'membro',
            plan_id: user.user_subscriptions?.[0]?.plan_id || '',
            status: 'pending_payment',
            retry_count: 0,
            created_at: user.created_at,
            updated_at: user.updated_at
          });
        }
      }

      // Processar pending subscriptions
      if (pendingSubscriptions) {
        for (const pending of pendingSubscriptions) {
          incompleteRegistrations.push({
            id: `pending_${pending.id}`,
            user_email: pending.user_email,
            user_data: pending.user_data,
            payment_data: pending.payment_data,
            asaas_customer_id: pending.asaas_customer_id,
            asaas_payment_id: pending.asaas_payment_id,
            member_type: pending.member_type,
            plan_id: pending.plan_id,
            affiliate_id: pending.affiliate_id,
            status: pending.status as any,
            error_message: pending.error_message,
            retry_count: pending.retry_count,
            created_at: pending.created_at,
            updated_at: pending.updated_at
          });
        }
      }

      return incompleteRegistrations;
    } catch (error) {
      console.error('Erro ao identificar registros incompletos:', error);
      return [];
    }
  }

  /**
   * Migra um registro incompleto para o novo formato
   */
  async migrateRegistration(registration: PendingRegistration): Promise<boolean> {
    try {
      await paymentFirstFlowLogger.logEvent({
        event_type: 'registration_started',
        user_email: registration.user_email,
        member_type: registration.member_type,
        plan_id: registration.plan_id,
        affiliate_id: registration.affiliate_id,
        context: {
          migration: true,
          original_id: registration.id,
          original_status: registration.status
        }
      });

      switch (registration.status) {
        case 'payment_confirmed':
          return await this.migratePaymentConfirmed(registration);
        
        case 'account_creation_failed':
          return await this.retryAccountCreation(registration);
        
        case 'pending_payment':
          return await this.migratePendingPayment(registration);
        
        default:
          console.warn(`Status desconhecido para migração: ${registration.status}`);
          return false;
      }
    } catch (error) {
      console.error('Erro ao migrar registro:', error);
      
      await paymentFirstFlowLogger.logEvent({
        event_type: 'process_failed',
        user_email: registration.user_email,
        error_message: `Erro na migração: ${error}`,
        context: {
          migration: true,
          original_id: registration.id
        }
      });
      
      return false;
    }
  }

  /**
   * Migra registro com pagamento confirmado
   */
  private async migratePaymentConfirmed(registration: PendingRegistration): Promise<boolean> {
    try {
      // Verificar se usuário já existe
      const { data: existingUser } = await supabase.auth.admin.getUserById(registration.id);
      
      if (existingUser.user) {
        // Usuário já existe, apenas atualizar status se necessário
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            status: 'ativo',
            payment_confirmed_at: new Date().toISOString(),
            registration_flow_version: 'payment_first_v1'
          })
          .eq('id', existingUser.user.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
        }

        await paymentFirstFlowLogger.logProcessCompleted({
          user_email: registration.user_email,
          user_id: existingUser.user.id,
          asaas_customer_id: registration.asaas_customer_id || '',
          asaas_payment_id: registration.asaas_payment_id || '',
          asaas_subscription_id: '', // Será preenchido se houver
          processing_time_ms: 0,
          context: { migration: true }
        });

        return true;
      }

      // Criar conta Supabase
      const tempPassword = this.generateTempPassword();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: registration.user_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome_completo: registration.user_data.nome_completo,
          migrated_from_old_flow: true
        }
      });

      if (createError || !newUser.user) {
        throw new Error(`Erro ao criar usuário: ${createError?.message}`);
      }

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: newUser.user.id,
          email: registration.user_email,
          nome_completo: registration.user_data.nome_completo,
          cpf: registration.user_data.cpf,
          telefone: registration.user_data.telefone,
          endereco: registration.user_data.endereco,
          tipo_membro: registration.member_type,
          status: 'ativo',
          payment_confirmed_at: new Date().toISOString(),
          registration_flow_version: 'payment_first_v1'
        }]);

      if (profileError) {
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      // Criar assinatura se houver dados de pagamento
      if (registration.plan_id) {
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert([{
            user_id: newUser.user.id,
            plan_id: registration.plan_id,
            status: 'active',
            asaas_payment_id: registration.asaas_payment_id,
            processing_context: {
              migrated: true,
              original_id: registration.id
            }
          }]);

        if (subscriptionError) {
          console.error('Erro ao criar assinatura:', subscriptionError);
          // Não falhar a migração por erro de assinatura
        }
      }

      await paymentFirstFlowLogger.logProcessCompleted({
        user_email: registration.user_email,
        user_id: newUser.user.id,
        asaas_customer_id: registration.asaas_customer_id || '',
        asaas_payment_id: registration.asaas_payment_id || '',
        asaas_subscription_id: '',
        processing_time_ms: 0,
        context: { migration: true, temp_password_generated: true }
      });

      return true;
    } catch (error) {
      console.error('Erro ao migrar pagamento confirmado:', error);
      return false;
    }
  }

  /**
   * Tenta novamente a criação de conta que falhou
   */
  private async retryAccountCreation(registration: PendingRegistration): Promise<boolean> {
    // Implementar retry da criação de conta
    return await this.migratePaymentConfirmed(registration);
  }

  /**
   * Migra registro com pagamento pendente
   */
  private async migratePendingPayment(registration: PendingRegistration): Promise<boolean> {
    try {
      // Verificar status do pagamento no Asaas
      if (registration.asaas_payment_id) {
        // Aqui seria feita uma consulta à API do Asaas para verificar o status
        // Por enquanto, vamos assumir que precisa ser reprocessado
        
        // Adicionar à tabela pending_subscriptions para reprocessamento
        const { error } = await supabase
          .from('pending_subscriptions')
          .upsert([{
            user_email: registration.user_email,
            user_data: registration.user_data,
            payment_data: registration.payment_data,
            asaas_customer_id: registration.asaas_customer_id,
            asaas_payment_id: registration.asaas_payment_id,
            member_type: registration.member_type,
            plan_id: registration.plan_id,
            affiliate_id: registration.affiliate_id,
            status: 'pending',
            retry_count: registration.retry_count + 1
          }]);

        if (error) {
          throw new Error(`Erro ao adicionar à fila de reprocessamento: ${error.message}`);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao migrar pagamento pendente:', error);
      return false;
    }
  }

  /**
   * Executa migração completa de todos os registros incompletos
   */
  async migrateAllIncompleteRegistrations(): Promise<MigrationResult> {
    const incompleteRegistrations = await this.identifyIncompleteRegistrations();
    
    const result: MigrationResult = {
      total_found: incompleteRegistrations.length,
      successfully_migrated: 0,
      failed_migrations: 0,
      errors: []
    };

    for (const registration of incompleteRegistrations) {
      try {
        const success = await this.migrateRegistration(registration);
        
        if (success) {
          result.successfully_migrated++;
        } else {
          result.failed_migrations++;
          result.errors.push({
            registration_id: registration.id,
            error: 'Migração falhou sem erro específico'
          });
        }
      } catch (error) {
        result.failed_migrations++;
        result.errors.push({
          registration_id: registration.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // Log do resultado da migração
    await paymentFirstFlowLogger.logEvent({
      event_type: 'process_completed',
      user_email: 'system',
      context: {
        migration_batch: true,
        result
      }
    });

    return result;
  }

  /**
   * Gera senha temporária para usuários migrados
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Cria ferramenta de completamento manual para administradores
   */
  async createManualCompletionTool(registrationId: string, adminNotes: string): Promise<boolean> {
    try {
      const registrations = await this.identifyIncompleteRegistrations();
      const registration = registrations.find(r => r.id === registrationId);
      
      if (!registration) {
        throw new Error('Registro não encontrado');
      }

      // Adicionar notas do admin ao contexto
      registration.user_data.admin_notes = adminNotes;
      registration.user_data.manual_completion = true;

      const success = await this.migrateRegistration(registration);
      
      if (success) {
        await paymentFirstFlowLogger.logEvent({
          event_type: 'process_completed',
          user_email: registration.user_email,
          context: {
            manual_completion: true,
            admin_notes: adminNotes,
            completed_by: (await supabase.auth.getUser()).data.user?.id
          }
        });
      }

      return success;
    } catch (error) {
      console.error('Erro no completamento manual:', error);
      return false;
    }
  }

  /**
   * Busca estatísticas de migração
   */
  async getMigrationStats(): Promise<{
    total_incomplete: number;
    by_status: Record<string, number>;
    oldest_registration: string | null;
    newest_registration: string | null;
  }> {
    const registrations = await this.identifyIncompleteRegistrations();
    
    const byStatus: Record<string, number> = {};
    let oldestDate: string | null = null;
    let newestDate: string | null = null;

    for (const registration of registrations) {
      // Contar por status
      byStatus[registration.status] = (byStatus[registration.status] || 0) + 1;
      
      // Encontrar mais antigo e mais novo
      if (!oldestDate || registration.created_at < oldestDate) {
        oldestDate = registration.created_at;
      }
      if (!newestDate || registration.created_at > newestDate) {
        newestDate = registration.created_at;
      }
    }

    return {
      total_incomplete: registrations.length,
      by_status: byStatus,
      oldest_registration: oldestDate,
      newest_registration: newestDate
    };
  }
}

export const pendingDataMigrationService = new PendingDataMigrationService();