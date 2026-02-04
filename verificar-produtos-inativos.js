const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos inativos...\n');
    
    // Buscar todos os produtos (ativos e inativos)
    const todosProdutos = await prisma.produto.findMany({
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      orderBy: {
        saldo_atual: 'desc'
      }
    });
    
    const produtosAtivos = todosProdutos.filter(p => p.ativo === true);
    const produtosInativos = todosProdutos.filter(p => p.ativo === false);
    
    console.log(`📊 Total de produtos no banco de dados: ${todosProdutos.length}`);
    console.log(`📊 Produtos ativos: ${produtosAtivos.length}`);
    console.log(`📊 Produtos inativos: ${produtosInativos.length}\n`);
    
    if (produtosInativos.length > 0) {
      console.log('📋 Produtos inativos encontrados:');
      produtosInativos.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Ativo: ${p.ativo} | Saldo: ${p.saldo_atual} ${p.unidade.sigla}`);
      });
    } else {
      console.log('✓ Não há produtos inativos.');
    }
    
    // Verificar produtos específicos mencionados pelo usuário
    const codigosVerificar = ['PAQ-63', 'PAQ-11', 'PAQ-12'];
    
    console.log('\n\n🔍 Verificando produtos específicos mencionados pelo usuário:');
    codigosVerificar.forEach(codigo => {
      const produto = todosProdutos.find(p => p.codigo === codigo);
      if (produto) {
        console.log(`\n✓ ${codigo}: ${produto.descricao}`);
        console.log(`   Ativo: ${produto.ativo} | Saldo: ${produto.saldo_atual} ${produto.unidade.sigla} | Categoria: ${produto.categoria.nome}`);
      } else {
        console.log(`\n✗ ${codigo}: NÃO ENCONTRADO`);
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
