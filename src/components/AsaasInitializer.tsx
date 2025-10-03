/**
 * Componente para inicialização e validação da integração Asaas
 * Executa validações no startup e exibe status para desenvolvedores
 */

import React, { useEffect, useState } from 'react';
import { validateAsaasIntegration, formatValidationResult, type ValidationResult } from '@/lib/asaas';

interface AsaasInitializerProps {
  children: React.ReactNode;
}

export const AsaasInitializer: React.FC<AsaasInitializerProps> = ({ children }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateIntegration = async () => {
      try {
        console.log('🔧 Iniciando validação da integração Asaas...');
        const result = await validateAsaasIntegration();
        setValidationResult(result);
        
        // Log do resultado para desenvolvedores
        console.log(formatValidationResult(result));
        
        if (result.isValid) {
          console.log('✅ Integração Asaas pronta para uso');
        } else {
          console.warn('⚠️ Problemas na integração Asaas - sistema funcionará em modo simulação');
        }
      } catch (error) {
        console.error('❌ Erro durante validação Asaas:', error);
        setValidationResult({
          isValid: false,
          errors: [`Erro de validação: ${error instanceof Error ? error.message : 'Desconhecido'}`],
          warnings: [],
          environment: 'unknown'
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateIntegration();
  }, []);

  // Em desenvolvimento, mostra status de validação
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment && isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando integração Asaas...</p>
        </div>
      </div>
    );
  }

  // Em desenvolvimento, mostra banner de status se houver problemas
  const showStatusBanner = isDevelopment && validationResult && !validationResult.isValid;

  return (
    <>
      {showStatusBanner && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Modo Desenvolvimento:</strong> Integração Asaas com problemas - sistema em modo simulação
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                {validationResult?.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};