const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    console.log('=== RECALCULANDO SALDOS DOS PRODUTOS ===\n');

    // Buscar todos os produtos
    const produtos = await db.produto.findMany({
      include: { fornecedor: true }
    });

    console.log(`Encontrados ${produtos.length} produtos\n`);

    for (const produto of produtos) {
      // Buscar ProdutoAquisicao correspondente
      const produtoAquisicao = await db.produtoAquisicao.findFirst({
        where: {
          descricao: produto.descricao,
          aquisicao: {
            fornecedor_id: produto.fornecedor_id
          }
        },
        include: {
          aquisicao: true
        }
      });

      if (produtoAquisicao) {
        // Buscar movimentações deste produto
        const movimentacoes = await db.movimentacaoEstoque.findMany({
          where: { produto_id: produto.id },
          orderBy: { data: 'asc' }
        });

        // Calcular saldo correto: quantidade da aquisição - total de saídas
        const totalSaidas = movimentacoes
          .filter(m => m.tipo === 'SAIDA')
          .reduce((sum, m) => sum + m.quantidade, 0);

        const saldoCorreto = produtoAquisicao.quantidade - totalSaidas;

        console.log(`Produto ID ${produto.id} (${produto.descricao.substring(0,30)}...)`);
        console.log(`  Quantidade da aquisição: ${produtoAquisicao.quantidade}`);
        console.log(`  Total de saídas: ${totalSaidas}`);
        console.log(`  Saldo correto: ${saldoCorreto}`);
        console.log(`  Saldo atual: ${produto.saldo_atual}`);

        // Atualizar saldo do produto
        await db.produto.update({
          where: { id: produto.id },
          data: { saldo_atual: saldoCorreto }
        });

        console.log(`  ✓ Saldo atualizado para ${saldoCorreto}\n`);
      }
    }

    console.log('=== CONCLUÍDO ===');
  } catch (e) {
    console.error('Erro:', e.message);
    console.error(e.stack);
  } finally {
    await db.$disconnect();
  }
})();
