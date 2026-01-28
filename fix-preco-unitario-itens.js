const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPrecoUnitario() {
  try {
    console.log('Buscando itens de pedido sem preço unitário...')

    // Buscar todos os itens de pedido
    const itens = await prisma.itemPedido.findMany({
      where: {
        preco_unitario: 0
      },
      include: {
        produto: {
          include: {
            fornecedor: true
          }
        },
        pedido: true
      }
    })

    console.log(`Encontrados ${itens.length} itens para atualizar`)

    let atualizados = 0
    let naoEncontrados = 0

    for (const item of itens) {
      // Buscar ProdutoAquisicao correspondente
      // A lógica é: buscar um ProdutoAquisicao com a mesma descrição e fornecedor
      const produtoAquisicao = await prisma.produtoAquisicao.findFirst({
        where: {
          descricao: item.produto.descricao,
          aquisicao: {
            fornecedor_id: item.produto.fornecedor_id
          }
        },
        include: {
          aquisicao: true
        }
      })

      if (produtoAquisicao) {
        // Atualizar o preco_unitario do item
        await prisma.itemPedido.update({
          where: { id: item.id },
          data: { preco_unitario: produtoAquisicao.preco_unitario }
        })

        console.log(`✓ Item ${item.id} atualizado: R$ ${produtoAquisicao.preco_unitario.toFixed(2)}`)
        atualizados++
      } else {
        console.log(`✗ Item ${item.id} não encontrado: ${item.produto.descricao} (Fornecedor: ${item.produto.fornecedor?.nome || 'N/A'})`)
        naoEncontrados++
      }
    }

    console.log(`\n=== Resumo ===`)
    console.log(`Itens atualizados: ${atualizados}`)
    console.log(`Itens não encontrados: ${naoEncontrados}`)
    console.log(`Total processado: ${itens.length}`)

  } catch (error) {
    console.error('Erro ao atualizar itens:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPrecoUnitario()
