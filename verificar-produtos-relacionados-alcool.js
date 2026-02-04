const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos relacionados a álcool...\n');
    
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
    
    // Termos relacionados a álcool
    const termosRelacionados = ['álcool', 'alcool', 'etílico', 'etilico', '70', '70º', '70%', 'gel', 'antisséptico', 'antisseptico', 'desinfetante', 'higiênico'];
    
    // Filtrar produtos que contenham termos relacionados
    const produtosRelacionados = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return termosRelacionados.some(termo => descricaoNormalizada.includes(termo));
    });
    
    console.log(`📊 Total de produtos encontrados relacionados a álcool: ${produtosRelacionados.length}\n`);
    
    if (produtosRelacionados.length === 0) {
      console.log('❌ Nenhum produto relacionado a álcool encontrado.');
    } else {
      console.log('📋 Lista de produtos relacionados a álcool:');
      produtosRelacionados.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}`);
      });
    }
    
    // Mostrar todos os produtos para ver se há algum que não foi encontrado
    console.log('\n\n📋 Todos os produtos ativos (para verificação):');
    todosProdutos.forEach((p, index) => {
      console.log(`${index + 1}. ${p.codigo}: ${p.descricao.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
