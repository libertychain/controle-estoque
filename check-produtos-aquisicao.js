const { PrismaClient } = require('@prisma/client');

async function checkProdutosAquisicao() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db/custom.db'
      }
    }
  });
  
  try {
    console.log('Verificando produtos de aquisições no banco de dados...');
    
    const produtosAquisicao = await db.produtoAquisicao.findMany({
      include: {
        aquisicao: {
          include: {
            fornecedor: true
          }
        }
      },
      orderBy: { criado_em: 'desc' }
    });
    
    console.log('✓ Conexão bem-sucedida!');
    console.log(`✓ Total de ${produtosAquisicao.length} produtos de aquisições`);
    
    if (produtosAquisicao.length > 0) {
      console.log('\nProdutos de aquisições encontrados:');
      produtosAquisicao.forEach((pa, i) => {
        console.log(`${i + 1}. ${pa.descricao} - ${pa.unidade} - R$ ${pa.preco_unitario} - Fornecedor: ${pa.aquisicao.fornecedor.nome}`);
      });
    } else {
      console.log('\n✗ Nenhum produto de aquisição encontrado neste banco de dados');
    }
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

checkProdutosAquisicao();
