const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando aquisição 1/2026 - Limpeza Total Distribuidora...\n');
    
    // Buscar a aquisição pelo número do processo (1/2026)
    const aquisicao = await prisma.aquisicao.findFirst({
      where: {
        numero_proc: '1/2026'
      },
      include: {
        fornecedor: true,
        produtos: true
      }
    });
    
    if (!aquisicao) {
      console.log('❌ Aquisição 1/2026 não encontrada\n');
      
      // Tentar buscar todas as aquisições para ver o que existe
      const todasAquisicoes = await prisma.aquisicao.findMany({
        select: {
          id: true,
          numero_proc: true,
          fornecedor: true
        },
        orderBy: {
          criado_em: 'desc'
        },
        take: 10
      });
      
      console.log('📋 Últimas 10 aquisições encontradas:\n');
      todasAquisicoes.forEach(a => {
        console.log(`  ${a.numero_proc} - ${a.fornecedor.nome}`);
      });
      
    } else {
      console.log(`✅ Aquisição encontrada: ${aquisicao.numero_proc} - ${aquisicao.fornecedor.nome}\n`);
      console.log(`📊 Total de itens na aquisição: ${aquisicao.produtos.length}\n`);
      
      console.log('📋 Lista de produtos na aquisição:\n');
      aquisicao.produtos.forEach((item, index) => {
        console.log(`${index + 1}. ${item.descricao}`);
        console.log(`   Unidade: ${item.unidade} | Marca: ${item.marca || 'N/A'}`);
        console.log(`   Quantidade: ${item.quantidade} | Preço unitário: R$ ${item.preco_unitario.toFixed(2)}\n`);
      });
      
      // Verificar se há produtos com "álcool" na descrição
      const produtosAlcool = aquisicao.produtos.filter(p => 
        p.descricao.toLowerCase().includes('álcool') || 
        p.descricao.toLowerCase().includes('alcool')
      );
      
      console.log('🔍 Produtos com "álcool" na descrição:\n');
      if (produtosAlcool.length > 0) {
        produtosAlcool.forEach((item, index) => {
          console.log(`${index + 1}. ${item.descricao}`);
          console.log(`   Unidade: ${item.unidade} | Marca: ${item.marca || 'N/A'}\n`);
        });
      } else {
        console.log('❌ Nenhum produto com "álcool" encontrado nesta aquisição\n');
      }
    }
    
  } catch (error) {
    console.error('Erro ao buscar aquisição:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
