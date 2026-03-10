import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * Código de erro padronizado
 */
export enum ErrorCode {
  // Erros de autenticação
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Erros de validação
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CNPJ = 'INVALID_CNPJ',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  DUPLICATE_CODE = 'DUPLICATE_CODE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Erros do Prisma
  NOT_FOUND = 'NOT_FOUND',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  UNIQUE_CONSTRAINT = 'UNIQUE_CONSTRAINT',
  
  // Erros internos
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface para resposta de erro padronizada
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: string
  }
}

/**
 * Retorna mensagem de erro amigável baseada no código do erro Prisma
 */
function getPrismaErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    P2002: 'Já existe um registro com esses dados',
    P2003: 'Erro de chave estrangeira',
    P2025: 'Registro não encontrado',
    P2014: 'Erro ao criar registro devido a restrição de chave estrangeira'
  }
  
  return errorMessages[code] || 'Erro no banco de dados'
}

/**
 * Manipula erros de forma padronizada para APIs
 * 
 * @param error - O erro capturado
 * @param context - Contexto onde o erro ocorreu (ex: "ao criar fornecedor")
 * @returns NextResponse com erro formatado
 */
export function handleApiError(
  error: unknown,
  context: string
): NextResponse<ApiErrorResponse> {
  console.error(`Erro em ${context}:`, error)
  
  // Tratar erros específicos do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: getPrismaErrorMessage(error.code),
          details: error.message
        }
      },
      { status: 400 }
    )
  }
  
  // Tratar erros genéricos do Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Erro de validação de dados',
          details: error.message
        }
      },
      { status: 400 }
    )
  }
  
  // Tratar erros JavaScript padrão
  if (error instanceof Error) {
    // Verificar se é um erro de validação
    const message = error.message.toLowerCase()
    if (
      message.includes('inválido') ||
      message.includes('inválido') ||
      message.includes('invalid') ||
      message.includes('email') ||
      message.includes('cnpj') ||
      message.includes('telefone') ||
      message.includes('validar campo') ||
      message.includes('validar item') ||
      message.includes('maior ou igual a') ||
      message.includes('menor ou igual a')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: error.message
          }
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: error.message
        }
      },
      { status: 500 }
    )
  }
  
  // Erro desconhecido
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Erro desconhecido'
      }
    },
    { status: 500 }
  )
}

/**
 * Cria uma resposta de erro de validação
 * 
 * @param code - Código do erro
 * @param message - Mensagem de erro
 * @returns NextResponse com erro de validação
 */
export function validationError(
  code: ErrorCode,
  message: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message
      }
    },
    { status: 400 }
  )
}
