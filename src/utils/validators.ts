/**
 * Validações para formulários brasileiros
 */

/**
 * Valida CPF brasileiro
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Valida primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(9))) return false

  // Valida segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '')
  // Aceita 10 dígitos (fixo) ou 11 dígitos (celular)
  return cleanPhone.length === 10 || cleanPhone.length === 11
}

/**
 * Valida CEP brasileiro
 */
export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '')
  return cleanCEP.length === 8
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Limpa CPF (remove formatação)
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  const clean = cleanCPF(cpf)
  if (clean.length !== 11) return cpf
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '')
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Mensagens de erro personalizadas
 */
export const ERROR_MESSAGES = {
  CPF_INVALID: 'CPF inválido. Verifique os dígitos.',
  PHONE_INVALID: 'Telefone inválido. Use formato (XX) XXXXX-XXXX',
  CEP_INVALID: 'CEP inválido. Use formato XXXXX-XXX',
  EMAIL_INVALID: 'Email inválido.',
  REQUIRED: 'Este campo é obrigatório.',
  MIN_LENGTH: (min: number) => `Mínimo de ${min} caracteres.`,
  MAX_LENGTH: (max: number) => `Máximo de ${max} caracteres.`,
}
