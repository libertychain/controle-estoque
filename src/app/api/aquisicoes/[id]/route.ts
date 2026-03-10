import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/aquisicoes/[id] - Buscar aquisição por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido'
          }
        },
        { status: 400 }
      )
    }

    const aquisicao = await db.aquisicao.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: true
      }
    })

    if (!aquisicao) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Aquisição não encontrada'
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { aquisicao }
    })
  } catch (error) {
    console.error('Erro ao buscar aquisição:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar aquisição'
        }
      },
      { status: 500 }
    )
  }
}

// PUT /api/aquisicoes/[id] - Atualizar aquisição
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    if (isNaN(parsedId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido'
          }
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    const {
      numero_proc,
      modalidade,
      fornecedor_id,
      numero_contrato,
      data_inicio,
      data_fim,
      observacoes,
      produtos
    } = body

    // Validate required fields
    if (!numero_proc || !modalidade || !fornecedor_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campos obrigatórios: numero_proc, modalidade, fornecedor_id'
          }
        },
        { status: 400 }
      )
    }

    // Check if aquisicao exists
    const existingAquisicao = await db.aquisicao.findUnique({
      where: { id: parsedId }
    })

    if (!existingAquisicao) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Aquisição não encontrada'
          }
        },
        { status: 404 }
      )
    }

    // Check if numero_proc already exists (excluding current aquisicao)
    const duplicateAquisicao = await db.aquisicao.findFirst({
      where: {
        numero_proc,
        id: { not: parsedId }
      }
    })

    if (duplicateAquisicao) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Número de processo já cadastrado em outra aquisição'
          }
        },
        { status: 409 }
      )
    }

    // Update aquisicao
    const aquisicao = await db.aquisicao.update({
      where: { id: parsedId },
      data: {
        numero_proc,
        modalidade,
        fornecedor_id: parseInt(fornecedor_id),
        numero_contrato: numero_contrato || null,
        data_inicio: data_inicio ? new Date(data_inicio) : null,
        data_fim: data_fim ? new Date(data_fim) : null,
        observacoes: observacoes || null,
        // Se produtos foram fornecidos, atualiza-los
        ...(produtos && produtos.length > 0 ? {
          produtos: {
            deleteMany: {},
            create: produtos.map((p: any) => ({
              descricao: p.descricao,
              unidade: p.unidade,
              marca: p.marca || null,
              quantidade: parseFloat(p.quantidade.toString().replace(',', '.')), // Converter string para number, substituindo vírgula por ponto
              preco_unitario: parseFloat(p.preco_unitario),
              prazo_entrega: p.prazo_entrega ? parseInt(p.prazo_entrega) : null
            }))
          }
        } : {})
      },
      include: {
        fornecedor: true,
        produtos: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: aquisicao,
        message: 'Aquisição atualizada com sucesso'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar aquisição:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao atualizar aquisição'
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/aquisicoes/[id] - Excluir aquisição
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    if (isNaN(parsedId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido'
          }
        },
        { status: 400 }
      )
    }

    // Check if aquisicao exists
    const existingAquisicao = await db.aquisicao.findUnique({
      where: { id: parsedId }
    })

    if (!existingAquisicao) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Aquisição não encontrada'
          }
        },
        { status: 404 }
      )
    }

    // Delete aquisicao (cascade delete will handle related records)
    await db.aquisicao.delete({
      where: { id: parsedId }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Aquisição excluída com sucesso'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir aquisição:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao excluir aquisição'
        }
      },
      { status: 500 }
    )
  }
}
