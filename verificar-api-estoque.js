const http = require('http');

(async () => {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║              VERIFICANDO API DE ESTOQUE                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    // Fazer requisição para a API de produtos de estoque
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/estoque/produtos',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✓ Status: ${res.statusCode} OK`);
          console.log(`✓ Content-Type: ${res.headers['content-type']}\n`);

          try {
            const response = JSON.parse(data);
            const produtos = response.data?.produtos || [];
            console.log(`📦 Total de produtos retornados: ${produtos.length}\n`);

            // Mostrar os primeiros 10 produtos
            console.log('═══════════════════════════════════════════════════════════════════════');
            console.log('PRIMEIROS 10 PRODUTOS (SALDOS ATUALIZADOS):');
            console.log('═══════════════════════════════════════════════════════════════════════\n');

            produtos.slice(0, 10).forEach((p, index) => {
              console.log(`${index + 1}. ${p.codigo} - ${p.descricao.substring(0, 50)}...`);
              console.log(`   Saldo atual: ${p.saldo_atual}`);
              console.log(`   Unidade: ${p.unidade?.sigla || 'N/A'}`);
              console.log(`   Categoria: ${p.categoria?.nome || 'N/A'}`);
              console.log('');
            });

            // Verificar se os produtos que foram atualizados estão na lista
            const codigosAtualizados = [
              'PAQ-63', 'PAQ-25', 'PAQ-11', 'PAQ-12', 'PAQ-121',
              'PAQ-48', 'PAQ-49', 'PAQ-50', 'PAQ-51', 'PAQ-46'
            ];

            console.log('═══════════════════════════════════════════════════════════════════════');
            console.log('VERIFICANDO PRODUTOS ATUALIZADOS PELO SCRIPT:');
            console.log('═══════════════════════════════════════════════════════════════════════\n');

            codigosAtualizados.forEach(codigo => {
              const produto = produtos.find(p => p.codigo === codigo);
              if (produto) {
                console.log(`✓ ${codigo} - Saldo: ${produto.saldo_atual}`);
              } else {
                console.log(`✗ ${codigo} - Não encontrado`);
              }
            });

            console.log('\n✅ API de estoque funcionando corretamente!');
            console.log('📄 Acesse http://localhost:3000/estoque para visualizar a página de estoque');

          } catch (error) {
            console.error('Erro ao fazer parse do JSON:', error.message);
            console.log('Resposta bruta:', data.substring(0, 500));
          }
        } else {
          console.error(`✗ Status: ${res.statusCode}`);
          console.error('Resposta:', data.substring(0, 500));
        }
      });
    });

    req.on('error', (error) => {
      console.error('✗ Erro ao fazer requisição:', error.message);
      console.error('\nCertifique-se de que o servidor está rodando em http://localhost:3000');
    });

    req.setTimeout(10000, () => {
      console.error('✗ Timeout: A requisição demorou muito para responder');
      req.destroy();
    });

    req.end();

  } catch (error) {
    console.error('Erro:', error.message);
  }
})();
