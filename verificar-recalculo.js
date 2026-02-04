const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICAÇÃO DO RECALCULO                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    // 1. Verificar movimentações de estoque criadas
    console.log('📊 Verificando movimentações de estoque criadas...');
    const movimentacoes = await db.movimentacaoEstoque.findMany({
      where: {
        observacao: 'Recálculo retroativo de estoque - Pedidos antigos'
      },
      include: {
        produto: {
          select: {
            codigo: true,
            descricao: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`✓ Encontradas ${movimentacoes.length} movimentações de estoque\n`);

    if (movimentacoes.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════════');
      console.log('MOVIMENTAÇÕES DE ESTOQUE CRIADAS:');
      console.log('═══════════════════════════════════════════════════════════════════════\n');

      movimentacoes.forEach((m, index) => {
        console.log(`${index + 1}. ${m.produto.codigo} - ${m.produto.descricao}`);
        console.log(`   Tipo: ${m.tipo} | Quantidade: ${m.quantidade}`);
        console.log(`   Saldo anterior: ${m.saldo_anterior} → Saldo novo: ${m.saldo_novo}`);
        console.log(`   Data: ${m.data.toISOString()}`);
        console.log(`   Observação: ${m.observacao}`);
        console.log('');
      });
    }

    // 2. Verificar saldos atuais dos produtos
    console.log('\n📦 Verificando saldos atuais dos produtos...');
    const produtos = await db.produto.findMany({
      where: {
        id: { in: movimentacoes.map(m => m.produto_id) }
      },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        saldo_atual: true
      },
      orderBy: { codigo: 'asc' }
    });

    console.log(`✓ Encontrados ${produtos.length} produtos atualizados\n`);

    if (produtos.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════════');
      console.log('SALDOS ATUAIS DOS PRODUTOS:');
      console.log('═══════════════════════════════════════════════════════════════════════\n');

      produtos.forEach((p, index) => {
        const movimentacao = movimentacoes.find(m => m.produto_id === p.id);
        const saldoEsperado = movimentacao ? movimentacao.saldo_novo : null;
        const saldoCorreto = saldoEsperado !== null && p.saldo_atual === saldoEsperado;

        console.log(`${index + 1}. ${p.codigo} - ${p.descricao.substring(0, 50)}...`);
        console.log(`   Saldo atual: ${p.saldo_atual}`);
        console.log(`   Saldo esperado: ${saldoEsperado}`);
        console.log(`   Status: ${saldoCorreto ? '✓ CORRETO' : '✗ INCORRETO'}`);
        console.log('');
      });
    }

    // 3. Verificar usuário de sistema
    console.log('\n🔐 Verificando usuário de sistema...');
    const usuarioSistema = await db.usuario.findFirst({
      where: { email: 'sistema@recalculo.local' },
      include: { perfil: true }
    });

    if (usuarioSistema) {
      console.log(`✓ Usuário de sistema encontrado:`);
      console.log(`   ID: ${usuarioSistema.id}`);
      console.log(`   Nome: ${usuarioSistema.nome}`);
      console.log(`   Email: ${usuarioSistema.email}`);
      console.log(`   Perfil: ${usuarioSistema.perfil.nome}`);
    } else {
      console.log('✗ Usuário de sistema não encontrado');
    }

    // 4. Resumo final
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                        RESUMO DA VERIFICAÇÃO                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Movimentações de estoque criadas: ${movimentacoes.length}`);
    console.log(`📦 Produtos atualizados: ${produtos.length}`);

    // Verificar se todos os saldos estão corretos
    let saldosCorretos = 0;
    produtos.forEach(p => {
      const movimentacao = movimentacoes.find(m => m.produto_id === p.id);
      if (movimentacao && p.saldo_atual === movimentacao.saldo_novo) {
        saldosCorretos++;
      }
    });

    console.log(`✓ Saldos corretos: ${saldosCorretos}/${produtos.length}`);

    if (saldosCorretos === produtos.length) {
      console.log('\n✅ Todos os saldos foram atualizados corretamente!');
    } else {
      console.log('\n⚠️  Alguns saldos não foram atualizados corretamente.');
    }

  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.error('║                              ERRO                                     ║');
    console.error('╚══════════════════════════════════════════════════════════════════════╝\n');
    console.error('Erro ao executar verificação:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();
