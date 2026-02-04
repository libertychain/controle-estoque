const { PrismaClient } = require('@prisma/client');

async function seedUnidades() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db/custom.db'
      }
    }
  });
  
  try {
    console.log('Criando unidades...');
    
    // Verificar quais unidades já existem
    const unidadesExistentes = await db.unidade.findMany();
    const siglasExistentes = new Set(unidadesExistentes.map(u => u.sigla));
    
    // Criar apenas as unidades que não existem
    const unidadesParaCriar = [
      { sigla: 'UND', descricao: 'Unidade' },
      { sigla: 'PACOTE', descricao: 'Pacote' },
      { sigla: 'CAIXA', descricao: 'Caixa' },
      { sigla: 'KG', descricao: 'Quilograma' },
      { sigla: 'LATA', descricao: 'Lata' },
      { sigla: 'LITRO', descricao: 'Litro' },
      { sigla: 'ML', descricao: 'Mililitro' },
      { sigla: 'MILHEIRO', descricao: 'Milheiro' },
      { sigla: 'PAR', descricao: 'Par' },
      { sigla: 'ROLO', descricao: 'Rolo' },
      { sigla: 'UNIDADE', descricao: 'Unidade' }
    ].filter(u => !siglasExistentes.has(u.sigla));
    
    if (unidadesParaCriar.length > 0) {
      const unidades = await db.unidade.createMany({
        data: unidadesParaCriar
      });
      console.log(`✓ ${unidades.count} unidades criadas`);
    } else {
      console.log('✓ Todas as unidades já existem no banco de dados');
    }
    
    console.log('\n✓ Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('✗ Erro ao criar unidades:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

seedUnidades();
