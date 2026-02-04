const { PrismaClient } = require('@prisma/client');

async function checkUnidades() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db/custom.db'
      }
    }
  });
  
  try {
    console.log('Verificando unidades e categorias no banco de dados...');
    
    const unidades = await db.unidade.findMany();
    console.log(`✓ ${unidades.length} unidades encontradas`);
    unidades.forEach((u, i) => {
      console.log(`${i + 1}. ${u.sigla} - ${u.descricao}`);
    });

    const categorias = await db.categoria.findMany();
    console.log(`✓ ${categorias.length} categorias encontradas`);
    categorias.forEach((c, i) => {
      console.log(`${i + 1}. ${c.nome}`);
    });
    
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

checkUnidades();
