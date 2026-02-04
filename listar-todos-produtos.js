const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📋 Listando TODOS os produtos do banco de dados...\n');
    
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
    
    console.log(`📊 Total de produtos ativos: ${todosProdutos.length}\n`);
    
    console.log('📋 Lista completa de produtos:');
    console.log('='.repeat(100));
    
    todosProdutos.forEach((p, index) => {
      const numero = String(index + 1).padStart(3, ' ');
      const codigo = p.codigo.padEnd(10, ' ');
      const descricao = p.descricao.substring(0, 50).padEnd(50, ' ');
      const saldo = String(p.saldo_atual).padStart(8, ' ');
      const unidade = p.unidade.sigla.padEnd(6, ' ');
      const categoria = p.categoria.nome.padEnd(15, ' ');
      
      console.log(`${numero} | ${codigo} | ${descricao}... | ${saldo} ${unidade} | ${categoria}`);
    });
    
    console.log('='.repeat(100));
    
    // Buscar produtos que contenham termos relacionados a álcool/limpeza
    const termosRelacionados = ['álcool', 'alcool', 'etílico', 'etilico', 'desinfetante', 'sanitária', 'sanitario', 'água', 'cloro', 'limpeza', 'higiene'];
    
    const produtosRelacionados = todosProdutos.filter(p => {
      const descricaoNormalizada = p.descricao.toLowerCase();
      return termosRelacionados.some(termo => descricaoNormalizada.includes(termo));
    });
    
    console.log(`\n\n📊 Produtos relacionados a álcool/limpeza (${produtosRelacionados.length}):`);
    console.log('='.repeat(100));
    
    produtosRelacionados.forEach((p, index) => {
      const numero = String(index + 1).padStart(3, ' ');
      const codigo = p.codigo.padEnd(10, ' ');
      const descricao = p.descricao.substring(0, 50).padEnd(50, ' ');
      const saldo = String(p.saldo_atual).padStart(8, ' ');
      const unidade = p.unidade.sigla.padEnd(6, ' ');
      const categoria = p.categoria.nome.padEnd(15, ' ');
      
      console.log(`${numero} | ${codigo} | ${descricao}... | ${saldo} ${unidade} | ${categoria}`);
    });
    
    console.log('='.repeat(100));
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
