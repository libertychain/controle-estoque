const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      orderBy: {
        saldo_atual: 'desc'
      },
      take: 50
    });
    
    console.log('📋 Top 50 produtos por saldo atual:');
    produtos.forEach((p, index) => {
      if (p.descricao.toLowerCase().includes('rodo')) {
        console.log(`🔍 [${index + 1}] ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade.sigla} <- RODO ENCONTRADO!`);
      } else if (index < 10) {
        console.log(`  [${index + 1}] ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade.sigla}`);
      }
    });
    
    // Verificar especificamente o produto PAQ-39
    const produtoRodo = await prisma.produto.findUnique({
      where: { codigo: 'PAQ-39' },
      include: {
        unidade: { select: { sigla: true } }
      }
    });
    
    if (produtoRodo) {
      console.log(`\n✅ Produto PAQ-39 encontrado:`);
      console.log(`   Descrição: ${produtoRodo.descricao}`);
      console.log(`   Saldo: ${produtoRodo.saldo_atual} ${produtoRodo.unidade.sigla}`);
      
      // Verificar posição no ranking
      const todosProdutos = await prisma.produto.findMany({
        where: { ativo: true },
        orderBy: { saldo_atual: 'desc' },
        select: { codigo: true, saldo_atual: true }
      });
      
      const posicao = todosProdutos.findIndex(p => p.codigo === 'PAQ-39') + 1;
      console.log(`   Posição no ranking: ${posicao}º de ${todosProdutos.length} produtos`);
      
      if (posicao > 50) {
        console.log(`   ⚠️  O produto está fora dos top 50, não será incluído no contexto!`);
      }
    } else {
      console.log(`\n❌ Produto PAQ-39 não encontrado no banco de dados.`);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
