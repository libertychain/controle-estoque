import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

// POST /api/pedidos/[id]/finalizar - Finalizar pedido e atualizar estoque
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    
    // No Next.js 15, params é uma Promise que precisa ser aguardada
    const { id } = await params
    const pedidoId = parseInt(id)

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

    // Verificar se o pedido já foi finalizado (já tem movimentações de SAIDA)
    const movimentacoesExistente = await db.movimentacaoEstoque.findFirst({
      where: {
        produto: {
          itensPedido: {
            some: {
              pedido_id: pedidoId
            }
          }
        },
        tipo: 'SAIDA',
        observacao: {
          contains: `Saída via pedido ${pedido.numero}`
        }
      }
    })

    if (movimentacoesExistente) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_FINALIZED',
            message: 'Este pedido já foi finalizado anteriormente'
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
            usuario_id: usuario.id
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
    
    return NextResponse.json(
      {
        success: true,
        data: pedido,
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
