const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    console.log('=== PRODUTOS ===');
    const produtos = await db.produto.findMany({
      include: { fornecedor: true }
    });
    produtos.forEach(p => {
      console.log(`ID: ${p.id}, Código: ${p.codigo}, Descrição: ${p.descricao.substring(0,30)}, Saldo: ${p.saldo_atual}, Mínimo: ${p.saldo_minimo}, Fornecedor: ${p.fornecedor?.nome || 'N/A'}`);
    });

    console.log('\n=== MOVIMENTAÇÕES DE ESTOQUE ===');
    const movimentacoes = await db.movimentacaoEstoque.findMany({
      include: { produto: true },
      orderBy: { data: 'desc' }
    });
    movimentacoes.forEach(m => {
      console.log(`ID: ${m.id}, Produto: ${m.produto.descricao.substring(0,20)}, Tipo: ${m.tipo}, Quantidade: ${m.quantidade}, Saldo Anterior: ${m.saldo_anterior}, Saldo Novo: ${m.saldo_novo}`);
    });

    console.log('\n=== ITENS DE PEDIDO ===');
    const itensPedido = await db.itemPedido.findMany({
      include: { pedido: true, produto: true }
    });
    itensPedido.forEach(i => {
      console.log(`ID: ${i.id}, Pedido: ${i.pedido.numero}, Produto: ${i.produto.descricao.substring(0,20)}, Quantidade: ${i.quantidade}, Disponível: ${i.disponivel}`);
    });

    console.log('\n=== PRODUTOS AQUISIÇÃO ===');
    const produtosAquisicao = await db.produtoAquisicao.findMany();
    produtosAquisicao.forEach(pa => {
      console.log(`ID: ${pa.id}, Descrição: ${pa.descricao.substring(0,30)}, Quantidade: ${pa.quantidade}, Aquisição ID: ${pa.aquisicao_id}`);
    });

  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await db.$disconnect();
  }
})();
