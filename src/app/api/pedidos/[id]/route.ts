import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/pedidos/[id] - Buscar pedido individual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pedidoId = parseInt(id)

    if (isNaN(pedidoId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do pedido inválido'
          }
        },
        { status: 400 }
      )
    }

    const pedido = await db.pedido.findUnique({
      where: {
        id: pedidoId,
        ativo: true
      },
      include: {
        secretaria: true,
        setor: {
          include: {
            secretaria: true
          }
        },
        itens: {
          include: {
            produto: {
              include: {
                categoria: true,
                unidade: true,
                marca: true,
                fornecedor: true
              }
            }
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

    return NextResponse.json({
      success: true,
      data: {
        pedido
      }
    })
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar pedido'
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/pedidos/[id] - Excluir pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pedidoId = parseInt(id)

    if (isNaN(pedidoId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do pedido inválido'
          }
        },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe
    const pedido = await db.pedido.findUnique({
      where: { id: pedidoId }
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

    // Verificar se o pedido pode ser excluído (não pode estar finalizado)
    // REMOVIDO: Permitir exclusão de pedidos finalizados
    // if (pedido.status === 'FINALIZADO') {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         code: 'VALIDATION_ERROR',
    //         message: 'Não é possível excluir um pedido finalizado'
    //       }
    //     },
    //     { status: 400 }
    //   )
    // }

    // Soft delete
    await db.pedido.update({
      where: { id: pedidoId },
      data: { ativo: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir pedido:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao excluir pedido'
        }
      },
      { status: 500 }
    )
  }
}

// PUT /api/pedidos/[id] - Atualizar pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pedidoId = parseInt(id)

    if (isNaN(pedidoId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do pedido inválido'
          }
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { observacoes, itens, secretaria_id, setor_id, data_pedido } = body
    
    // Verificar se o pedido existe
    const pedido = await db.pedido.findUnique({
      where: { id: pedidoId }
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

    // Verificar se o pedido pode ser editado
    // REMOVIDO: Permitir edição de pedidos finalizados
    // if (pedido.status === 'FINALIZADO') {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         code: 'VALIDATION_ERROR',
    //         message: 'Não é possível editar um pedido finalizado'
    //       }
    //     },
    //     { status: 400 }
    //   )
    // }

    // Atualizar pedido
    const pedidoAtualizado = await db.pedido.update({
      where: { id: pedidoId },
      data: {
        observacoes: observacoes !== undefined ? observacoes : pedido.observacoes,
        secretaria_id: secretaria_id !== undefined ? parseInt(secretaria_id) : pedido.secretaria_id,
        setor_id: setor_id !== undefined ? parseInt(setor_id) : pedido.setor_id,
        data_pedido: data_pedido !== undefined ? new Date(`${data_pedido}T12:00:00.000Z`) : pedido.data_pedido
      },
      include: {
        secretaria: true,
        setor: true,
        itens: {
          include: {
            produto: {
              include: {
                categoria: true,
                unidade: true,
                marca: true,
                fornecedor: true
              }
            }
          }
        }
      }
    })

    // Se itens foram fornecidos, atualizar os itens
    if (itens && Array.isArray(itens)) {
      // Buscar todos os itens atuais do pedido
      const itensAtuais = await db.itemPedido.findMany({
        where: { pedido_id: pedidoId }
      })

      // Mapear itens fornecidos para obter os produto_ids
      const itensParaProcessar = await Promise.all(
        itens.map(async (item: any) => {
          let produtoId: number
          let precoUnitario: number

          if (item.produto_aquisicao_id) {
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
                  saldo_atual: produtoAquisicao.quantidade,
                  saldo_minimo: 0
                }
              })
            }

            produtoId = produto.id
            precoUnitario = produtoAquisicao.preco_unitario
          } else {
            // Usar produto_id fornecido diretamente
            produtoId = parseInt(item.produto_id)
            if (isNaN(produtoId)) {
              throw new Error(`produto_id inválido: ${item.produto_id}`)
            }

            // Buscar o preço unitário do item existente para preservar
            const itemExistente = itensAtuais.find(i => i.produto_id === produtoId)
            precoUnitario = itemExistente?.preco_unitario || 0
          }

          return {
            produto_id: produtoId,
            quantidade: parseFloat(item.quantidade.toString().replace(',', '.')),
            preco_unitario: precoUnitario,
            observacao: item.observacao || null
          }
        })
      )

      // Deletar todos os itens atuais do pedido
      await db.itemPedido.deleteMany({
        where: { pedido_id: pedidoId }
      })

      // Criar todos os itens novamente
      await db.itemPedido.createMany({
        data: itensParaProcessar.map(item => ({
          pedido_id: pedidoId,
          ...item
        }))
      })

      // Buscar pedido atualizado com itens
      pedidoAtualizado.itens = await db.itemPedido.findMany({
        where: { pedido_id: pedidoId },
        include: {
          produto: {
            include: {
              categoria: true,
              unidade: true,
              marca: true,
              fornecedor: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        pedido: pedidoAtualizado
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao atualizar pedido'
        }
      },
      { status: 500 }
    )
  }
}
