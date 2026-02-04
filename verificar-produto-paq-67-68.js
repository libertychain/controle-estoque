const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos PAQ-67 e PAQ-68 na tabela Produto...\n');
    
    // Buscar produtos pelos códigos
    const codigosBusca = ['PAQ-2', 'PAQ-67', 'PAQ-68'];
    
    for (const codigo of codigosBusca) {
      const produto = await prisma.produto.findUnique({
        where: { codigo },
        include: {
          categoria: { select: { nome: true } },
          unidade: { select: { sigla: true } },
          marca: { select: { nome: true } }
        }
      });
      
      if (produto) {
        console.log(`✅ ${codigo}: ${produto.descricao}`);
        console.log(`   Saldo: ${produto.saldo_atual} ${produto.unidade.sigla} | Categoria: ${produto.categoria.nome}`);
        console.log(`   Marca: ${produto.marca?.nome || 'N/A'} | Ativo: ${produto.ativo ? 'Sim' : 'Não'}\n`);
      } else {
        console.log(`❌ ${codigo}: Produto não encontrado na tabela Produto\n`);
      }
    }
    
    // Buscar todos os produtos com "álcool" na descrição
    console.log('🔍 Buscando todos os produtos com "álcool" na descrição...\n');
    
    const todosProdutos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } },
        marca: { select: { nome: true } }
      },
      orderBy: {
        saldo_atual: 'desc'
      }
    });
    
    // Função para remover acentos
    function removerAcentos(texto) {
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    const produtosAlcool = todosProdutos.filter(p => {
      const descricaoNormalizada = removerAcentos(p.descricao.toLowerCase());
      return descricaoNormalizada.includes('alcool');
    });
    
    console.log(`📊 Total de produtos com "álcool" na descrição: ${produtosAlcool.length}\n`);
    
    if (produtosAlcool.length > 0) {
      console.log('📋 Lista de produtos:\n');
      produtosAlcool.forEach((p, index) => {
        console.log(`${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}`);
        console.log(`   Marca: ${p.marca?.nome || 'N/A'}\n`);
      });
    } else {
      console.log('❌ Nenhum produto com "álcool" encontrado\n');
    }
    
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
