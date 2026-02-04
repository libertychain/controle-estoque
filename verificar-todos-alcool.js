const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando todos os produtos com "álcool" no banco de dados...\n');
    
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
    
    // Filtrar produtos que contenham "álcool" (com ou sem acento)
    const produtosComAlcool = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return descricaoNormalizada.includes('álcool') || descricaoNormalizada.includes('alcool');
    });
    
    console.log(`📊 Total de produtos encontrados com "álcool": ${produtosComAlcool.length}\n`);
    
    if (produtosComAlcool.length === 0) {
      console.log('❌ Nenhum produto com "álcool" encontrado.');
    } else {
      console.log('📋 Lista de produtos com "álcool":');
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
