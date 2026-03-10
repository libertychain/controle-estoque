import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { handleApiError } from '@/lib/api-error-handler'
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeObject,
  sanitizeArray
} from '@/lib/input-validator'

/**
 * Função auxiliar para criar ou buscar produto com cálculo correto de saldo
 *
 * Esta função centraliza a lógica de criação de produtos para evitar duplicação
 * de código entre pedidos e aquisições.
 *
 * @param tx - Transação Prisma
 * @param descricao - Descrição do produto
 * @param fornecedorId - ID do fornecedor
 * @param aquisicaoId - ID da aquisição (opcional)
 * @returns Produto criado ou encontrado
 */
async function criarOuBuscarProduto(
  tx: any,
  descricao: string,
  fornecedorId: number,
  aquisicaoId?: number
) {
  // Buscar categoria e unidade padrão usando upsert para evitar race conditions
  const categoria = await tx.categoria.upsert({
    where: { nome: 'Geral' },
    update: {},
    create: { nome: 'Geral' }
  })

  const unidade = await tx.unidade.upsert({
    where: { sigla: 'UN' },
    update: {},
    create: { sigla: 'UN', descricao: 'Unidade' }
  })

  // Buscar ou criar marca
  let marcaId: number | null = null
  // Nota: A marca seria passada como parâmetro se necessário
  // const marca = await tx.marca.upsert({
  //   where: { nome: marcaNome },
  //   update: {},
  //   create: { nome: marcaNome }
  // })
  // marcaId = marca?.id || null

  // Buscar produto existente
  const produto = await tx.produto.findFirst({
    where: {
      descricao,
      fornecedor_id: fornecedorId
    }
  })

  if (produto) {
    return produto
  }

  // Buscar itens de pedidos anteriores para calcular o saldo inicial correto
  const itensPedidosAnteriores = await tx.itemPedido.findMany({
    where: {
      produto: {
        descricao,
        fornecedor_id: fornecedorId
      }
    }
  })

  // Calcular quantidade já utilizada em pedidos anteriores
  const quantidadeUtilizada = itensPedidosAnteriores.reduce(
    (total, item) => total + item.quantidade,
    0
  )

  // Buscar saldo atual existente do produto (se já existe)
  const saldoInicial = Math.max(0, (produto?.saldo_atual || 0) - quantidadeUtilizada)

  // Criar novo produto
  return await tx.produto.create({
    data: {
      descricao,
      categoria_id: categoria.id,
      unidade_id: unidade.id,
      fornecedor_id: fornecedorId,
      marca_id: marcaId,
      saldo_atual: saldoInicial,
      saldo_minimo: 0
    }
  })
}

// GET /api/pedidos - Listar pedidos
export async function GET(request: NextRequest) {
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
    
    const searchParams = request.nextUrl.searchParams
    // Validar e limitar page e limit para prevenir problemas de performance
    const page = Math.max(1, Math.min(1000, parseInt(searchParams.get('page') || '1')))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const secretariaId = searchParams.get('secretaria_id')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      ativo: true
    }

    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { secretaria: { nome: { contains: search } } },
        { setor: { nome: { contains: search } } }
      ]
    }

    if (secretariaId) {
      where.secretaria_id = parseInt(secretariaId)
    }

    // Get pedidos with relations
    const [pedidos, total] = await Promise.all([
      db.pedido.findMany({
        where,
        skip,
        take: limit,
        include: {
          secretaria: true,
          setor: true,
          _count: {
            select: {
              itens: true
            }
          }
        },
        orderBy: { criado_em: 'desc' }
      }),
      db.pedido.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        pedidos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    return handleApiError(error, 'ao buscar pedidos')
  }
}

// POST /api/pedidos - Criar pedido(s)
export async function POST(request: NextRequest) {
  console.log('📥 POST /api/pedidos - Iniciando...')
  
  try {
    const usuario = getAuthenticatedUser(request)
    
    if (!usuario) {
      console.log('❌ Usuário não autenticado')
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
    
    console.log('✅ Usuário autenticado:', usuario)
    
    const body = await request.json()
    console.log('📦 Body recebido:', JSON.stringify(body, null, 2))

    // Sanitizar e validar todos os campos usando o utilitário
    const sanitizedBody = sanitizeObject(body, {
      secretaria_id: (val) => sanitizeNumber(val, 1),
      setor_id: (val) => sanitizeNumber(val, 1),
      observacoes: (val) => sanitizeString(val, 2000)
    })

    // Validar e sanitizar pedidos_por_fornecedor
    const pedidosPorFornecedor = body.pedidos_por_fornecedor ? sanitizeArray(body.pedidos_por_fornecedor, (p) => sanitizeObject(p, {
      fornecedor_id: (val) => sanitizeNumber(val, 1),
      itens: (val) => val // Manter itens como está, serão sanitizados depois
    })) : []
    
    console.log('📦 pedidosPorFornecedor:', JSON.stringify(pedidosPorFornecedor, null, 2))
    
    if (pedidosPorFornecedor.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campos obrigatórios: secretaria_id, setor_id, pedidos_por_fornecedor'
          }
        },
        { status: 400 }
      )
    }

    const pedidosCriados: any[] = []

    // Create one pedido per fornecedor
    for (const pedidoData of pedidosPorFornecedor) {
      const { fornecedor_id, itens } = pedidoData
      
      console.log(`📦 Processando pedido para fornecedor ${fornecedor_id}:`, JSON.stringify(pedidoData, null, 2))
      
      if (!itens || itens.length === 0) {
        console.log(`⚠️ Fornecedor ${fornecedor_id} não tem itens, pulando...`)
        continue
      }

      // Validar e sanitizar itens
      const itensSanitizados = sanitizeArray(itens, (item) => sanitizeObject(item, {
        produto_aquisicao_id: (val) => sanitizeNumber(val, 1),
        quantidade: (val) => sanitizeNumber(val, 0),
        observacao: (val) => sanitizeString(val, 500)
      }))

      // Mapear itens e criar produtos se necessário
      const itensComProdutoId = await Promise.all(
        itensSanitizados.map(async (item: any) => {
          // Buscar o ProdutoAquisicao
          const produtoAquisicao = await db.produtoAquisicao.findUnique({
            where: { id: item.produto_aquisicao_id },
            include: {
              aquisicao: {
                include: {
                  fornecedor: true
                }
              }
            }
          })

          if (!produtoAquisicao) {
            throw new Error(`Produto de aquisição ${item.produto_aquisicao_id} não encontrado`)
          }

          // Buscar ou criar Produto correspondente usando transação para evitar race conditions
          const produto = await db.$transaction(async (tx) => {
            return await criarOuBuscarProduto(
              tx,
              produtoAquisicao.descricao,
              produtoAquisicao.aquisicao.fornecedor.id
            )
          })

          return {
            produto_id: produto.id,
            quantidade: item.quantidade,
            preco_unitario: produtoAquisicao.preco_unitario,
            observacao: item.observacao
          }
        })
      )

      // Create pedido using transaction to ensure stock consistency
      const pedido = await db.$transaction(async (tx) => {
        // Generate unique pedido number within transaction to ensure atomicity
        const count = await tx.pedido.count({})
        const numero = `PED-${String(count + 1).padStart(4, '0')}`
        
        // Create pedido with items
        const novoPedido = await tx.pedido.create({
          data: {
            numero,
            secretaria_id: sanitizedBody.secretaria_id,
            setor_id: sanitizedBody.setor_id,
            observacoes: sanitizedBody.observacoes,
            itens: {
              create: itensComProdutoId
            }
          },
          include: {
            secretaria: true,
            setor: true,
            itens: {
              include: {
                produto: {
                  include: {
                    fornecedor: true,
                    unidade: true
                  }
                }
              }
            }
          }
        })

        // Create stock movements for each item (SAIDA)
        for (const item of novoPedido.itens) {
          // Get current product balance
          const produto = await tx.produto.findUnique({
            where: { id: item.produto_id }
          })

          if (!produto) {
            throw new Error(`Produto ${item.produto_id} não encontrado`)
          }

          const saldo_anterior = produto.saldo_atual
          const quantidade = item.quantidade

          // Check if there's enough stock
          if (saldo_anterior < quantidade) {
            throw new Error(
              `Saldo insuficiente para o produto ${produto.descricao}. ` +
              `Saldo atual: ${saldo_anterior}, Quantidade solicitada: ${quantidade}`
            )
          }

          const saldo_novo = saldo_anterior - quantidade

          // Create stock movement
          await tx.movimentacaoEstoque.create({
            data: {
              produto_id: item.produto_id,
              tipo: 'SAIDA',
              quantidade: quantidade,
              saldo_anterior: saldo_anterior,
              saldo_novo: saldo_novo,
              observacao: `Saída referente ao pedido ${novoPedido.numero}`,
              usuario_id: usuario.id
            }
          })

          // Update product balance
          await tx.produto.update({
            where: { id: item.produto_id },
            data: { saldo_atual: saldo_novo }
          })

          console.log(
            `[Pedido ${novoPedido.numero}] Movimentação de estoque criada: ` +
            `Produto ${produto.descricao} (${item.produto_id}), ` +
            `Saída: ${quantidade}, ` +
            `Saldo anterior: ${saldo_anterior}, ` +
            `Saldo novo: ${saldo_novo}`
          )
        }

        return novoPedido
      })

      pedidosCriados.push(pedido)
      console.log(`✅ Pedido ${pedido.numero} criado com sucesso para fornecedor ${fornecedor_id}`)
    }
    
    console.log(`📦 Total de pedidos criados: ${pedidosCriados.length}`)

    return NextResponse.json(
      {
        success: true,
        data: {
          pedidos: pedidosCriados,
          total: pedidosCriados.length
        },
        message: `${pedidosCriados.length} pedido(s) criado(s) com sucesso`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar pedido(s):', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao criar pedido(s)'
        }
      },
      { status: 500 }
    )
  }
}
