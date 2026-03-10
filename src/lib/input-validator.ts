/**
 * Utilitário de Validação e Sanitização de Input
 * 
 * Este módulo fornece funções para validar e sanitizar dados
 * recebidos das APIs, prevenindo injeção de dados maliciosos.
 * 
 * NOTA: DOMPurify está instalado como dependência obrigatória.
 * Para produção, garanta que o webpack está configurado corretamente
 * para que o módulo DOMPurify seja carregado adequadamente.
 */

// Variável para armazenar DOMPurify
let dompurifyAvailable: boolean = false
let DOMPurify: any = null

// Tentar carregar DOMPurify dinamicamente
try {
  DOMPurify = require('dompurify')
  dompurifyAvailable = true
} catch (error) {
  console.error('❌ ERRO CRÍTICO: DOMPurify não está instalado.')
  console.error('   Execute: npm install dompurify @types/dompurify')
  dompurifyAvailable = false
}

/**
 * Sanitiza uma string removendo caracteres perigosos
 * 
 * Usa DOMPurify quando disponível para sanitização HTML robusta,
 * caso contrário usa sanitização manual como fallback.
 */
export function sanitizeString(input: string | null | undefined, maxLength: number = 500): string {
  if (!input) return ''
  
  let sanitized: string
  
  if (dompurifyAvailable && DOMPurify) {
    // Usar DOMPurify para sanitização HTML robusta
    sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Não permitir nenhuma tag HTML
      KEEP_CONTENT: true, // Manter o conteúdo de texto
      ALLOW_DATA_ATTR: false, // Não permitir atributos data
      ALLOW_UNKNOWN_PROTOCOLS: false, // Não permitir protocolos desconhecidos
      SAFE_FOR_JQUERY: true, // Seguro para uso com jQuery
      SAFE_FOR_TEMPLATES: true, // Seguro para uso com templates
      WHOLE_DOCUMENT: false, // Não sanitizar documento inteiro
      RETURN_DOM: false, // Não retornar DOM
      RETURN_DOM_FRAGMENT: false, // Não retornar DOM Fragment
      RETURN_DOM_IMPORT: false, // Não retornar DOM Import
      FORCE_BODY: false // Não forçar sanitização do body
    })
  } else {
    // Fallback: sanitização manual (deve ser removido em produção)
    console.warn('⚠️  DOMPurify não disponível. Usando sanitização manual.')
    sanitized = input
    
    // PASSO 1: Remover protocolos perigosos primeiro (antes de remover tags)
    sanitized = sanitized.replace(/(data:|javascript:|vbscript:|file:)/gi, '')
    
    // PASSO 2: Remover Unicode encoding attempts (&#x3c;, &#60;, etc.)
    sanitized = sanitized.replace(/&#x[0-9a-f]+;?/gi, '')
    sanitized = sanitized.replace(/&#\d+;?/gi, '')
    
    // PASSO 3: Remover entidades HTML perigosas (&lt;, &gt;, &amp;, etc.)
    sanitized = sanitized.replace(/&[a-z]+;/gi, '')
    
    // PASSO 4: Remover tags HTML completamente (após remover entidades)
    sanitized = sanitized.replace(/<[^>]*>/g, '')
    
    // PASSO 5: Remover eventos on* (onclick, onerror, onload, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    
    // PASSO 6: Remover expressões de atributos perigosos
    sanitized = sanitized.replace(/\s*\w+\s*=\s*["'][^"']*["']/gi, (match) => {
      // Manter apenas atributos permitidos (id, class, style, etc.)
      const allowedAttrs = ['id', 'class', 'style', 'data-']
      const attrName = match.match(/^\s*(\w+)/)?.[1]?.toLowerCase()
      if (allowedAttrs.some(allowed => attrName?.startsWith(allowed))) {
        return match
      }
      return ''
    })
    
    // PASSO 7: Escapar caracteres HTML/JS perigosos restantes
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  // Limitar comprimento
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Remover espaços extras
  sanitized = sanitized.trim()
  
  return sanitized
}

/**
 * Valida e sanitiza um número
 */
export function sanitizeNumber(input: any, min?: number, max?: number): number {
  const num = parseFloat(input)
  
  if (isNaN(num)) {
    throw new Error('Valor numérico inválido')
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`Valor deve ser maior ou igual a ${min}`)
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`Valor deve ser menor ou igual a ${max}`)
  }
  
  return num
}

/**
 * Valida e sanitiza um email
 * CORREÇÃO: Tornado consistente com outras funções de validação (sanitizeString, sanitizeNumber)
 * que lançam erro em vez de retornar null quando o input é inválido
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) {
    throw new Error('Email é obrigatório')
  }
  
  const email = input.trim().toLowerCase()
  
  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Email inválido')
  }
  
  return email
}

/**
 * Valida e sanitiza um CNPJ
 */
export function sanitizeCNPJ(input: string | null | undefined): string | null {
  if (!input) return null
  
  // Remover caracteres não numéricos
  const cnpj = input.replace(/[^\d]/g, '')
  
  // Validar tamanho
  if (cnpj.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos')
  }
  
  // Validar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) {
    throw new Error('CNPJ inválido')
  }
  
  // Algoritmo de validação de CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    let length = cnpj.length - 2
    let numbers = cnpj.substring(0, length)
    const digits = cnpj.substring(length)
    let sum = 0
    let pos = length - 7
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(0))) return false
    
    length = length + 1
    numbers = cnpj.substring(0, length)
    sum = 0
    pos = length - 7
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(1))) return false
    
    return true
  }
  
  if (!validateCNPJ(cnpj)) {
    throw new Error('CNPJ inválido')
  }
  
  return cnpj
}

/**
 * Valida e sanitiza um telefone
 */
export function sanitizeTelefone(input: string | null | undefined): string | null {
  if (!input) return null
  
  // Aceita formatos: (XX) XXXXX-XXXX, XX XXXXX-XXXX, XXXXXXXXXX
  const telefone = input.trim()
  const telefoneRegex = /^(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/
  
  if (!telefoneRegex.test(telefone)) {
    throw new Error('Telefone inválido. Use o formato: (XX) XXXXX-XXXX')
  }
  
  return telefone
}

/**
 * Valida e sanitiza uma data
 */
export function sanitizeDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null
  
  const date = input instanceof Date ? input : new Date(input)
  
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida')
  }
  
  return date
}

/**
 * Sanitiza um objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, (value: any) => any>
): T {
  const sanitized: any = {}
  
  for (const key in schema) {
    if (key in obj) {
      try {
        sanitized[key] = schema[key](obj[key])
      } catch (error) {
        throw new Error(`Erro ao validar campo ${String(key)}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }
  }
  
  return sanitized
}

/**
 * Valida um CPF
 */
export function sanitizeCPF(input: string | null | undefined): string | null {
  if (!input) return null
  
  // Remover caracteres não numéricos
  const cpf = input.replace(/[^\d]/g, '')
  
  // Validar tamanho
  if (cpf.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos')
  }
  
  // Validar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) {
    throw new Error('CPF inválido')
  }
  
  // Algoritmo de validação de CPF
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  const digit1 = remainder >= 10 ? 0 : remainder
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  const digit2 = remainder >= 10 ? 0 : remainder
  
  if (parseInt(cpf.charAt(9)) !== digit1 || parseInt(cpf.charAt(10)) !== digit2) {
    throw new Error('CPF inválido')
  }
  
  return cpf
}

/**
 * Valida um campo booleano
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input
  if (typeof input === 'string') {
    const lower = input.toLowerCase()
    if (lower === 'true' || lower === '1') return true
    if (lower === 'false' || lower === '0') return false
  }
  if (typeof input === 'number') {
    return input !== 0
  }
  throw new Error('Valor booleano inválido')
}

/**
 * Valida um array
 */
export function sanitizeArray<T>(
  input: any,
  itemValidator: (item: any) => T
): T[] {
  if (!Array.isArray(input)) {
    throw new Error('Valor deve ser um array')
  }
  
  return input.map((item, index) => {
    try {
      return itemValidator(item)
    } catch (error) {
      throw new Error(`Erro ao validar item ${index}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  })
}
