/**
 * Hook para gerenciar feature flag do Payment First Flow
 * 
 * Permite ativação gradual do novo fluxo e rollback fácil
 */

import { useState, useEffect } from 'react';

interface PaymentFirstFlowConfig {
  enabled: boolean;
  rolloutPercentage: number;
  forceEnabled?: boolean;
  forceDisabled?: boolean;
}

export function usePaymentFirstFlowFeature() {
  const [config, setConfig] = useState<PaymentFirstFlowConfig>({
    enabled: false,
    rolloutPercentage: 0
  });

  useEffect(() => {
    // Carregar configuração da feature flag
    const loadConfig = () => {
      // 1. Verificar variáveis de ambiente
      const envEnabled = import.meta.env.VITE_PAYMENT_FIRST_FLOW_ENABLED === 'true';
      const envPercentage = parseInt(import.meta.env.VITE_PAYMENT_FIRST_FLOW_PERCENTAGE || '0');
      const envForceEnabled = import.meta.env.VITE_PAYMENT_FIRST_FLOW_FORCE_ENABLED === 'true';
      const envForceDisabled = import.meta.env.VITE_PAYMENT_FIRST_FLOW_FORCE_DISABLED === 'true';

      // 2. Verificar localStorage para override de desenvolvimento
      const localOverride = localStorage.getItem('payment_first_flow_override');
      
      let finalConfig: PaymentFirstFlowConfig = {
        enabled: envEnabled,
        rolloutPercentage: envPercentage,
        forceEnabled: envForceEnabled,
        forceDisabled: envForceDisabled
      };

      // 3. Aplicar override local se existir
      if (localOverride) {
        try {
          const override = JSON.parse(localOverride);
          finalConfig = { ...finalConfig, ...override };
        } catch (error) {
          console.warn('Erro ao parsear override do Payment First Flow:', error);
        }
      }

      setConfig(finalConfig);
    };

    loadConfig();

    // Escutar mudanças no localStorage (para desenvolvimento)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment_first_flow_override') {
        loadConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Determina se o Payment First Flow deve ser usado para este usuário
   */
  const shouldUsePaymentFirstFlow = (userEmail?: string): boolean => {
    // 1. Se forçado a desabilitar, sempre false
    if (config.forceDisabled) {
      console.log('🚫 Payment First Flow forçado a desabilitar');
      return false;
    }

    // 2. Se forçado a habilitar, sempre true
    if (config.forceEnabled) {
      console.log('✅ Payment First Flow forçado a habilitar');
      return true;
    }

    // 3. Se não habilitado globalmente, false
    if (!config.enabled) {
      console.log('📴 Payment First Flow não habilitado');
      return false;
    }

    // 4. Verificar rollout percentage
    if (config.rolloutPercentage === 0) {
      console.log('📊 Payment First Flow com 0% de rollout');
      return false;
    }

    if (config.rolloutPercentage >= 100) {
      console.log('🎯 Payment First Flow com 100% de rollout');
      return true;
    }

    // 5. Usar hash do email para distribuição consistente
    if (userEmail) {
      const hash = simpleHash(userEmail);
      const userPercentage = hash % 100;
      const shouldUse = userPercentage < config.rolloutPercentage;
      
      console.log(`🎲 Payment First Flow - Email: ${userEmail}, Hash: ${userPercentage}%, Rollout: ${config.rolloutPercentage}%, Usar: ${shouldUse}`);
      return shouldUse;
    }

    // 6. Fallback: usar random para usuários não logados
    const randomPercentage = Math.random() * 100;
    const shouldUse = randomPercentage < config.rolloutPercentage;
    
    console.log(`🎲 Payment First Flow - Random: ${randomPercentage.toFixed(1)}%, Rollout: ${config.rolloutPercentage}%, Usar: ${shouldUse}`);
    return shouldUse;
  };

  /**
   * Habilitar Payment First Flow para desenvolvimento/teste
   */
  const enableForDevelopment = () => {
    const override = { forceEnabled: true, forceDisabled: false };
    localStorage.setItem('payment_first_flow_override', JSON.stringify(override));
    setConfig(prev => ({ ...prev, ...override }));
    console.log('🔧 Payment First Flow habilitado para desenvolvimento');
  };

  /**
   * Desabilitar Payment First Flow para desenvolvimento/teste
   */
  const disableForDevelopment = () => {
    const override = { forceEnabled: false, forceDisabled: true };
    localStorage.setItem('payment_first_flow_override', JSON.stringify(override));
    setConfig(prev => ({ ...prev, ...override }));
    console.log('🔧 Payment First Flow desabilitado para desenvolvimento');
  };

  /**
   * Resetar overrides de desenvolvimento
   */
  const resetDevelopmentOverride = () => {
    localStorage.removeItem('payment_first_flow_override');
    // Recarregar config das variáveis de ambiente
    const envEnabled = import.meta.env.VITE_PAYMENT_FIRST_FLOW_ENABLED === 'true';
    const envPercentage = parseInt(import.meta.env.VITE_PAYMENT_FIRST_FLOW_PERCENTAGE || '0');
    const envForceEnabled = import.meta.env.VITE_PAYMENT_FIRST_FLOW_FORCE_ENABLED === 'true';
    const envForceDisabled = import.meta.env.VITE_PAYMENT_FIRST_FLOW_FORCE_DISABLED === 'true';
    
    setConfig({
      enabled: envEnabled,
      rolloutPercentage: envPercentage,
      forceEnabled: envForceEnabled,
      forceDisabled: envForceDisabled
    });
    console.log('🔄 Payment First Flow resetado para configuração padrão');
  };

  return {
    config,
    shouldUsePaymentFirstFlow,
    enableForDevelopment,
    disableForDevelopment,
    resetDevelopmentOverride
  };
}

/**
 * Hash simples para distribuição consistente baseada em email
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Utilitários para desenvolvimento (disponíveis no console)
if (typeof window !== 'undefined') {
  (window as any).paymentFirstFlowDev = {
    enable: () => {
      localStorage.setItem('payment_first_flow_override', JSON.stringify({ forceEnabled: true }));
      console.log('✅ Payment First Flow habilitado via console');
    },
    disable: () => {
      localStorage.setItem('payment_first_flow_override', JSON.stringify({ forceDisabled: true }));
      console.log('❌ Payment First Flow desabilitado via console');
    },
    reset: () => {
      localStorage.removeItem('payment_first_flow_override');
      console.log('🔄 Payment First Flow resetado via console');
    },
    status: () => {
      const override = localStorage.getItem('payment_first_flow_override');
      console.log('📊 Status do Payment First Flow:', {
        override: override ? JSON.parse(override) : null,
        env: {
          enabled: import.meta.env.VITE_PAYMENT_FIRST_FLOW_ENABLED,
          percentage: import.meta.env.VITE_PAYMENT_FIRST_FLOW_PERCENTAGE,
          forceEnabled: import.meta.env.VITE_PAYMENT_FIRST_FLOW_FORCE_ENABLED,
          forceDisabled: import.meta.env.VITE_PAYMENT_FIRST_FLOW_FORCE_DISABLED
        }
      });
    }
  };
}

/*
EXEMPLO DE USO:

// No componente de filiação
const { shouldUsePaymentFirstFlow } = usePaymentFirstFlowFeature();
const useNewFlow = shouldUsePaymentFirstFlow(user?.email);

const { processarFiliacaoComPagamento } = useFiliacaoPayment({
  selectedMemberType,
  affiliateInfo,
  usePaymentFirstFlow: useNewFlow
});

// Para desenvolvimento no console:
paymentFirstFlowDev.enable()   // Forçar habilitar
paymentFirstFlowDev.disable()  // Forçar desabilitar
paymentFirstFlowDev.reset()    // Resetar para padrão
paymentFirstFlowDev.status()   // Ver status atual

// Variáveis de ambiente (.env):
VITE_PAYMENT_FIRST_FLOW_ENABLED=false
VITE_PAYMENT_FIRST_FLOW_PERCENTAGE=0
VITE_PAYMENT_FIRST_FLOW_FORCE_ENABLED=false
VITE_PAYMENT_FIRST_FLOW_FORCE_DISABLED=false
*/