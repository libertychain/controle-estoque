import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/secretarios-compras - Listar secretários de compras
export async function GET(request: NextRequest) {
  try {
    const secretarios = await db.secretarioCompras.findMany({
      where: {
        ativo: true
      },
      orderBy: {
        nome: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        secretarios
      }
    })
  } catch (error) {
    console.error('Erro ao buscar secretários de compras:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar secretários de compras'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/secretarios-compras - Criar secretário de compras
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nome,
      cargo,
      matricula,
      email,
      telefone
    } = body

    // Validate required fields
    if (!nome) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campo obrigatório: nome'
          }
        },
        { status: 400 }
      )
    }

    const secretario = await db.secretarioCompras.create({
      data: {
        nome,
        cargo: cargo || 'Secretário(a) de Compras',
        matricula,
        email,
        telefone
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          secretario
        },
        message: 'Secretário de compras criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar secretário de compras:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao criar secretário de compras'
        }
      },
      { status: 500 }
    )
  }
}
