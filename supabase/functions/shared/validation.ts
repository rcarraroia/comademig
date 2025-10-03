/**
 * Utilitários de validação compartilhados para Edge Functions
 */

/**
 * Valida CPF (11 dígitos)
 */
export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(numbers[9]) === digit1 && parseInt(numbers[10]) === digit2;
}

/**
 * Valida CNPJ (14 dígitos)
 */
export function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return parseInt(numbers[12]) === digit1 && parseInt(numbers[13]) === digit2;
}

/**
 * Valida CPF ou CNPJ
 */
export function validateCpfCnpj(cpfCnpj: string): boolean {
  const numbers = cpfCnpj.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return validateCPF(numbers);
  } else if (numbers.length === 14) {
    return validateCNPJ(numbers);
  }
  
  return false;
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '');
  // Aceita telefones com 10 ou 11 dígitos (com ou sem 9 no celular)
  return numbers.length >= 10 && numbers.length <= 11;
}

/**
 * Valida CEP brasileiro
 */
export function validateCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
}

/**
 * Formata CPF/CNPJ removendo caracteres especiais
 */
export function formatCpfCnpj(cpfCnpj: string): string {
  return cpfCnpj.replace(/\D/g, '');
}

/**
 * Formata telefone removendo caracteres especiais
 */
export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata CEP removendo caracteres especiais
 */
export function formatCEP(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Valida dados básicos de cliente
 */
export interface CustomerValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCustomerData(data: {
  name?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
}): CustomerValidationResult {
  const errors: string[] = [];

  // Nome obrigatório
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
  }

  // CPF/CNPJ obrigatório e válido
  if (!data.cpfCnpj) {
    errors.push('CPF/CNPJ é obrigatório');
  } else if (!validateCpfCnpj(data.cpfCnpj)) {
    errors.push('CPF/CNPJ deve ter formato válido');
  }

  // Email obrigatório e válido
  if (!data.email) {
    errors.push('Email é obrigatório');
  } else if (!validateEmail(data.email)) {
    errors.push('Email deve ter formato válido');
  }

  // Telefone opcional, mas se informado deve ser válido
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Telefone deve ter formato válido (10 ou 11 dígitos)');
  }

  if (data.mobilePhone && !validatePhone(data.mobilePhone)) {
    errors.push('Celular deve ter formato válido (10 ou 11 dígitos)');
  }

  // CEP opcional, mas se informado deve ser válido
  if (data.postalCode && !validateCEP(data.postalCode)) {
    errors.push('CEP deve ter formato válido (8 dígitos)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}