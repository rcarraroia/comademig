import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { formatValidationErrors, getFirstValidationError } from '@/lib/validations/content';

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface ValidationState {
  errors: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
  hasBeenValidated: boolean;
}

export const useFormValidation = <T>({
  schema,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300
}: UseFormValidationOptions<T>) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: true,
    isValidating: false,
    hasBeenValidated: false
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateData = useCallback(async (data: any): Promise<boolean> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        setValidationState({
          errors: {},
          isValid: true,
          isValidating: false,
          hasBeenValidated: true
        });
        return true;
      } else {
        const formattedErrors = formatValidationErrors(result.error.issues);
        setValidationState({
          errors: formattedErrors,
          isValid: false,
          isValidating: false,
          hasBeenValidated: true
        });
        return false;
      }
    } catch (error) {
      console.error('Erro durante validação:', error);
      setValidationState({
        errors: { general: ['Erro interno de validação'] },
        isValid: false,
        isValidating: false,
        hasBeenValidated: true
      });
      return false;
    }
  }, [schema]);

  const validateWithDebounce = useCallback((data: any) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      validateData(data);
    }, debounceMs);

    setDebounceTimer(timer);
  }, [validateData, debounceMs, debounceTimer]);

  const validateField = useCallback(async (fieldPath: string, value: any, fullData: any): Promise<boolean> => {
    try {
      // Criar um objeto temporário com o campo atualizado
      const testData = { ...fullData };
      const pathParts = fieldPath.split('.');
      
      let current = testData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;

      const result = schema.safeParse(testData);
      
      if (result.success) {
        // Remover erros deste campo específico
        setValidationState(prev => {
          const newErrors = { ...prev.errors };
          delete newErrors[fieldPath];
          
          return {
            ...prev,
            errors: newErrors,
            isValid: Object.keys(newErrors).length === 0,
            hasBeenValidated: true
          };
        });
        return true;
      } else {
        // Atualizar apenas os erros relacionados a este campo
        const fieldErrors = result.error.issues.filter(issue => 
          issue.path.join('.') === fieldPath
        );
        
        if (fieldErrors.length > 0) {
          setValidationState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              [fieldPath]: fieldErrors.map(err => err.message)
            },
            isValid: false,
            hasBeenValidated: true
          }));
          return false;
        }
        
        return true;
      }
    } catch (error) {
      console.error('Erro durante validação de campo:', error);
      return false;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setValidationState({
      errors: {},
      isValid: true,
      isValidating: false,
      hasBeenValidated: false
    });
  }, []);

  const clearFieldError = useCallback((fieldPath: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldPath];
      
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  const getFieldError = useCallback((fieldPath: string): string | undefined => {
    const errors = validationState.errors[fieldPath];
    return errors && errors.length > 0 ? errors[0] : undefined;
  }, [validationState.errors]);

  const getFieldErrors = useCallback((fieldPath: string): string[] => {
    return validationState.errors[fieldPath] || [];
  }, [validationState.errors]);

  const hasFieldError = useCallback((fieldPath: string): boolean => {
    return !!(validationState.errors[fieldPath] && validationState.errors[fieldPath].length > 0);
  }, [validationState.errors]);

  const getFirstError = useCallback((): string | undefined => {
    const allErrors = Object.values(validationState.errors).flat();
    return allErrors.length > 0 ? allErrors[0] : undefined;
  }, [validationState.errors]);

  const getAllErrors = useCallback((): string[] => {
    return Object.values(validationState.errors).flat();
  }, [validationState.errors]);

  const getErrorCount = useCallback((): number => {
    return Object.values(validationState.errors).flat().length;
  }, [validationState.errors]);

  // Handlers para integração com React Hook Form
  const createFieldValidator = useCallback((fieldPath: string) => {
    return {
      onChange: validateOnChange ? (value: any, fullData: any) => {
        validateField(fieldPath, value, fullData);
      } : undefined,
      onBlur: validateOnBlur ? (value: any, fullData: any) => {
        validateField(fieldPath, value, fullData);
      } : undefined
    };
  }, [validateField, validateOnChange, validateOnBlur]);

  // Memoized values
  const validationHelpers = useMemo(() => ({
    errors: validationState.errors,
    isValid: validationState.isValid,
    isValidating: validationState.isValidating,
    hasBeenValidated: validationState.hasBeenValidated,
    errorCount: getErrorCount(),
    firstError: getFirstError(),
    allErrors: getAllErrors()
  }), [validationState, getErrorCount, getFirstError, getAllErrors]);

  return {
    // Estado de validação
    ...validationHelpers,
    
    // Funções de validação
    validate: validateData,
    validateWithDebounce,
    validateField,
    
    // Gerenciamento de erros
    clearErrors,
    clearFieldError,
    getFieldError,
    getFieldErrors,
    hasFieldError,
    
    // Helpers para formulários
    createFieldValidator,
    
    // Cleanup
    cleanup: useCallback(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    }, [debounceTimer])
  };
};

// Hook especializado para validação de conteúdo
export const useContentValidation = <T>(schema: z.ZodSchema<T>) => {
  return useFormValidation({
    schema,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500
  });
};

// Tipos para TypeScript
export type FormValidationHook<T> = ReturnType<typeof useFormValidation<T>>;
export type ContentValidationHook<T> = ReturnType<typeof useContentValidation<T>>;