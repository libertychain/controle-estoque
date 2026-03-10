import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, requirePermission } from '@/lib/auth-middleware'
import { handleApiError, validationError, ErrorCode } from '@/lib/api-error-handler'
import { 
  sanitizeString, 
  sanitizeEmail, 
  sanitizeTelefone, 
  sanitizeCNPJ,
  sanitizeObject 
} from '@/lib/input-validator'

// GET /api/fornecedores - Listar fornecedores
export async function GET(request: NextRequest) {
  const usuario = getAuthenticatedUser(request)
  
  if (!usuario) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      },
      { status: 401 }
    )
  }
  
  // Verificar permissões - apenas perfis 1, 2 e 3 podem acessar fornecedores
  const permissionError = await requirePermission(request, [1, 2, 3]) // Perfis permitidos
  if (permissionError) {
    return permissionError
  }
  
  try {
    console.log('Iniciando busca de fornecedores...')
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {
      ativo: true
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nome: { contains: search } },
        { cnpj: { contains: search } }
      ]
    }

    console.log('Buscando fornecedores com where:', where)
    // Get fornecedores
    const fornecedores = await db.fornecedor.findMany({
      where,
      orderBy: { nome: 'asc' }
    })

    console.log('Fornecedores encontrados:', fornecedores.length)
    return NextResponse.json({
      success: true,
      data: {
        fornecedores,
        total: fornecedores.length
      }
    })
  } catch (error) {
    return handleApiError(error, 'ao buscar fornecedores')
  }
}

// POST /api/fornecedores - Criar novo fornecedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Criando novo fornecedor:', body)

    // Sanitizar e validar todos os campos usando o utilitário
    const sanitizedBody = sanitizeObject(body, {
      codigo: (val) => sanitizeString(val, 50),
      nome: (val) => sanitizeString(val, 200),
      cnpj: (val) => sanitizeCNPJ(val),
      contato: (val) => sanitizeString(val, 100),
      telefone: (val) => sanitizeTelefone(val),
      email: (val) => sanitizeEmail(val),
      endereco: (val) => sanitizeString(val, 500)
    })

    // Verificar se já existe fornecedor com o mesmo código
    const fornecedorExistente = await db.fornecedor.findUnique({
      where: { codigo: sanitizedBody.codigo }
    })

    if (fornecedorExistente) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'Já existe um fornecedor com este código'
          }
        },
        { status: 409 }
      )
    }

    // Criar fornecedor com dados sanitizados
    const fornecedor = await db.fornecedor.create({
      data: {
        codigo: sanitizedBody.codigo,
        nome: sanitizedBody.nome,
        cnpj: sanitizedBody.cnpj,
        contato: sanitizedBody.contato,
        telefone: sanitizedBody.telefone,
        email: sanitizedBody.email,
        endereco: sanitizedBody.endereco,
        ativo: true
      }
    })

    console.log('Fornecedor criado com sucesso:', fornecedor.id)
    return NextResponse.json({
      success: true,
      data: {
        fornecedor
      }
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'ao criar fornecedor')
  }
}
