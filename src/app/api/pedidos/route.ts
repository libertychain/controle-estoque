import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/pedidos - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar pedidos'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/pedidos - Criar pedido(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      secretaria_id,
      setor_id,
      observacoes,
      pedidos_por_fornecedor
    } = body

    // Validate required fields
    if (!secretaria_id || !setor_id || !pedidos_por_fornecedor || pedidos_por_fornecedor.length === 0) {
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
    for (const pedidoData of pedidos_por_fornecedor) {
      const { fornecedor_id, itens } = pedidoData

      if (!itens || itens.length === 0) {
        continue
      }

      // Generate unique pedido number
      const count = await db.pedido.count({})
      const numero = `PED-${String(count + 1).padStart(4, '0')}`

      // Mapear itens e criar produtos se necessário
      const itensComProdutoId = await Promise.all(
        itens.map(async (item: any) => {
          // Buscar o ProdutoAquisicao
          const produtoAquisicao = await db.produtoAquisicao.findUnique({
            where: { id: parseInt(item.produto_aquisicao_id) },
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

          // Buscar ou criar Produto correspondente
          let produto = await db.produto.findFirst({
            where: {
              descricao: produtoAquisicao.descricao,
              fornecedor_id: produtoAquisicao.aquisicao.fornecedor.id
            }
          })

          if (!produto) {
            // Buscar categoria e unidade padrão usando upsert para evitar race conditions
            const categoria = await db.categoria.upsert({
              where: { nome: 'Geral' },
              update: {},
              create: { nome: 'Geral' }
            })

            const unidade = await db.unidade.upsert({
              where: { sigla: produtoAquisicao.unidade },
              update: {},
              create: { sigla: produtoAquisicao.unidade, descricao: produtoAquisicao.unidade }
            })

            // Criar novo Produto
            let marcaId: number | null = null
            if (produtoAquisicao.marca) {
              const marca = await db.marca.upsert({
                where: { nome: produtoAquisicao.marca },
                update: {},
                create: { nome: produtoAquisicao.marca }
              })
              marcaId = marca.id
            }

            produto = await db.produto.create({
              data: {
                codigo: `PAQ-${produtoAquisicao.id}`,
                descricao: produtoAquisicao.descricao,
                categoria_id: categoria.id,
                unidade_id: unidade.id,
                fornecedor_id: produtoAquisicao.aquisicao.fornecedor.id,
                marca_id: marcaId,
                saldo_atual: produtoAquisicao.quantidade, // Usar quantidade da aquisição
                saldo_minimo: 0
              }
            })
          }

          return {
            produto_id: produto.id,
            quantidade: parseFloat(item.quantidade.toString().replace(',', '.')),
            preco_unitario: produtoAquisicao.preco_unitario,
            observacao: item.observacao || null
          }
        })
      )

      // Create pedido
      const pedido = await db.pedido.create({
        data: {
          numero,
          secretaria_id: parseInt(secretaria_id),
          setor_id: parseInt(setor_id),
          observacoes: observacoes || null,
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

      pedidosCriados.push(pedido)
    }

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
