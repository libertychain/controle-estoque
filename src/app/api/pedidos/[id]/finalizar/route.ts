import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/pedidos/[id]/finalizar - Finalizar pedido e atualizar estoque
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedidoId = parseInt(params.id)

    // Buscar pedido com itens
    const pedido = await db.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      }
    })

    if (!pedido) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Pedido não encontrado'
          }
        },
        { status: 404 }
      )
    }

    if (pedido.status !== 'ABERTO') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Apenas pedidos com status ABERTO podem ser finalizados'
          }
        },
        { status: 400 }
      )
    }

    // Atualizar saldo dos produtos
    for (const item of pedido.itens) {
      const produto = await db.produto.findUnique({
        where: { id: item.produto_id }
      })

      if (produto) {
        const novoSaldo = Math.max(0, produto.saldo_atual - item.quantidade)
        
        // Criar movimentação de estoque
        await db.movimentacaoEstoque.create({
          data: {
            produto_id: produto.id,
            tipo: 'SAIDA',
            quantidade: item.quantidade,
            saldo_anterior: produto.saldo_atual,
            saldo_novo: novoSaldo,
            observacao: `Saída via pedido ${pedido.numero}`,
            usuario_id: 1 // TODO: Pegar usuário autenticado
          }
        })

        // Atualizar saldo do produto
        await db.produto.update({
          where: { id: produto.id },
          data: {
            saldo_atual: novoSaldo
          }
        })
      }
    }

    // Atualizar status do pedido
    const pedidoAtualizado = await db.pedido.update({
      where: { id: pedidoId },
      data: {
        status: 'FINALIZADO'
      },
      include: {
        secretaria: true,
        setor: true,
        itens: {
          include: {
            produto: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: pedidoAtualizado,
        message: 'Pedido finalizado com sucesso e estoque atualizado'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao finalizar pedido'
        }
      },
      { status: 500 }
    )
  }
}
