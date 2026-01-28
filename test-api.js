const { PrismaClient } = require('@prisma/client');

async function testAPI() {
  const db = new PrismaClient();
  
  try {
    console.log('Testando como a API de fornecedores...');
    
    const searchParams = { get: () => '' };
    const search = '';
    
    const where = { ativo: true };
    
    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nome: { contains: search } },
        { cnpj: { contains: search } }
      ];
    }
    
    const fornecedores = await db.fornecedor.findMany({
      where,
      orderBy: { nome: 'asc' }
    });
    
    console.log('✓ Conexão bem-sucedida!');
    console.log(`✓ Encontrados ${fornecedores.length} fornecedores ativos`);
    
    const response = {
      success: true,
      data: {
        fornecedores,
        total: fornecedores.length
      }
    };
    
    console.log('Resposta da API:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
    console.error('Detalhes completos:', error);
  } finally {
    await db.$disconnect();
  }
}

testAPI();
