/**
 * Serviço de Feature Flags
 * 
 * Gerencia feature flags para controle de rollout gradual
 * Requirements: 9.5
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_groups: string[];
  conditions: Record<string, any>;
  metadata: Record<string, any>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagHistory {
  id: string;
  feature_flag_id: string;
  action: 'created' | 'enabled' | 'disabled' | 'percentage_changed' | 'conditions_updated';
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  changed_by?: string;
  reason?: string;
  created_at: string;
}

class FeatureFlagService {
  /**
   * Verifica se uma feature flag está ativa para o usuário atual
   */
  async isFeatureEnabled(
    flagName: string, 
    options?: {
      userEmail?: string;
      userId?: string;
      userGroups?: string[];
    }
  ): Promise<boolean> {
    try {
      // Primeiro, tentar usar a função do banco para verificação consistente
      const { data, error } = await supabase.rpc('is_feature_enabled', {
        flag_name: flagName,
        user_email: options?.userEmail,
        user_id: options?.userId,
        user_groups: options?.userGroups || []
      });

      if (error) {
        console.error('Erro ao verificar feature flag via RPC:', error);
        // Fallback para verificação local
        return await this.isFeatureEnabledFallback(flagName, options);
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao verificar feature flag:', error);
      // Fallback para verificação local
      return await this.isFeatureEnabledFallback(flagName, options);
    }
  }

  /**
   * Verificação de feature flag como fallback (sem usar RPC)
   */
  private async isFeatureEnabledFallback(
    flagName: string,
    options?: {
      userEmail?: string;
      userId?: string;
      userGroups?: string[];
    }
  ): Promise<boolean> {
    try {
      const { data: flag, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('name', flagName)
        .single();

      if (error || !flag) {
        return false;
      }

      // Se não está habilitada
      if (!flag.is_enabled) {
        return false;
      }

      // Se rollout é 100%
      if (flag.rollout_percentage >= 100) {
        return true;
      }

      // Se rollout é 0%
      if (flag.rollout_percentage <= 0) {
        return false;
      }

      // Verificar grupos alvo
      if (flag.target_groups && flag.target_groups.length > 0 && options?.userGroups) {
        const hasTargetGroup = flag.target_groups.some(group => 
          options.userGroups?.includes(group)
        );
        if (hasTargetGroup) {
          return true;
        }
      }

      // Calcular hash para distribuição consistente
      const identifier = options?.userEmail || options?.userId;
      if (identifier) {
        const hash = this.simpleHash(flagName + ':' + identifier);
        const userPercentage = Math.abs(hash) % 100;
        return userPercentage < flag.rollout_percentage;
      }

      return false;
    } catch (error) {
      console.error('Erro no fallback de feature flag:', error);
      return false;
    }
  }

  /**
   * Hash simples para distribuição consistente
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Busca todas as feature flags
   */
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar feature flags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar feature flags:', error);
      return [];
    }
  }

  /**
   * Busca uma feature flag específica
   */
  async getFeatureFlag(name: string): Promise<FeatureFlag | null> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        console.error('Erro ao buscar feature flag:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar feature flag:', error);
      return null;
    }
  }

  /**
   * Cria uma nova feature flag
   */
  async createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>): Promise<FeatureFlag | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('feature_flags')
        .insert([{
          name: flag.name,
          description: flag.description,
          is_enabled: flag.is_enabled,
          rollout_percentage: flag.rollout_percentage,
          target_groups: flag.target_groups,
          conditions: flag.conditions,
          metadata: flag.metadata,
          created_by: user.user?.id,
          updated_by: user.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar feature flag:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar feature flag:', error);
      return null;
    }
  }

  /**
   * Atualiza uma feature flag
   */
  async updateFeatureFlag(
    id: string, 
    updates: Partial<Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
  ): Promise<FeatureFlag | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('feature_flags')
        .update({
          ...updates,
          updated_by: user.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar feature flag:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar feature flag:', error);
      return null;
    }
  }

  /**
   * Habilita uma feature flag
   */
  async enableFeatureFlag(id: string): Promise<boolean> {
    const result = await this.updateFeatureFlag(id, { is_enabled: true });
    return result !== null;
  }

  /**
   * Desabilita uma feature flag
   */
  async disableFeatureFlag(id: string): Promise<boolean> {
    const result = await this.updateFeatureFlag(id, { is_enabled: false });
    return result !== null;
  }

  /**
   * Atualiza o percentual de rollout
   */
  async updateRolloutPercentage(id: string, percentage: number): Promise<boolean> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentual deve estar entre 0 e 100');
    }
    
    const result = await this.updateFeatureFlag(id, { rollout_percentage: percentage });
    return result !== null;
  }

  /**
   * Busca histórico de uma feature flag
   */
  async getFeatureFlagHistory(flagId: string): Promise<FeatureFlagHistory[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flag_history')
        .select('*')
        .eq('feature_flag_id', flagId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Deleta uma feature flag
   */
  async deleteFeatureFlag(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar feature flag:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar feature flag:', error);
      return false;
    }
  }

  /**
   * Verifica múltiplas feature flags de uma vez
   */
  async checkMultipleFeatures(
    flagNames: string[],
    options?: {
      userEmail?: string;
      userId?: string;
      userGroups?: string[];
    }
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      flagNames.map(async (flagName) => {
        results[flagName] = await this.isFeatureEnabled(flagName, options);
      })
    );

    return results;
  }

  /**
   * Rollout gradual - aumenta percentual automaticamente
   */
  async gradualRollout(
    flagId: string, 
    targetPercentage: number, 
    incrementPercentage: number = 10,
    intervalMinutes: number = 60
  ): Promise<void> {
    const flag = await this.getFeatureFlag(flagId);
    if (!flag) {
      throw new Error('Feature flag não encontrada');
    }

    if (flag.rollout_percentage >= targetPercentage) {
      return; // Já atingiu o target
    }

    const newPercentage = Math.min(
      flag.rollout_percentage + incrementPercentage,
      targetPercentage
    );

    await this.updateRolloutPercentage(flagId, newPercentage);

    // Se ainda não atingiu o target, agendar próxima execução
    if (newPercentage < targetPercentage) {
      setTimeout(() => {
        this.gradualRollout(flagId, targetPercentage, incrementPercentage, intervalMinutes);
      }, intervalMinutes * 60 * 1000);
    }
  }

  /**
   * Rollback de emergência - desabilita imediatamente
   */
  async emergencyRollback(flagId: string, reason?: string): Promise<boolean> {
    try {
      // Desabilitar imediatamente
      await this.disableFeatureFlag(flagId);
      
      // Registrar no histórico com razão
      if (reason) {
        await supabase
          .from('feature_flag_history')
          .insert([{
            feature_flag_id: flagId,
            action: 'disabled',
            reason: `Rollback de emergência: ${reason}`,
            changed_by: (await supabase.auth.getUser()).data.user?.id
          }]);
      }

      return true;
    } catch (error) {
      console.error('Erro no rollback de emergência:', error);
      return false;
    }
  }
}

export const featureFlagService = new FeatureFlagService();