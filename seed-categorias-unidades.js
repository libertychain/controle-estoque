const { PrismaClient } = require('@prisma/client');

async function seedCategoriasUnidades() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db/custom.db'
      }
    }
  });
  
  try {
    console.log('Criando categorias e unidades...');
    
    // Criar categorias
    const categorias = await db.categoria.createMany({
      data: [
        { nome: 'Limpeza' },
        { nome: 'Higiene Pessoal' },
        { nome: 'Papelaria' },
        { nome: 'Material de Escritório' },
        { nome: 'Eletroeletrônicos' },
        { nome: 'Geral' }
      ]
    });
    
    console.log(`✓ ${categorias.count} categorias criadas`);
    
    // Criar unidades
    const unidades = await db.unidade.createMany({
      data: [
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
        { sigla: 'UNIDADE', descricao: 'Unidade' },
        { sigla: 'PACOTE', descricao: 'Pacote' },
        { sigla: 'PACOTES', descricao: 'Pacotes' }
      ]
    });
    
    console.log(`✓ ${unidades.count} unidades criadas`);
    console.log('\n✓ Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('✗ Erro ao criar categorias e unidades:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

seedCategoriasUnidades();
