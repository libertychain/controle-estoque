const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const db = new PrismaClient();
  
  try {
    console.log('Testando conexão com o banco de dados...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const fornecedores = await db.fornecedor.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });
    
    console.log('✓ Conexão bem-sucedida!');
    console.log(`✓ Encontrados ${fornecedores.length} fornecedores ativos`);
    
    if (fornecedores.length > 0) {
      console.log('Primeiro fornecedor:', fornecedores[0]);
    }
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
    console.error('Detalhes completos:', error);
  } finally {
    await db.$disconnect();
  }
}

testConnection();
