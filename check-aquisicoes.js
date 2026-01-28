const { PrismaClient } = require('@prisma/client');

async function checkAquisicoes() {
  const db = new PrismaClient();
  
  try {
    console.log('Verificando aquisições no banco de dados...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const aquisicoes = await db.aquisicao.findMany({
      where: { ativo: true },
      include: {
        fornecedor: true,
        _count: {
          select: {
            produtos: true,
            aditivos: true
          }
        }
      },
      orderBy: { criado_em: 'desc' }
    });
    
    console.log('✓ Conexão bem-sucedida!');
    console.log(`✓ Encontradas ${aquisicoes.length} aquisições ativas`);
    
    if (aquisicoes.length > 0) {
      console.log('Primeira aquisição:', JSON.stringify(aquisicoes[0], null, 2));
    }
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
    console.error('Detalhes completos:', error);
  } finally {
    await db.$disconnect();
  }
}

checkAquisicoes();
