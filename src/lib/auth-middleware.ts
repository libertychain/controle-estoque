/**
 * Middleware de Autenticação
 * 
 * Este middleware fornece funções para verificar autenticação e autorização
 * nas rotas da API usando tokens JWT.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ErrorCode } from './api-error-handler'
import { authRateLimiter } from './rate-limiter'
import jwt from 'jsonwebtoken'

// Log de debug para verificar se a variável de ambiente está sendo lida
console.log('🔍 Verificando variável DISABLE_AUTH:', process.env.DISABLE_AUTH)

/**
 * Interface para usuário autenticado
 */
export interface AuthenticatedUser {
  id: number
  nome: string
  email: string
  perfil_id: number
}

/**
 * Extrai o token de autenticação do header Authorization
 * 
 * @param request - Requisição Next.js
 * @returns Token de autenticação ou null
 */
function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  // Espera formato: "Bearer <token>"
  const parts = authHeader.split(' ')
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Verifica se o usuário está autenticado
 * 
 * @param request - Requisição Next.js
 * @returns NextResponse com erro se não autenticado, null se autenticado
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  // Verificar se autenticação está desabilitada (para desenvolvimento)
  if (process.env.DISABLE_AUTH === 'true') {
    return null
  }

  // Aplicar rate limiting para prevenir ataques de força bruta
  const rateLimitError = await authRateLimiter(request)
  if (rateLimitError) {
    return rateLimitError
  }

  const token = extractAuthToken(request)

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Token de autenticação não fornecido'
        }
      },
      { status: 401 }
    )
  }

  // Verificar se JWT_SECRET está configurado
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não está configurado nas variáveis de ambiente')
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        }
      },
      { status: 500 }
    )
  }

  try {
    // jwt.verify() já verifica automaticamente a expiração do token
    // e lança TokenExpiredError se o token estiver expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: number
      nome: string
      email: string
      perfil_id: number
    }
    
    return null
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Token expirado'
          }
        },
        { status: 401 }
      )
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Token inválido'
          }
        },
        { status: 401 }
      )
    }
    
    // Outros erros
    console.error('Erro ao validar token:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao validar autenticação'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 * 
 * @param request - Requisição Next.js
 * @param requiredPerfis - Perfis permitidos (opcional)
 * @returns NextResponse com erro se não autorizado, null se autorizado
 */
export async function requirePermission(
  request: NextRequest,
  requiredPerfis?: number[]
): Promise<NextResponse | null> {
  // Verificar se autenticação está desabilitada (para desenvolvimento)
  if (process.env.DISABLE_AUTH === 'true') {
    return null
  }

  // Primeiro, verificar se está autenticado
  const authError = await requireAuth(request)
  
  if (authError) {
    return authError
  }

  // Obter o usuário autenticado
  const usuario = getAuthenticatedUser(request)
  
  if (!usuario) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Usuário não autenticado'
        }
      },
      { status: 401 }
    )
  }

  // Se não houver perfis requeridos, permitir acesso
  if (!requiredPerfis || requiredPerfis.length === 0) {
    return null
  }

  // Verificar se o usuário tem os perfis necessários
  if (!requiredPerfis.includes(usuario.perfil_id)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: 'Permissão insuficiente'
        }
      },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Obtém o usuário autenticado da requisição
 * 
 * @param request - Requisição Next.js
 * @returns Usuário autenticado ou null
 */
export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  // Verificar se autenticação está desabilitada (para desenvolvimento)
  if (process.env.DISABLE_AUTH === 'true') {
    console.log('🔓 Autenticação desabilitada (DISABLE_AUTH=true)')
    // Retornar um usuário padrão com perfil de administrador
    return {
      id: 1,
      nome: 'Usuário Desenvolvimento',
      email: 'dev@localhost',
      perfil_id: 1 // Perfil de administrador
    }
  }

  const token = extractAuthToken(request)

  if (!token) {
    return null
  }

  // Verificar se JWT_SECRET está configurado
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não está configurado nas variáveis de ambiente')
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: number
      nome: string
      email: string
      perfil_id: number
    }
    
    return {
      id: decoded.id,
      nome: decoded.nome,
      email: decoded.email,
      perfil_id: decoded.perfil_id
    }
  } catch (error) {
    // Token inválido ou expirado
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('Token expirado ao extrair usuário do token')
      return null
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Token inválido ao extrair usuário do token:', error.message)
      return null
    }
    
    console.error('Erro ao extrair usuário do token:', error)
    return null
  }
}
