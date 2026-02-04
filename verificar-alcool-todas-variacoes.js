const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando produtos com variações de "álcool" ou "etílico"...\n');
    
    // Buscar todos os produtos ativos
    const todosProdutos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } }
      },
      orderBy: {
        saldo_atual: 'desc'
      }
    });
    
    // Função para remover acentos
    function removerAcentos(texto) {
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    // Buscar produtos que contenham variações de "álcool" ou "etílico"
    const produtosEncontrados = todosProdutos.filter(p => {
      const descricaoNormalizada = removerAcentos(p.descricao.toLowerCase());
      const codigoNormalizado = removerAcentos(p.codigo.toLowerCase());
      const categoriaNormalizada = removerAcentos(p.categoria.nome.toLowerCase());
      
      // Verificar se contém "alcool" ou "etilico" em qualquer campo
      return descricaoNormalizada.includes('alcool') || 
             descricaoNormalizada.includes('etilico') ||
             codigoNormalizado.includes('alcool') || 
             codigoNormalizado.includes('etilico') ||
             categoriaNormalizada.includes('alcool') || 
             categoriaNormalizada.includes('etilico');
    });
    
    console.log(`📊 Total de produtos com "álcool" ou "etílico": ${produtosEncontrados.length}\n`);
    
    if (produtosEncontrados.length > 0) {
      console.log('📋 Lista de produtos encontrados:\n');
      produtosEncontrados.forEach((p, index) => {
        console.log(`${index + 1}. ${p.codigo}: ${p.descricao}`);
        console.log(`   Saldo: ${p.saldo_atual} ${p.unidade.sigla} | Categoria: ${p.categoria.nome}\n`);
      });
    } else {
      console.log('❌ Nenhum produto encontrado com "álcool" ou "etílico".\n');
    }
    
    // Agora buscar especificamente pelos códigos PAQ-2, PAQ-67, PAQ-68
    console.log('🔍 Buscando produtos pelos códigos PAQ-2, PAQ-67, PAQ-68...\n');
    
    const codigosBusca = ['PAQ-2', 'PAQ-67', 'PAQ-68'];
    
    for (const codigo of codigosBusca) {
      const produto = await prisma.produto.findUnique({
        where: { codigo },
        include: {
          categoria: { select: { nome: true } },
          unidade: { select: { sigla: true } }
        }
      });
      
      if (produto) {
        console.log(`✅ ${codigo}: ${produto.descricao}`);
        console.log(`   Saldo: ${produto.saldo_atual} ${produto.unidade.sigla} | Categoria: ${produto.categoria.nome}`);
        console.log(`   Ativo: ${produto.ativo ? 'Sim' : 'Não'}\n`);
      } else {
        console.log(`❌ ${codigo}: Produto não encontrado\n`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
