const { PrismaClient } = require('@prisma/client');

async function checkAllAquisicoes() {
  const db = new PrismaClient();
  
  try {
    console.log('Verificando TODAS as aquisições no banco de dados...');
    
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
    console.log(`✓ Total de ${aquisicoes.length} aquisições (ativas e inativas)`);
    
    if (aquisicoes.length > 0) {
      console.log('\nTodas as aquisições:');
      aquisicoes.forEach((a, i) => {
        console.log(`${i + 1}. ${a.numero_proc} - ${a.fornecedor.nome} (ativo: ${a.ativo})`);
      });
    } else {
      console.log('\n✗ Nenhuma aquisição encontrada no banco de dados');
      console.log('As aquisições podem ter sido perdidas ou estão em outro banco de dados');
    }
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

checkAllAquisicoes();
