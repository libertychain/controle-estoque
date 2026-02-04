const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        OR: [
          { descricao: { contains: 'rodo' } },
          { codigo: { contains: 'rodo' } }
        ]
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      take: 10
    });
    
    console.log('Produtos encontrados com "rodo":');
    produtos.forEach(p => {
      console.log(`- ${p.codigo}: ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade.sigla}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
