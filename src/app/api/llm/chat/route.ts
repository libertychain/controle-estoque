import { NextRequest, NextResponse } from 'next/server'
import { perguntar } from '@/services/llm.service'
import { buscarProdutosPorPergunta, formatarProdutosParaContexto } from '@/services/produto-search.service'
import { buscarContextoPedidos, formatarContextoPedidos, buscarPedidosPorProduto } from '@/services/pedidos-context.service'

/**
 * Detecta se a pergunta é sobre pedidos
 */
function ePerguntaSobrePedidos(pergunta: string): boolean {
  const palavrasChavePedidos = [
    'pedido', 'pedidos', 'último pedido', 'ultimo pedido', 
    'qual pedido', 'quais pedidos', 'histórico de pedidos',
    'pedido de', 'pedidos de', 'foi pedido', 'foram pedidos'
  ]
  
  const perguntaLower = pergunta.toLowerCase()
  return palavrasChavePedidos.some(palavra => perguntaLower.includes(palavra))
}

// POST /api/llm/chat - Chat com o assistente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pergunta, contexto } = body

    if (!pergunta) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campo obrigatório: pergunta'
          }
        },
        { status: 400 }
      )
    }

    const inicioBusca = Date.now()
    
    // Buscar produtos no banco de dados baseado na pergunta (busca inteligente)
    // Aumentado limite de 10 para 20 para permitir mais produtos no contexto
    const buscaResult = await buscarProdutosPorPergunta(pergunta, 20)
    
    const tempoBusca = Date.now() - inicioBusca
    console.log(`⏱️  Tempo de busca no banco de dados: ${tempoBusca}ms`)

    // Usar contexto fornecido ou produtos encontrados
    let contextoFinal = contexto || ''
    
    if (buscaResult.success && buscaResult.produtos) {
      contextoFinal = formatarProdutosParaContexto(buscaResult.produtos)
      console.log(`✓ Produtos encontrados: ${buscaResult.total_encontrado}`)
      
      // Log de debug para mostrar os produtos encontrados
      console.log('📋 Produtos encontrados:')
      buscaResult.produtos.forEach(p => {
        console.log(`  - ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade}`)
      })
    } else {
      console.warn('Não foi possível encontrar produtos:', buscaResult.erro)
      if (!contexto) {
        contextoFinal = 'NENHUM PRODUTO ENCONTRADO NO BANCO DE DADOS.'
      }
    }

    // Verificar se a pergunta é sobre pedidos e incluir contexto de pedidos
    if (ePerguntaSobrePedidos(pergunta)) {
      console.log('📦 Pergunta sobre pedidos detectada, buscando contexto de pedidos...')
      
      const inicioBuscaPedidos = Date.now()
      
      // Se encontrou produtos, buscar pedidos desses produtos
      if (buscaResult.success && buscaResult.produtos && buscaResult.produtos.length > 0) {
        // Buscar pedidos para cada produto encontrado
        for (const produto of buscaResult.produtos) {
          const pedidosResult = await buscarPedidosPorProduto(produto.codigo, 5)
          
          if (pedidosResult.success && pedidosResult.pedidos && pedidosResult.pedidos.length > 0) {
            console.log(`✓ Pedidos encontrados para ${produto.codigo}: ${pedidosResult.pedidos.length}`)
            contextoFinal += '\n\n' + formatarContextoPedidos({
              total_pedidos: pedidosResult.pedidos.length,
              pedidos: pedidosResult.pedidos
            })
          }
        }
      } else {
        // Se não encontrou produtos, buscar contexto geral de pedidos
        const pedidosResult = await buscarContextoPedidos(10, false)
        
        if (pedidosResult.success && pedidosResult.contexto) {
          console.log(`✓ Contexto geral de pedidos: ${pedidosResult.contexto.total_pedidos} pedidos`)
          contextoFinal += '\n\n' + formatarContextoPedidos(pedidosResult.contexto)
        }
      }
      
      const tempoBuscaPedidos = Date.now() - inicioBuscaPedidos
      console.log(`⏱️  Tempo de busca de pedidos: ${tempoBuscaPedidos}ms`)
    }

    const inicioLLM = Date.now()
    
    const response = await perguntar(pergunta, contextoFinal)
    
    const tempoLLM = Date.now() - inicioLLM
    const tempoTotal = tempoBusca + tempoLLM
    
    console.log(`⏱️  Tempo de processamento LLM: ${tempoLLM}ms`)
    console.log(`⏱️  Tempo total da requisição: ${tempoTotal}ms`)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro no chat LLM:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao processar pergunta'
        }
      },
      { status: 500 }
    )
  }
}
