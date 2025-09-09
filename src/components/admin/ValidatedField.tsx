import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseValidatedFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  errors?: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  showValidIcon?: boolean;
}

interface ValidatedInputProps extends BaseValidatedFieldProps {
  type?: 'text' | 'email' | 'url' | 'tel' | 'date' | 'number';
  maxLength?: number;
  pattern?: string;
}

interface ValidatedTextareaProps extends BaseValidatedFieldProps {
  rows?: number;
  maxLength?: number;
}

// Componente base para campos validados
const FieldWrapper: React.FC<{
  label: string;
  name: string;
  error?: string;
  errors?: string[];
  required?: boolean;
  description?: string;
  showValidIcon?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({
  label,
  name,
  error,
  errors,
  required,
  description,
  showValidIcon,
  children,
  className
}) => {
  const hasError = !!(error || (errors && errors.length > 0));
  const isValid = !hasError && showValidIcon;
  const allErrors = error ? [error] : (errors || []);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Label 
          htmlFor={name} 
          className={cn(
            "text-sm font-medium",
            {
              "text-red-600": hasError,
              "text-green-600": isValid,
            }
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {isValid && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        
        {hasError && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}
      
      {children}
      
      {allErrors.length > 0 && (
        <div className="space-y-1">
          {allErrors.map((errorMsg, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              {errorMsg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// Campo de input validado
export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  errors,
  placeholder,
  required = false,
  disabled = false,
  className,
  description,
  showValidIcon = true,
  type = 'text',
  maxLength,
  pattern
}) => {
  const hasError = !!(error || (errors && errors.length > 0));

  return (
    <FieldWrapper
      label={label}
      name={name}
      error={error}
      errors={errors}
      required={required}
      description={description}
      showValidIcon={showValidIcon && !!value && !hasError}
      className={className}
    >
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        pattern={pattern}
        className={cn(
          "transition-colors",
          {
            "border-red-500 focus:border-red-500 focus:ring-red-500": hasError,
            "border-green-500 focus:border-green-500 focus:ring-green-500": showValidIcon && !!value && !hasError,
          }
        )}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
      />
    </FieldWrapper>
  );
};

// Campo de textarea validado
export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  errors,
  placeholder,
  required = false,
  disabled = false,
  className,
  description,
  showValidIcon = true,
  rows = 3,
  maxLength
}) => {
  const hasError = !!(error || (errors && errors.length > 0));

  return (
    <FieldWrapper
      label={label}
      name={name}
      error={error}
      errors={errors}
      required={required}
      description={description}
      showValidIcon={showValidIcon && !!value && !hasError}
      className={className}
    >
      <div className="relative">
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            "transition-colors resize-none",
            {
              "border-red-500 focus:border-red-500 focus:ring-red-500": hasError,
              "border-green-500 focus:border-green-500 focus:ring-green-500": showValidIcon && !!value && !hasError,
            }
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
        
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

// Campo de seleção validado
interface ValidatedSelectProps extends BaseValidatedFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  emptyOption?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  errors,
  placeholder,
  required = false,
  disabled = false,
  className,
  description,
  showValidIcon = true,
  options,
  emptyOption = "Selecione uma opção"
}) => {
  const hasError = !!(error || (errors && errors.length > 0));

  return (
    <FieldWrapper
      label={label}
      name={name}
      error={error}
      errors={errors}
      required={required}
      description={description}
      showValidIcon={showValidIcon && !!value && !hasError}
      className={className}
    >
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          {
            "border-red-500 focus:border-red-500 focus:ring-red-500": hasError,
            "border-green-500 focus:border-green-500 focus:ring-green-500": showValidIcon && !!value && !hasError,
          }
        )}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
      >
        {emptyOption && (
          <option value="" disabled>
            {emptyOption}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};

// Componente para exibir resumo de erros
interface ValidationSummaryProps {
  errors: string[];
  title?: string;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  title = "Corrija os seguintes erros:",
  className
}) => {
  if (errors.length === 0) return null;

  return (
    <div className={cn("bg-red-50 border border-red-200 rounded-lg p-4", className)}>
      <div className="flex items-center space-x-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h3 className="text-sm font-semibold text-red-800">{title}</h3>
      </div>
      <ul className="space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm text-red-700 flex items-start">
            <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Hook para facilitar o uso dos campos validados
export const useValidatedField = (
  name: string,
  value: string,
  onChange: (value: string) => void,
  validation?: {
    getFieldError: (field: string) => string | undefined;
    getFieldErrors: (field: string) => string[];
    validateField: (field: string, value: string, fullData: any) => void;
  },
  fullData?: any
) => {
  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (validation) {
      validation.validateField(name, newValue, fullData);
    }
  };

  const handleBlur = () => {
    if (validation) {
      validation.validateField(name, value, fullData);
    }
  };

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    error: validation?.getFieldError(name),
    errors: validation?.getFieldErrors(name)
  };
};