import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/produtos-aquisicao - Listar produtos de aquisições disponíveis para pedidos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const aquisicaoId = searchParams.get('aquisicao_id')

    // Build where clause
    const where: any = {
      aquisicao: {
        ativo: true,
        data_inicio: {
          lte: new Date()
        },
        OR: [
          { data_fim: null },
          { data_fim: { gte: new Date() } }
        ]
      }
    }

    if (search) {
      where.OR = [
        { descricao: { contains: search } },
        { aquisicao: { fornecedor: { nome: { contains: search } } } }
      ]
    }

    if (aquisicaoId) {
      where.aquisicao.id = parseInt(aquisicaoId)
    }

    // Get produtos de aquisições with relations
    const produtosAquisicao = await db.produtoAquisicao.findMany({
      where,
      include: {
        aquisicao: {
          include: {
            fornecedor: true
          }
        }
      },
      orderBy: { criado_em: 'desc' },
      take: 100
    })

    // Buscar todos os itens de pedidos para calcular o saldo real
    const itensPedidos = await db.itemPedido.findMany({
      where: {
        produto: {
          descricao: {
            in: produtosAquisicao.map(pa => pa.descricao)
          }
        }
      },
      include: {
        produto: true
      }
    })

    // Calcular o saldo real para cada produto de aquisição
    const produtos = await Promise.all(produtosAquisicao.map(async (pa, index) => {
      // Calcular a quantidade já utilizada em pedidos para este produto
      const quantidadeUtilizada = itensPedidos
        .filter(item => item.produto.descricao === pa.descricao)
        .reduce((total, item) => total + item.quantidade, 0)

      // Saldo = quantidade da aquisição - quantidade utilizada em pedidos
      const saldoAtual = Math.max(0, pa.quantidade - quantidadeUtilizada)

      return {
        id: `PA-${pa.id}`, // ID virtual para identificar
        codigo: `PAQ-${pa.aquisicao.numero_proc}-${String(index + 1).padStart(3, '0')}`,
        descricao: pa.descricao,
        unidade: { id: 0, sigla: pa.unidade },
        marca: pa.marca ? { id: 0, nome: pa.marca } : null,
        fornecedor: pa.aquisicao.fornecedor,
        saldo_atual: saldoAtual,
        saldo_minimo: 0,
        preco_unitario: pa.preco_unitario,
        prazo_entrega: pa.prazo_entrega,
        aquisicao_id: pa.aquisicao_id,
        produto_aquisicao_id: pa.id
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        produtos
      }
    })
  } catch (error) {
    console.error('Erro ao buscar produtos de aquisições:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar produtos de aquisições'
        }
      },
      { status: 500 }
    )
  }
}
