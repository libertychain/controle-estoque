const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║  RECALCULO DE SALDOS - PEDIDOS ANTIGOS (SEM MOVIMENTAÇÃO DE ESTOQUE)  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    // Contadores para o resumo final
    let pedidosProcessados = 0;
    let produtosAtualizados = 0;
    const produtosAtualizadosDetalhes = [];

    // Verificar ou criar usuário de sistema para as movimentações
    console.log('🔐 Verificando usuário de sistema...');
    let usuarioSistema = await db.usuario.findFirst({
      where: { email: 'sistema@recalculo.local' }
    });

    if (!usuarioSistema) {
      console.log('  Criando usuário de sistema...');
      // Primeiro, verificar se existe um perfil
      let perfil = await db.perfil.findFirst();
      if (!perfil) {
        console.log('  Criando perfil padrão...');
        perfil = await db.perfil.create({
          data: {
            nome: 'Administrador',
            descricao: 'Perfil padrão do sistema'
          }
        });
      }

      usuarioSistema = await db.usuario.create({
        data: {
          nome: 'Sistema de Recálculo',
          email: 'sistema@recalculo.local',
          senha: 'recalculo_temporario',
          perfil_id: perfil.id
        }
      });
      console.log(`  ✓ Usuário de sistema criado (ID: ${usuarioSistema.id})\n`);
    } else {
      console.log(`  ✓ Usuário de sistema encontrado (ID: ${usuarioSistema.id})\n`);
    }

    // 1. Buscar todos os pedidos ativos (não deletados)
    console.log('📋 Buscando pedidos ativos...');
    const pedidos = await db.pedido.findMany({
      where: { ativo: true },
      include: {
        secretaria: true,
        setor: true
      },
      orderBy: { numero: 'asc' }
    });

    console.log(`✓ Encontrados ${pedidos.length} pedidos ativos\n`);

    if (pedidos.length === 0) {
      console.log('⚠️  Nenhum pedido ativo encontrado. Encerrando script.');
      await db.$disconnect();
      return;
    }

    // 2. Para cada pedido, buscar todos os itens e agrupar por produto
    console.log('📦 Processando pedidos e agrupando itens por produto...\n');

    // Mapa para acumular quantidades por produto
    const produtosQuantidadeMap = new Map();

    for (const pedido of pedidos) {
      console.log(`  📄 Pedido ${pedido.numero} (${pedido.setor.nome} - ${pedido.secretaria.sigla})`);

      // Buscar itens do pedido
      const itens = await db.itemPedido.findMany({
        where: { pedido_id: pedido.id },
        include: {
          produto: {
            include: {
              categoria: true,
              unidade: true
            }
          }
        }
      });

      console.log(`     - ${itens.length} itens encontrados`);

      // Agrupar itens por produto
      for (const item of itens) {
        const produtoId = item.produto_id;
        const quantidadeAtual = produtosQuantidadeMap.get(produtoId) || 0;
        produtosQuantidadeMap.set(produtoId, quantidadeAtual + item.quantidade);
      }

      pedidosProcessados++;
    }

    console.log(`\n✓ Processados ${pedidosProcessados} pedidos`);
    console.log(`✓ Identificados ${produtosQuantidadeMap.size} produtos com itens em pedidos\n`);

    // 3. Para cada produto afetado, atualizar saldo e criar movimentação
    console.log('🔄 Atualizando saldos e criando movimentações de estoque...\n');

    const produtoIds = Array.from(produtosQuantidadeMap.keys());

    for (const produtoId of produtoIds) {
      const quantidadeTotalUtilizada = produtosQuantidadeMap.get(produtoId);

      // Buscar informações do produto
      const produto = await db.produto.findUnique({
        where: { id: produtoId },
        include: {
          categoria: true,
          unidade: true
        }
      });

      if (!produto) {
        console.log(`  ⚠️  Produto ID ${produtoId} não encontrado. Pulando...`);
        continue;
      }

      const saldoAnterior = produto.saldo_atual;
      const saldoCorrigido = saldoAnterior - quantidadeTotalUtilizada;

      console.log(`  📦 Produto: ${produto.descricao}`);
      console.log(`     ID: ${produto.id}`);
      console.log(`     Código: ${produto.codigo}`);
      console.log(`     Categoria: ${produto.categoria.nome}`);
      console.log(`     Unidade: ${produto.unidade.sigla}`);
      console.log(`     Quantidade total utilizada em pedidos: ${quantidadeTotalUtilizada}`);
      console.log(`     Saldo anterior: ${saldoAnterior}`);
      console.log(`     Saldo corrigido: ${saldoCorrigido}`);

      // 4. Usar transação do Prisma para garantir consistência
      await db.$transaction(async (tx) => {
        // Atualizar o saldo_atual na tabela Produto
        await tx.produto.update({
          where: { id: produtoId },
          data: { saldo_atual: saldoCorrigido }
        });

        // Criar movimentação de estoque do tipo 'SAIDA' retroativa
        await tx.movimentacaoEstoque.create({
          data: {
            produto_id: produtoId,
            tipo: 'SAIDA',
            quantidade: quantidadeTotalUtilizada,
            saldo_anterior: saldoAnterior,
            saldo_novo: saldoCorrigido,
            data: new Date(),
            observacao: 'Recálculo retroativo de estoque - Pedidos antigos',
            usuario_id: usuarioSistema.id // Usuário de sistema para as movimentações
          }
        });
      });

      console.log(`     ✓ Saldo atualizado e movimentação criada\n`);

      produtosAtualizados++;
      produtosAtualizadosDetalhes.push({
        id: produto.id,
        codigo: produto.codigo,
        descricao: produto.descricao,
        categoria: produto.categoria.nome,
        unidade: produto.unidade.sigla,
        saldoAnterior,
        saldoCorrigido,
        quantidadeUtilizada: quantidadeTotalUtilizada
      });
    }

    // 5. Exibir resumo final
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                           RESUMO FINAL                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Pedidos processados: ${pedidosProcessados}`);
    console.log(`📦 Produtos atualizados: ${produtosAtualizados}\n`);

    if (produtosAtualizadosDetalhes.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════════');
      console.log('DETALHES DOS PRODUTOS ATUALIZADOS:');
      console.log('═══════════════════════════════════════════════════════════════════════\n');

      produtosAtualizadosDetalhes.forEach((p, index) => {
        console.log(`${index + 1}. ${p.descricao}`);
        console.log(`   Código: ${p.codigo} | Categoria: ${p.categoria} | Unidade: ${p.unidade}`);
        console.log(`   Saldo anterior: ${p.saldoAnterior.toFixed(2)}`);
        console.log(`   Quantidade utilizada: ${p.quantidadeUtilizada.toFixed(2)}`);
        console.log(`   Saldo corrigido: ${p.saldoCorrigido.toFixed(2)}`);
        console.log('');
      });
    }

    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                    RECALCULO CONCLUÍDO COM SUCESSO                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.error('║                              ERRO                                     ║');
    console.error('╚══════════════════════════════════════════════════════════════════════╝\n');
    console.error('Erro ao executar script:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();
