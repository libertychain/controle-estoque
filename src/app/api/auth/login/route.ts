/**
 * API de Login
 * 
 * Esta API autentica usuários e gera tokens JWT para acesso ao sistema.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-error-handler'
import { hashPassword, verifyPassword } from '@/lib/password-hasher'
import jwt from 'jsonwebtoken'
import { authRateLimiter } from '@/lib/rate-limiter'

// POST /api/auth/login - Autenticar usuário
export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting para prevenir ataques de força bruta
    const rateLimitError = await authRateLimiter(request)
    if (rateLimitError) {
      return rateLimitError
    }

    const body = await request.json()
    const { email, password } = body

    // Validar campos obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email e senha são obrigatórios'
          }
        },
        { status: 400 }
      )
    }

    // Buscar usuário no banco de dados
    const usuario = await db.usuario.findUnique({
      where: { email },
      include: {
        perfil: true
      }
    })

    // Verificar se usuário existe
    if (!usuario) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email ou senha inválidos'
          }
        },
        { status: 401 }
      )
    }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Usuário inativo. Entre em contato com o administrador.'
          }
        },
        { status: 403 }
      )
    }

    // Verificar senha
    const passwordValid = await verifyPassword(password, usuario.senha)
    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email ou senha inválidos'
          }
        },
        { status: 401 }
      )
    }

    // Verificar se JWT_SECRET está configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRÍTICO: JWT_SECRET não configurado. Login não funcionará corretamente.')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor: JWT_SECRET não configurado'
          }
        },
        { status: 500 }
      )
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil_id: usuario.perfil_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h' // Token expira em 24 horas
      }
    )

    // Retornar token e dados do usuário
    return NextResponse.json({
      success: true,
      data: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil_id: usuario.perfil_id,
          perfil: {
            id: usuario.perfil.id,
            nome: usuario.perfil.nome,
            descricao: usuario.perfil.descricao
          }
        }
      }
    })
  } catch (error) {
    return handleApiError(error, 'ao fazer login')
  }
}
