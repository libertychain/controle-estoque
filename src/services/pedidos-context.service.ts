import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PedidoInfo {
  id: number
  numero: string
  data_pedido: Date
  secretaria: string
  setor: string
  total_itens: number
  itens: Array<{
    id: number
    produto_codigo: string
    produto_descricao: string
    quantidade: number
    preco_unitario: number
    disponivel: boolean
    observacao: string | null
  }>
}

export interface PedidosContext {
  total_pedidos: number
  pedidos: PedidoInfo[]
}

/**
 * Busca informações sobre pedidos para o contexto do assistente de IA
 */
export async function buscarContextoPedidos(
  limite: number = 10,
  incluirInativos: boolean = false
): Promise<{ success: boolean; contexto?: PedidosContext; erro?: string }> {
  try {
    const where: any = {}
    
    if (!incluirInativos) {
      where.ativo = true
    }
    
    // Buscar pedidos com itens
    const pedidos = await db.pedido.findMany({
      where,
      include: {
        secretaria: {
          select: { nome: true }
        },
        setor: {
          select: { nome: true }
        },
        itens: {
          include: {
            produto: {
              select: {
                codigo: true,
                descricao: true
              }
            }
          }
        }
      },
      orderBy: {
        data_pedido: 'desc'
      },
      take: limite
    })
    
    // Formatar os pedidos
    const pedidosFormatados: PedidoInfo[] = pedidos.map(pedido => ({
      id: pedido.id,
      numero: pedido.numero,
      data_pedido: pedido.data_pedido,
      secretaria: pedido.secretaria.nome,
      setor: pedido.setor.nome,
      total_itens: pedido.itens.length,
      itens: pedido.itens.map(item => ({
        id: item.id,
        produto_codigo: item.produto.codigo,
        produto_descricao: item.produto.descricao,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        disponivel: item.disponivel,
        observacao: item.observacao
      }))
    }))
    
    const contexto: PedidosContext = {
      total_pedidos: pedidos.length,
      pedidos: pedidosFormatados
    }
    
    return { success: true, contexto }
  } catch (error) {
    console.error('Erro ao buscar contexto de pedidos:', error)
    return { success: false, erro: 'Erro ao buscar contexto de pedidos' }
  }
}

/**
 * Busca pedidos relacionados a um produto específico
 */
export async function buscarPedidosPorProduto(
  produtoCodigo: string,
  limite: number = 5
): Promise<{ success: boolean; pedidos?: PedidoInfo[]; erro?: string }> {
  try {
    // Buscar pedidos que contenham o produto
    const pedidos = await db.pedido.findMany({
      where: {
        ativo: true,
        itens: {
          some: {
            produto: {
              codigo: produtoCodigo
            }
          }
        }
      },
      include: {
        secretaria: {
          select: { nome: true }
        },
        setor: {
          select: { nome: true }
        },
        itens: {
          include: {
            produto: {
              select: {
                codigo: true,
                descricao: true
              }
            }
          }
        }
      },
      orderBy: {
        data_pedido: 'desc'
      },
      take: limite
    })
    
    // Formatar os pedidos
    const pedidosFormatados: PedidoInfo[] = pedidos.map(pedido => ({
      id: pedido.id,
      numero: pedido.numero,
      data_pedido: pedido.data_pedido,
      secretaria: pedido.secretaria.nome,
      setor: pedido.setor.nome,
      total_itens: pedido.itens.length,
      itens: pedido.itens
        .filter(item => item.produto.codigo === produtoCodigo)
        .map(item => ({
          id: item.id,
          produto_codigo: item.produto.codigo,
          produto_descricao: item.produto.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          disponivel: item.disponivel,
          observacao: item.observacao
        }))
    }))
    
    return { success: true, pedidos: pedidosFormatados }
  } catch (error) {
    console.error('Erro ao buscar pedidos por produto:', error)
    return { success: false, erro: 'Erro ao buscar pedidos por produto' }
  }
}

/**
 * Busca o último pedido de um produto específico
 */
export async function buscarUltimoPedidoPorProduto(
  produtoCodigo: string
): Promise<{ success: boolean; pedido?: PedidoInfo; erro?: string }> {
  try {
    const pedidos = await db.pedido.findMany({
      where: {
        ativo: true,
        itens: {
          some: {
            produto: {
              codigo: produtoCodigo
            }
          }
        }
      },
      include: {
        secretaria: {
          select: { nome: true }
        },
        setor: {
          select: { nome: true }
        },
        itens: {
          include: {
            produto: {
              select: {
                codigo: true,
                descricao: true
              }
            }
          }
        }
      },
      orderBy: {
        data_pedido: 'desc'
      },
      take: 1
    })
    
    if (pedidos.length === 0) {
      return { success: true, pedido: undefined }
    }
    
    const pedido = pedidos[0]
    
    const pedidoFormatado: PedidoInfo = {
      id: pedido.id,
      numero: pedido.numero,
      data_pedido: pedido.data_pedido,
      secretaria: pedido.secretaria.nome,
      setor: pedido.setor.nome,
      total_itens: pedido.itens.length,
      itens: pedido.itens
        .filter(item => item.produto.codigo === produtoCodigo)
        .map(item => ({
          id: item.id,
          produto_codigo: item.produto.codigo,
          produto_descricao: item.produto.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          disponivel: item.disponivel,
          observacao: item.observacao
        }))
    }
    
    return { success: true, pedido: pedidoFormatado }
  } catch (error) {
    console.error('Erro ao buscar último pedido por produto:', error)
    return { success: false, erro: 'Erro ao buscar último pedido por produto' }
  }
}

/**
 * Formata o contexto de pedidos como texto para o LLM
 */
export function formatarContextoPedidos(contexto: PedidosContext): string {
  let contextoTexto = `=== CONTEXTO DE PEDIDOS ===\n`
  contextoTexto += `Total de pedidos: ${contexto.total_pedidos}\n\n`
  
  contexto.pedidos.forEach((pedido, index) => {
    contextoTexto += `PEDIDO ${index + 1}: ${pedido.numero}\n`
    contextoTexto += `Data: ${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}\n`
    contextoTexto += `Secretaria: ${pedido.secretaria}\n`
    contextoTexto += `Setor: ${pedido.setor}\n`
    contextoTexto += `Total de itens: ${pedido.total_itens}\n\n`
    
    pedido.itens.forEach(item => {
      contextoTexto += `  - ${item.produto_codigo}: ${item.produto_descricao}\n`
      contextoTexto += `    Quantidade: ${item.quantidade}\n`
      contextoTexto += `    Preço unitário: R$ ${item.preco_unitario.toFixed(2)}\n`
      contextoTexto += `    Disponível: ${item.disponivel ? 'Sim' : 'Não'}\n`
      if (item.observacao) {
        contextoTexto += `    Observação: ${item.observacao}\n`
      }
    })
  })
  
  contextoTexto += '\n=== FIM DO CONTEXTO DE PEDIDOS ===\n'
  
  return contextoTexto
}
