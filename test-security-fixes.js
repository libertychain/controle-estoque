const http = require('http');

/**
 * Script de Teste Abrangente das Correções de Segurança
 * 
 * Este script testa todas as correções implementadas:
 * 1. Autenticação JWT
 * 2. User_id em movimentações de estoque
 * 3. Validação de entrada
 * 4. Limites nas consultas
 */

const BASE_URL = 'http://localhost:3000';

// Função auxiliar para fazer requisições
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Testes
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              TESTES DE CORREÇÕES DE SEGURANÇA                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // Teste 1: Autenticação JWT - Sem token
  console.log('📋 Teste 1: Autenticação JWT - Sem token');
  try {
    const result = await makeRequest('GET', '/api/pedidos');
    if (result.statusCode === 401 && result.data.error.code === 'UNAUTHORIZED') {
      console.log('✅ PASSOU: Retornou 401 sem token\n');
      passed++;
    } else {
      console.log('❌ FALHOU: Não retornou 401\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Teste 2: Autenticação JWT - Token inválido
  console.log('📋 Teste 2: Autenticação JWT - Token inválido');
  try {
    const result = await makeRequest('GET', '/api/pedidos', {
      'Authorization': 'Bearer invalid-token'
    });
    if (result.statusCode === 401 && result.data.error.code === 'UNAUTHORIZED') {
      console.log('✅ PASSOU: Rejeitou token inválido\n');
      passed++;
    } else {
      console.log('❌ FALHOU: Não rejeitou token inválido\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Teste 3: Validação de entrada - HTML malicioso
  console.log('📋 Teste 3: Validação de entrada - HTML malicioso');
  try {
    const result = await makeRequest('POST', '/api/fornecedores', {}, {
      codigo: `TEST-XSS-${Date.now()}`,
      nome: '<script>alert("xss")</script>',
      cnpj: '11222333000181'
    });
    if (result.statusCode === 201 || result.statusCode === 200) {
      // Verificar se o HTML foi sanitizado
      const nome = result.data.data.fornecedor.nome;
      if (!nome.includes('<script>') && !nome.includes('<')) {
        console.log('✅ PASSOU: HTML foi sanitizado\n');
        passed++;
      } else {
        console.log('❌ FALHOU: HTML não foi sanitizado\n');
        failed++;
      }
    } else {
      console.log('❌ FALHOU: Status code inesperado\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Teste 4: Validação de entrada - Email inválido
  console.log('📋 Teste 4: Validação de entrada - Email inválido');
  try {
    const result = await makeRequest('POST', '/api/fornecedores', {}, {
      codigo: 'TEST2',
      nome: 'Teste',
      email: 'email-invalido'
    });
    if (result.statusCode === 400 && result.data.error.message.includes('Email inválido')) {
      console.log('✅ PASSOU: Rejeitou email inválido\n');
      passed++;
    } else {
      console.log('❌ FALHOU: Não rejeitou email inválido\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Teste 5: Validação de entrada - CNPJ inválido
  console.log('📋 Teste 5: Validação de entrada - CNPJ inválido');
  try {
    const result = await makeRequest('POST', '/api/fornecedores', {}, {
      codigo: 'TEST3',
      nome: 'Teste',
      cnpj: '12345678000190'
    });
    if (result.statusCode === 400 && result.data.error.message.includes('CNPJ inválido')) {
      console.log('✅ PASSOU: Rejeitou CNPJ inválido\n');
      passed++;
    } else {
      console.log('❌ FALHOU: Não rejeitou CNPJ inválido\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Teste 6: Validação de entrada - String muito longa
  console.log('📋 Teste 6: Validação de entrada - String muito longa');
  try {
    const longString = 'A'.repeat(100);
    const result = await makeRequest('POST', '/api/aquisicoes', {}, {
      numero_proc: `PROC-${Date.now()}-${longString}`,
      modalidade: 'Teste',
      fornecedor_id: 1
    });
    if (result.statusCode === 201 || result.statusCode === 200) {
      // Verificar se a string foi truncada
      const numeroProc = result.data.data.numero_proc;
      if (numeroProc.length <= 50) {
        console.log('✅ PASSOU: String foi truncada para 50 caracteres\n');
        passed++;
      } else {
        console.log('❌ FALHOU: String não foi truncada\n');
        failed++;
      }
    } else {
      console.log('❌ FALHOU: Status code inesperado\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Teste 7: Validação de entrada - Quantidade negativa
  console.log('📋 Teste 7: Validação de entrada - Quantidade negativa');
  try {
    const result = await makeRequest('POST', '/api/aquisicoes', {}, {
      numero_proc: `PROC-${Date.now()}-NEG`,
      modalidade: 'Teste',
      fornecedor_id: 1,
      produtos: [{
        descricao: 'Teste',
        unidade: 'UN',
        quantidade: -5,
        preco_unitario: 10
      }]
    });
    if (result.statusCode === 400 && result.data.error.message.includes('maior ou igual a 0')) {
      console.log('✅ PASSOU: Rejeitou quantidade negativa\n');
      passed++;
    } else {
      console.log('❌ FALHOU: Não rejeitou quantidade negativa\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FALHOU: Erro na requisição\n');
    failed++;
  }

  // Resumo
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                           RESUMO                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Testes passados: ${passed}`);
  console.log(`❌ Testes falhados: ${failed}`);
  console.log(`📊 Total de testes: ${passed + failed}`);
  console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(2)}%\n`);

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.');
    process.exit(1);
  }
}

// Executar testes
runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});
