const { PrismaClient } = require('@prisma/client');

async function checkProdutos() {
  const prisma = new PrismaClient();
  
  try {
    const produtos = await prisma.produtoAquisicao.findMany({
      where: {
        descricao: {
          contains: 'abac'
        }
      },
      include: {
        aquisicao: {
          include: {
            fornecedor: true
          }
        }
      }
    });

    console.log('Encontrados:', produtos.length, 'produtos com "abac" no nome');
    
    produtos.forEach((p, index) => {
      console.log(`Produto ${index + 1}:`, {
        descricao: p.descricao,
        preco_unitario: p.preco_unitario,
        fornecedor: p.aquisicao?.fornecedor?.nome || 'N/A'
      });
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error);
    await prisma.$disconnect();
  }
}

checkProdutos();
