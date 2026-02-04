const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔄 Migrando produtos da aquisição 1/2026 para a tabela Produto...\n');
    
    // Buscar a aquisição 1/2026
    const aquisicao = await prisma.aquisicao.findFirst({
      where: {
        numero_proc: '1/2026'
      },
      include: {
        fornecedor: true,
        produtos: true
      }
    });
    
    if (!aquisicao) {
      console.log('❌ Aquisição 1/2026 não encontrada\n');
      return;
    }
    
    console.log(`✅ Aquisição encontrada: ${aquisicao.numero_proc} - ${aquisicao.fornecedor.nome}`);
    console.log(`📊 Total de produtos na aquisição: ${aquisicao.produtos.length}\n`);
    
    // Buscar ou criar categoria "Geral"
    let categoria = await prisma.categoria.findUnique({
      where: { nome: 'Geral' }
    });
    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: { nome: 'Geral' }
      });
      console.log(`✅ Categoria "Geral" criada\n`);
    } else {
      console.log(`✅ Categoria "Geral" encontrada\n`);
    }
    
    // Migrar produtos
    let migrados = 0;
    let jaExistiam = 0;
    
    for (let i = 0; i < aquisicao.produtos.length; i++) {
      const produtoAquisicao = aquisicao.produtos[i];
      
      // Buscar ou criar unidade
      let unidade = await prisma.unidade.findUnique({
        where: { sigla: produtoAquisicao.unidade.toUpperCase() }
      });
      if (!unidade) {
        unidade = await prisma.unidade.create({
          data: { 
            sigla: produtoAquisicao.unidade.toUpperCase(),
            descricao: produtoAquisicao.unidade
          }
        });
        console.log(`✅ Unidade "${produtoAquisicao.unidade}" criada`);
      }
      
      // Buscar ou criar marca
      let marca = null;
      if (produtoAquisicao.marca) {
        marca = await prisma.marca.findUnique({
          where: { nome: produtoAquisicao.marca.toUpperCase() }
        });
        if (!marca) {
          marca = await prisma.marca.create({
            data: { nome: produtoAquisicao.marca.toUpperCase() }
          });
          console.log(`✅ Marca "${produtoAquisicao.marca}" criada`);
        }
      }
      
      // Verificar se o produto já existe no catálogo
      const produtoExistente = await prisma.produto.findFirst({
        where: {
          descricao: produtoAquisicao.descricao,
          categoria_id: categoria.id,
          unidade_id: unidade.id
        }
      });
      
        if (produtoExistente) {
          console.log(`⏭️  Produto já existe: ${produtoExistente.codigo} - ${produtoExistente.descricao}`);
          jaExistiam++;
        } else {
          // Criar código único para o produto
          const codigo = `PAQ-${aquisicao.numero_proc}-${String(i + 1).padStart(2, '0')}`;
          
          // Criar produto no catálogo com saldo inicial igual à quantidade da aquisição
          await prisma.produto.create({
            data: {
              codigo,
              descricao: produtoAquisicao.descricao,
              categoria_id: categoria.id,
              unidade_id: unidade.id,
              marca_id: marca?.id,
              fornecedor_id: aquisicao.fornecedor.id,
              saldo_atual: produtoAquisicao.quantidade, // Usar quantidade da aquisição como saldo inicial
              saldo_minimo: 0,
              ativo: true
            }
          });
          
          console.log(`✅ Produto criado: ${codigo} - ${produtoAquisicao.descricao} (Saldo inicial: ${produtoAquisicao.quantidade})`);
          migrados++;
        }
    }
    
    console.log(`\n📊 Resumo da migração:`);
    console.log(`   Produtos migrados: ${migrados}`);
    console.log(`   Produtos que já existiam: ${jaExistiam}`);
    console.log(`   Total processado: ${aquisicao.produtos.length}\n`);
    
    // Verificar produtos com "álcool"
    console.log('🔍 Verificando produtos com "álcool" no catálogo...\n');
    
    const todosProdutos = await prisma.produto.findMany({
      where: {
        ativo: true
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } },
        marca: { select: { nome: true } }
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
    
    console.log(`📊 Total de produtos com "álcool" no catálogo: ${produtosAlcool.length}\n`);
    
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
    console.error('Erro ao migrar produtos:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
