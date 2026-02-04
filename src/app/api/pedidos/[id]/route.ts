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

    // Use transaction to delete pedido and return items to stock
    await db.$transaction(async (tx) => {
      // Get all items from the pedido before deletion
      const itensDoPedido = await tx.itemPedido.findMany({
        where: { pedido_id: pedidoId },
        include: {
          produto: true
        }
      })

      // Create stock movements to return items (ENTRADA)
      for (const item of itensDoPedido) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produto_id }
        })

        if (!produto) {
          throw new Error(`Produto ${item.produto_id} não encontrado`)
        }

        const saldo_anterior = produto.saldo_atual
        const quantidade = item.quantidade
        const saldo_novo = saldo_anterior + quantidade

        // Create stock movement (ENTRADA - return to stock)
        await tx.movimentacaoEstoque.create({
          data: {
            produto_id: item.produto_id,
            tipo: 'ENTRADA',
            quantidade: quantidade,
            saldo_anterior: saldo_anterior,
            saldo_novo: saldo_novo,
            observacao: `Devolução ao estoque devido à exclusão do pedido ${pedido.numero}`,
            usuario_id: 1 // TODO: Get from authenticated user
          }
        })

        // Update product balance
        await tx.produto.update({
          where: { id: item.produto_id },
          data: { saldo_atual: saldo_novo }
        })

        console.log(
          `[Pedido ${pedido.numero}] Movimentação de estoque criada: ` +
          `Produto ${produto.descricao} (${item.produto_id}), ` +
          `Entrada: ${quantidade}, ` +
          `Saldo anterior: ${saldo_anterior}, ` +
          `Saldo novo: ${saldo_novo}`
        )
      }

      // Soft delete the pedido
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { ativo: false }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido excluído com sucesso e itens devolvidos ao estoque'
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

    // Se itens foram fornecidos, atualizar os itens e o estoque
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

      // Use transaction to update items and stock
      await db.$transaction(async (tx) => {
        // Deletar todos os itens atuais do pedido
        await tx.itemPedido.deleteMany({
          where: { pedido_id: pedidoId }
        })

        // Criar todos os itens novamente
        await tx.itemPedido.createMany({
          data: itensParaProcessar.map(item => ({
            pedido_id: pedidoId,
            ...item
          }))
        })

        // Calculate stock differences and create movements
        // Map old items by produto_id
        const itensAntigosMap = new Map<number, number>()
        for (const item of itensAtuais) {
          itensAntigosMap.set(item.produto_id, item.quantidade)
        }

        // Map new items by produto_id
        const itensNovosMap = new Map<number, number>()
        for (const item of itensParaProcessar) {
          itensNovosMap.set(item.produto_id, item.quantidade)
        }

        // Get all unique produto_ids
        const allProdutoIds = new Set([
          ...itensAntigosMap.keys(),
          ...itensNovosMap.keys()
        ])

        // Process each product
        for (const produtoId of allProdutoIds) {
          const quantidadeAntiga = itensAntigosMap.get(produtoId) || 0
          const quantidadeNova = itensNovosMap.get(produtoId) || 0
          const diferenca = quantidadeNova - quantidadeAntiga

          // Skip if no change
          if (diferenca === 0) {
            continue
          }

          // Get current product
          const produto = await tx.produto.findUnique({
            where: { id: produtoId }
          })

          if (!produto) {
            throw new Error(`Produto ${produtoId} não encontrado`)
          }

          const saldo_anterior = produto.saldo_atual
          let saldo_novo: number
          let tipo: 'ENTRADA' | 'SAIDA'
          let observacao: string

          if (diferenca > 0) {
            // Quantity increased - create SAIDA
            tipo = 'SAIDA'
            if (saldo_anterior < diferenca) {
              throw new Error(
                `Saldo insuficiente para o produto ${produto.descricao}. ` +
                `Saldo atual: ${saldo_anterior}, Quantidade adicional: ${diferenca}`
              )
            }
            saldo_novo = saldo_anterior - diferenca
            observacao = `Aumento de quantidade no pedido ${pedido.numero}. Antes: ${quantidadeAntiga}, Depois: ${quantidadeNova}`
          } else {
            // Quantity decreased - create ENTRADA (return to stock)
            tipo = 'ENTRADA'
            const quantidadeDevolucao = Math.abs(diferenca)
            saldo_novo = saldo_anterior + quantidadeDevolucao
            observacao = `Diminuição de quantidade no pedido ${pedido.numero}. Devolução ao estoque. Antes: ${quantidadeAntiga}, Depois: ${quantidadeNova}`
          }

          // Create stock movement
          await tx.movimentacaoEstoque.create({
            data: {
              produto_id: produtoId,
              tipo,
              quantidade: Math.abs(diferenca),
              saldo_anterior,
              saldo_novo,
              observacao,
              usuario_id: 1 // TODO: Get from authenticated user
            }
          })

          // Update product balance
          await tx.produto.update({
            where: { id: produtoId },
            data: { saldo_atual: saldo_novo }
          })

          console.log(
            `[Pedido ${pedido.numero}] Movimentação de estoque criada: ` +
            `Produto ${produto.descricao} (${produtoId}), ` +
            `Tipo: ${tipo}, ` +
            `Quantidade: ${Math.abs(diferenca)}, ` +
            `Saldo anterior: ${saldo_anterior}, ` +
            `Saldo novo: ${saldo_novo}`
          )
        }
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
