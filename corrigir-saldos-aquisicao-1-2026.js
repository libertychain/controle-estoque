const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Corrigindo saldos dos produtos da aquisição 1/2026...\n');
    
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
    
    let produtosCorrigidos = 0;
    
    for (let i = 0; i < aquisicao.produtos.length; i++) {
      const produtoAquisicao = aquisicao.produtos[i];
      
      // Buscar o produto no catálogo
      const produto = await prisma.produto.findFirst({
        where: {
          descricao: produtoAquisicao.descricao
        }
      });
      
      if (!produto) {
        console.log(`⏭️  Produto não encontrado no catálogo: ${produtoAquisicao.descricao}`);
        continue;
      }
      
      // Buscar todas as movimentações de estoque para este produto
      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
        where: {
          produto_id: produto.id
        },
        orderBy: {
          data: 'asc'
        }
      });
      
      // Calcular saldo baseado nas movimentações
      let saldoCalculado = produtoAquisicao.quantidade; // Usar quantidade da aquisição como saldo inicial
      
      if (movimentacoes.length > 0) {
        // Calcular saldo baseado nas movimentações
        for (const mov of movimentacoes) {
          if (mov.tipo === 'ENTRADA') {
            saldoCalculado += mov.quantidade;
          } else if (mov.tipo === 'SAIDA') {
            saldoCalculado -= mov.quantidade;
          } else if (mov.tipo === 'TRANSFERENCIA') {
            // Transferências não afetam o saldo total
          }
        }
      }
      
      // Verificar se o saldo está correto
      const diferenca = Math.abs(produto.saldo_atual - saldoCalculado);
      const tolerancia = 0.01; // Tolerância de 0.01 para evitar problemas de precisão
      
      if (diferenca > tolerancia) {
        console.log(`⚠️  ${produto.codigo}: Saldo incorreto!`);
        console.log(`   Descrição: ${produto.descricao}`);
        console.log(`   Saldo atual: ${produto.saldo_atual}`);
        console.log(`   Saldo calculado: ${saldoCalculado}`);
        console.log(`   Diferença: ${diferenca.toFixed(2)}`);
        console.log(`   Quantidade da aquisição: ${produtoAquisicao.quantidade}`);
        console.log(`   Movimentações: ${movimentacoes.length}\n`);
        
        // Corrigir o saldo
        await prisma.produto.update({
          where: { id: produto.id },
          data: { saldo_atual: saldoCalculado }
        });
        
        console.log(`   ✅ Saldo corrigido para: ${saldoCalculado}\n`);
        produtosCorrigidos++;
      }
    }
    
    console.log(`\n📊 Resumo da correção:`);
    console.log(`   Produtos verificados: ${aquisicao.produtos.length}`);
    console.log(`   Produtos com saldo corrigido: ${produtosCorrigidos}\n`);
    
    // Verificar especificamente os produtos de álcool
    console.log('🔍 Verificando produtos de álcool...\n');
    
    // Função para remover acentos
    function removerAcentos(texto) {
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    const produtosAlcool = await prisma.produto.findMany({
      where: {
        ativo: true,
        descricao: {
          contains: 'álcool'
        }
      },
      include: {
        categoria: { select: { nome: true } },
        unidade: { select: { sigla: true } },
        marca: { select: { nome: true } }
      }
    });
    
    console.log(`📊 Total de produtos com "álcool": ${produtosAlcool.length}\n`);
    
    if (produtosAlcool.length > 0) {
      console.log('📋 Lista de produtos de álcool:\n');
      for (const produto of produtosAlcool) {
        // Buscar movimentações para este produto
        const movimentacoes = await prisma.movimentacaoEstoque.findMany({
          where: {
            produto_id: produto.id
          },
          orderBy: {
            data: 'desc'
          },
          take: 5 // Últimas 5 movimentações
        });
        
        console.log(`${produto.codigo}: ${produto.descricao}`);
        console.log(`   Saldo atual: ${produto.saldo_atual} ${produto.unidade.sigla}`);
        console.log(`   Marca: ${produto.marca?.nome || 'N/A'}`);
        console.log(`   Últimas movimentações: ${movimentacoes.length}\n`);
        
        if (movimentacoes.length > 0) {
          movimentacoes.forEach((mov, index) => {
            console.log(`      ${index + 1}. ${mov.tipo}: ${mov.quantidade} em ${new Date(mov.data).toLocaleDateString('pt-BR')}`);
          });
          console.log('');
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao corrigir saldos:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
