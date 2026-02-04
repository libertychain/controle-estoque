import { NextRequest, NextResponse } from 'next/server'
import { buscarContextoPedidos, buscarPedidosPorProduto, buscarUltimoPedidoPorProduto } from '@/services/pedidos-context.service'

/**
 * API endpoint para buscar contexto de pedidos para o assistente de IA
 * 
 * Query parameters:
 * - limite: número de pedidos a retornar (padrão: 10)
 * - incluir_inativos: incluir pedidos inativos (padrão: false)
 * - produto_codigo: código do produto para filtrar pedidos (opcional)
 * - ultimo_pedido: se true, retorna apenas o último pedido do produto (requer produto_codigo)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const limite = parseInt(searchParams.get('limite') || '10', 10)
    const incluirInativos = searchParams.get('incluir_inativos') === 'true'
    const produtoCodigo = searchParams.get('produto_codigo')
    const ultimoPedido = searchParams.get('ultimo_pedido') === 'true'
    
    // Se for solicitado o último pedido de um produto específico
    if (ultimoPedido && produtoCodigo) {
      const resultado = await buscarUltimoPedidoPorProduto(produtoCodigo)
      
      if (!resultado.success) {
        return NextResponse.json(
          { success: false, error: { code: 'SEARCH_ERROR', message: resultado.erro } },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: {
          tipo: 'ultimo_pedido',
          pedido: resultado.pedido
        }
      })
    }
    
    // Se for solicitado pedidos de um produto específico
    if (produtoCodigo) {
      const resultado = await buscarPedidosPorProduto(produtoCodigo, limite)
      
      if (!resultado.success) {
        return NextResponse.json(
          { success: false, error: { code: 'SEARCH_ERROR', message: resultado.erro } },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: {
          tipo: 'pedidos_por_produto',
          produto_codigo: produtoCodigo,
          total_pedidos: resultado.pedidos?.length || 0,
          pedidos: resultado.pedidos
        }
      })
    }
    
    // Buscar contexto geral de pedidos
    const resultado = await buscarContextoPedidos(limite, incluirInativos)
    
    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: { code: 'SEARCH_ERROR', message: resultado.erro } },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tipo: 'contexto_geral',
        total_pedidos: resultado.contexto?.total_pedidos || 0,
        pedidos: resultado.contexto?.pedidos || []
      }
    })
  } catch (error) {
    console.error('Erro ao buscar contexto de pedidos:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar contexto de pedidos' } },
      { status: 500 }
    )
  }
}
