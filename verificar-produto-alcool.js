const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos com "álcool" no banco de dados...\n');
    
    // Buscar produtos que contenham "álcool" (com acento)
    const produtosComAcento = await prisma.produto.findMany({
      where: {
        descricao: { contains: 'álcool' }
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      take: 10
    });
    
    console.log(`Produtos com "álcool" (com acento): ${produtosComAcento.length}`);
    produtosComAcento.forEach(p => {
      console.log(`  - ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade.sigla}`);
    });
    
    // Buscar produtos que contenham "alcool" (sem acento)
    const produtosSemAcento = await prisma.produto.findMany({
      where: {
        descricao: { contains: 'alcool' }
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      take: 10
    });
    
    console.log(`\nProdutos com "alcool" (sem acento): ${produtosSemAcento.length}`);
    produtosSemAcento.forEach(p => {
      console.log(`  - ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade.sigla}`);
    });
    
    // Buscar todos os produtos para ver se há algum com álcool
    const todosProdutos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      select: {
        codigo: true,
        descricao: true,
        saldo_atual: true
      },
      orderBy: {
        saldo_atual: 'desc'
      },
      take: 20
    });
    
    console.log('\n📋 Top 20 produtos por saldo:');
    todosProdutos.forEach(p => {
      const temAlcool = p.descricao.toLowerCase().includes('alcool') || p.descricao.includes('álcool');
      const prefixo = temAlcool ? '🔥' : '  ';
      console.log(`${prefixo} ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual}`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
