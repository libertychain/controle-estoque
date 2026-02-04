const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos com "álcool etílico" ou termos relacionados...\n');
    
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
    
    // Termos relacionados a "álcool etílico"
    const termosAlcool = ['álcool etílico', 'alcool etilico', 'etílico', 'etilico', 'etílico hidratado'];
    
    // Filtrar produtos que contenham termos relacionados a álcool etílico
    const produtosComAlcoolEtilico = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return termosAlcool.some(termo => descricaoNormalizada.includes(termo));
    });
    
    console.log(`📊 Total de produtos encontrados com "álcool etílico" ou termos relacionados: ${produtosComAlcoolEtilico.length}\n`);
    
    if (produtosComAlcoolEtilico.length === 0) {
      console.log('❌ Nenhum produto com "álcool etílico" encontrado.');
    } else {
      console.log('📋 Lista de produtos com "álcool etílico" ou termos relacionados:');
      produtosComAlcoolEtilico.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}`);
      });
    }
    
    // Mostrar todos os produtos para verificação
    console.log('\n\n📋 Todos os produtos ativos (para verificação):');
    todosProdutos.forEach((p, index) => {
      const temAlcoolEtilico = termosAlcool.some(termo => p.descricao.toLowerCase().includes(termo));
      const prefixo = temAlcoolEtilico ? '🔥' : '  ';
      console.log(`${prefixo} ${index + 1}. ${p.codigo}: ${p.descricao.substring(0, 70)}...`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
