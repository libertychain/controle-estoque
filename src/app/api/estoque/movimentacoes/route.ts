import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/estoque/movimentacoes - Listar movimentações
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const produtoId = searchParams.get('produto_id')
    const tipo = searchParams.get('tipo')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (produtoId) {
      where.produto_id = parseInt(produtoId)
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (dataInicio || dataFim) {
      where.data = {}
      if (dataInicio) {
        where.data.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.data.lte = new Date(dataFim)
      }
    }

    // Get movements with relations
    const [movimentacoes, total] = await Promise.all([
      db.movimentacaoEstoque.findMany({
        where,
        skip,
        take: limit,
        include: {
          produto: {
            include: {
              categoria: true,
              unidade: true
            }
          }
        },
        orderBy: { data: 'desc' }
      }),
      db.movimentacaoEstoque.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        movimentacoes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar movimentações'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/estoque/movimentacoes - Registrar movimentação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { produto_id, tipo, quantidade, observacao, usuario_id } = body

    // Validate required fields
    if (!produto_id || !tipo || !quantidade || !usuario_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campos obrigatórios: produto_id, tipo, quantidade, usuario_id'
          }
        },
        { status: 400 }
      )
    }

    // Validate tipo
    const tiposValidos = ['ENTRADA', 'SAIDA', 'TRANSFERENCIA']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Tipo inválido. Valores válidos: ${tiposValidos.join(', ')}`
          }
        },
        { status: 400 }
      )
    }

    // Get current product
    const produto = await db.produto.findUnique({
      where: { id: produto_id }
    })

    if (!produto) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Produto não encontrado'
          }
        },
        { status: 404 }
      )
    }

    const saldo_anterior = produto.saldo_atual
    let saldo_novo: number

    // Calculate new balance
    if (tipo === 'ENTRADA') {
      saldo_novo = saldo_anterior + quantidade
    } else if (tipo === 'SAIDA') {
      if (saldo_anterior < quantidade) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: 'Saldo insuficiente para esta operação'
            }
          },
          { status: 400 }
        )
      }
      saldo_novo = saldo_anterior - quantidade
    } else {
      // TRANSFERENCIA - doesn't change balance, just location
      saldo_novo = saldo_anterior
    }

    // Create movement
    const movimentacao = await db.movimentacaoEstoque.create({
      data: {
        produto_id,
        tipo,
        quantidade,
        saldo_anterior,
        saldo_novo,
        observacao,
        usuario_id
      },
      include: {
        produto: {
          include: {
            categoria: true,
            unidade: true
          }
        }
      }
    })

    // Update product balance
    await db.produto.update({
      where: { id: produto_id },
      data: { saldo_atual: saldo_novo }
    })

    return NextResponse.json(
      {
        success: true,
        data: movimentacao,
        message: 'Movimentação registrada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao registrar movimentação'
        }
      },
      { status: 500 }
    )
  }
}
