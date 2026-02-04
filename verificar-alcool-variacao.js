const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos com "álcool etílico" (com acento)...\n');
    
    // Buscar produtos que contenham "álcool etílico" (com acento)
    const produtosComAcento = await prisma.produto.findMany({
      where: {
        ativo: true,
        descricao: {
          contains: 'álcool etílico'
        }
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      }
    });
    
    console.log(`📊 Produtos encontrados com "álcool etílico" (com acento): ${produtosComAcento.length}\n`);
    
    if (produtosComAcento.length > 0) {
      console.log('📋 Lista de produtos:');
      produtosComAcento.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}`);
      });
    } else {
      console.log('❌ Nenhum produto encontrado com "álcool etílico" (com acento).');
    }
    
    // Buscar produtos que contenham "alcool etilico" (sem acento)
    console.log('\n🔍 Buscando produtos com "alcool etilico" (sem acento)...\n');
    
    const produtosSemAcento = await prisma.produto.findMany({
      where: {
        ativo: true,
        descricao: {
          contains: 'alcool etilico'
        }
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      }
    });
    
    console.log(`📊 Produtos encontrados com "alcool etilico" (sem acento): ${produtosSemAcento.length}\n`);
    
    if (produtosSemAcento.length > 0) {
      console.log('📋 Lista de produtos:');
      produtosSemAcento.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}`);
      });
    } else {
      console.log('❌ Nenhum produto encontrado com "alcool etilico" (sem acento).');
    }
    
    // Buscar todos os produtos com "álcool" (qualquer variação)
    console.log('\n🔍 Buscando produtos com "álcool" (qualquer variação)...\n');
    
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
    
    const produtosComAlcool = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return descricaoNormalizada.includes('álcool') || descricaoNormalizada.includes('alcool etílico') || descricaoNormalizada.includes('etílico') || descricaoNormalizada.includes('etilico');
    });
    
    console.log(`📊 Total de produtos com "álcool" (qualquer variação): ${produtosComAlcool.length}\n`);
    
    if (produtosComAlcool.length === 0) {
      console.log('❌ Nenhum produto encontrado com "álcool" (qualquer variação).');
    } else {
      console.log('📋 Lista de produtos encontrados:');
      produtosComAlcool.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
