const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos com "álcool etílico" ou "alcool etilico"...\n');
    
    // Buscar todos os produtos ativos
    const todosProdutos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      orderBy: {
        saldo_atual: 'desc'
      }
    });
    
    // Buscar produtos que contenham "álcool etílico" (com acento)
    const produtosComAcento = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return descricaoNormalizada.includes('álcool etílico');
    });
    
    // Buscar produtos que contenham "alcool etilico" (sem acento)
    const produtosSemAcento = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return descricaoNormalizada.includes('alcool etilico');
    });
    
    // Combinar e remover duplicados
    const todosAlcool = new Set([
      ...produtosComAcento.map(p => p.codigo),
      ...produtosSemAcento.map(p => p.codigo)
    ]);
    
    const produtosFinais = todosProdutos.filter(p => todosAlcool.has(p.codigo));
    
    console.log(`📊 Total de produtos encontrados com "álcool etílico" ou "alcool etilico": ${produtosFinais.length}\n`);
    
    if (produtosFinais.length === 0) {
      console.log('❌ Nenhum produto encontrado.');
    } else {
      console.log('📋 Lista de produtos encontrados:');
      produtosFinais.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome} | Ativo: ${p.ativo}`);
      });
    }
    
    // Mostrar resumo por categoria
    console.log('\n\n📊 Resumo por categoria:');
    const porCategoria = {};
    produtosFinais.forEach(p => {
      const cat = p.categoria.nome;
      if (!porCategoria[cat]) {
        porCategoria[cat] = [];
      }
      porCategoria[cat].push(p);
    });
    
    Object.entries(porCategoria).forEach(([categoria, produtos]) => {
      console.log(`\n${categoria}: ${produtos.length} produtos`);
      produtos.forEach(p => {
        console.log(`  - ${p.codigo}: ${p.descricao.substring(0, 40)}...`);
      });
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
