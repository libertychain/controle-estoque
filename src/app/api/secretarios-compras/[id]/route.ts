import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/secretarios-compras/[id] - Buscar secretário de compras individual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const secretarioId = parseInt(id)

    if (isNaN(secretarioId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do secretário de compras inválido'
          }
        },
        { status: 400 }
      )
    }

    const secretario = await db.secretarioCompras.findUnique({
      where: {
        id: secretarioId
      }
    })

    if (!secretario) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Secretário de compras não encontrado'
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        secretario
      }
    })
  } catch (error) {
    console.error('Erro ao buscar secretário de compras:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar secretário de compras'
        }
      },
      { status: 500 }
    )
  }
}

// PUT /api/secretarios-compras/[id] - Atualizar secretário de compras
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const secretarioId = parseInt(id)

    if (isNaN(secretarioId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do secretário de compras inválido'
          }
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    const {
      nome,
      cargo,
      matricula,
      email,
      telefone,
      ativo
    } = body

    // Verificar se o secretário existe
    const secretario = await db.secretarioCompras.findUnique({
      where: { id: secretarioId }
    })

    if (!secretario) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Secretário de compras não encontrado'
          }
        },
        { status: 404 }
      )
    }

    // Atualizar secretário
    const secretarioAtualizado = await db.secretarioCompras.update({
      where: { id: secretarioId },
      data: {
        nome: nome !== undefined ? nome : secretario.nome,
        cargo: cargo !== undefined ? cargo : secretario.cargo,
        matricula: matricula !== undefined ? matricula : secretario.matricula,
        email: email !== undefined ? email : secretario.email,
        telefone: telefone !== undefined ? telefone : secretario.telefone,
        ativo: ativo !== undefined ? ativo : secretario.ativo
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        secretario: secretarioAtualizado
      },
      message: 'Secretário de compras atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar secretário de compras:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao atualizar secretário de compras'
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/secretarios-compras/[id] - Excluir secretário de compras
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const secretarioId = parseInt(id)

    if (isNaN(secretarioId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do secretário de compras inválido'
          }
        },
        { status: 400 }
      )
    }

    // Verificar se o secretário existe
    const secretario = await db.secretarioCompras.findUnique({
      where: { id: secretarioId }
    })

    if (!secretario) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Secretário de compras não encontrado'
          }
        },
        { status: 404 }
      )
    }

    // Soft delete
    await db.secretarioCompras.update({
      where: { id: secretarioId },
      data: { ativo: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Secretário de compras excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir secretário de compras:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao excluir secretário de compras'
        }
      },
      { status: 500 }
    )
  }
}
