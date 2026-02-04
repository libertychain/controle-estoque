const { PrismaClient } = require('@prisma/client');

async function checkPrismaDB() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./prisma/db/custom.db'
      }
    }
  });
  
  try {
    console.log('Verificando aquisições no banco de dados prisma/db/custom.db...');
    
    const aquisicoes = await db.aquisicao.findMany({
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
    console.log(`✓ Total de ${aquisicoes.length} aquisições`);
    
    if (aquisicoes.length > 0) {
      console.log('\nAquisições encontradas:');
      aquisicoes.forEach((a, i) => {
        console.log(`${i + 1}. ${a.numero_proc} - ${a.fornecedor.nome} (ativo: ${a.ativo})`);
      });
    } else {
      console.log('\n✗ Nenhuma aquisição encontrada neste banco de dados');
    }
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

checkPrismaDB();
