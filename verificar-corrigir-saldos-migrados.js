const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Verificando e corrigindo saldos dos produtos migrados...\n');
    
    // Buscar todos os produtos ativos
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
        codigo: 'asc'
      }
    });
    
    console.log(`📊 Total de produtos ativos: ${todosProdutos.length}\n`);
    
    let produtosCorrigidos = 0;
    let produtosSemMovimentacao = 0;
    
    for (const produto of todosProdutos) {
      // Buscar todas as movimentações de estoque para este produto
      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
        where: {
          produto_id: produto.id
        },
        orderBy: {
          data: 'asc'
        }
      });
      
      let saldoCalculado = 0;
      
      if (movimentacoes.length > 0) {
        // Calcular saldo baseado nas movimentações
        for (const mov of movimentacoes) {
          if (mov.tipo === 'ENTRADA') {
            saldoCalculado += mov.quantidade;
          } else if (mov.tipo === 'SAIDA') {
            saldoCalculado -= mov.quantidade;
          } else if (mov.tipo === 'TRANSFERENCIA') {
            // Transferências não afetam o saldo total
            // Apenas movimentam entre locais
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
        console.log(`   Movimentações: ${movimentacoes.length}\n`);
        
        // Corrigir o saldo
        await prisma.produto.update({
          where: { id: produto.id },
          data: { saldo_atual: saldoCalculado }
        });
        
        console.log(`   ✅ Saldo corrigido para: ${saldoCalculado}\n`);
        produtosCorrigidos++;
      } else if (movimentacoes.length === 0) {
        produtosSemMovimentacao++;
      }
    }
    
    console.log(`\n📊 Resumo da verificação:`);
    console.log(`   Produtos verificados: ${todosProdutos.length}`);
    console.log(`   Produtos com saldo corrigido: ${produtosCorrigidos}`);
    console.log(`   Produtos sem movimentação: ${produtosSemMovimentacao}\n`);
    
    // Verificar especificamente os produtos de álcool
    console.log('🔍 Verificando produtos de álcool...\n');
    
    // Função para remover acentos
    function removerAcentos(texto) {
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    const produtosAlcool = todosProdutos.filter(p => {
      const descricaoNormalizada = removerAcentos(p.descricao.toLowerCase());
      return descricaoNormalizada.includes('alcool');
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
    console.error('Erro ao verificar e corrigir saldos:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
