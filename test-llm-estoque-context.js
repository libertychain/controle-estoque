/**
 * Script de teste para verificar se o assistente de IA consegue responder
 * perguntas sobre saldos de produtos após a implementação da correção.
 */

const BASE_URL = 'http://localhost:3000';

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log('\n' + '='.repeat(60), colors.cyan);
  log(`TESTE: ${testName}`, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

async function testLLMChat(pergunta, descricaoTeste) {
  logTest(descricaoTeste);
  logInfo(`Pergunta: "${pergunta}"`);

  try {
    const response = await fetch(`${BASE_URL}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pergunta })
    });

    if (!response.ok) {
      const errorData = await response.json();
      logError(`Erro na requisição: ${response.status} ${response.statusText}`);
      logError(JSON.stringify(errorData, null, 2));
      return { success: false, error: errorData };
    }

    const data = await response.json();
    logSuccess(`Requisição bem-sucedida (Status: ${response.status})`);
    
    if (data.success) {
      logSuccess(`Resposta obtida com sucesso`);
      logInfo(`Resposta da IA:\n${data.resposta || data.message || 'Sem resposta'}`);
      
      // Verificar se a resposta contém informações de produtos
      const resposta = data.resposta || data.message || '';
      const contemDadosEstoque = resposta.includes('saldo') || 
                                  resposta.includes('estoque') || 
                                  resposta.includes('produto') ||
                                  /\d+\s*(un|kg|l|ml|g|m|cm)/i.test(resposta);
      
      if (contemDadosEstoque) {
        logSuccess('Resposta parece conter dados de estoque');
      } else {
        logError('Resposta NÃO parece conter dados de estoque');
      }
      
      return { success: true, data, contemDadosEstoque };
    } else {
      logError(`Erro na resposta da API: ${data.error?.message || 'Erro desconhecido'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    logError(`Erro ao fazer requisição: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.magenta);
  log('TESTE DE INTEGRAÇÃO - ASSISTENTE DE IA COM CONTEXTO DE ESTOQUE', colors.magenta);
  log('='.repeat(60), colors.magenta);
  logInfo(`URL base: ${BASE_URL}`);
  logInfo(`Data/Hora: ${new Date().toISOString()}`);

  const resultados = [];

  // Teste 1: Pergunta sobre saldo de "limpador de pisos" (a mesma que falhou anteriormente)
  const teste1 = await testLLMChat(
    'Qual é o saldo atual do limpador de pisos?',
    'Teste 1: Saldo de limpador de pisos'
  );
  resultados.push({ teste: 'Saldo de limpador de pisos', ...teste1 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Pergunta sobre produtos com estoque crítico
  const teste2 = await testLLMChat(
    'Quais produtos estão com estoque crítico?',
    'Teste 2: Produtos com estoque crítico'
  );
  resultados.push({ teste: 'Produtos com estoque crítico', ...teste2 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Pergunta sobre total de produtos no estoque
  const teste3 = await testLLMChat(
    'Quantos produtos temos no estoque?',
    'Teste 3: Total de produtos no estoque'
  );
  resultados.push({ teste: 'Total de produtos no estoque', ...teste3 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 4: Pergunta genérica sobre estoque
  const teste4 = await testLLMChat(
    'Me mostre os produtos com maior saldo no estoque',
    'Teste 4: Produtos com maior saldo'
  );
  resultados.push({ teste: 'Produtos com maior saldo', ...teste4 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 5: Pergunta específica sobre um produto
  const teste5 = await testLLMChat(
    'Quais produtos têm saldo abaixo do mínimo?',
    'Teste 5: Produtos com saldo abaixo do mínimo'
  );
  resultados.push({ teste: 'Produtos com saldo abaixo do mínimo', ...teste5 });

  // Resumo dos resultados
  log('\n' + '='.repeat(60), colors.yellow);
  log('RESUMO DOS TESTES', colors.yellow);
  log('='.repeat(60), colors.yellow);

  const sucessos = resultados.filter(r => r.success).length;
  const falhas = resultados.filter(r => !r.success).length;
  const comDadosEstoque = resultados.filter(r => r.contemDadosEstoque).length;

  log(`Total de testes: ${resultados.length}`, colors.reset);
  log(`Sucessos: ${sucessos}`, colors.green);
  log(`Falhas: ${falhas}`, colors.red);
  log(`Respostas com dados de estoque: ${comDadosEstoque}`, colors.blue);

  log('\n' + '='.repeat(60), colors.yellow);
  log('DETALHAMENTO DOS TESTES', colors.yellow);
  log('='.repeat(60), colors.yellow);

  resultados.forEach((r, i) => {
    log(`\n${i + 1}. ${r.teste}`, colors.cyan);
    if (r.success) {
      logSuccess(`Status: Sucesso`);
      logInfo(`Contém dados de estoque: ${r.contemDadosEstoque ? 'Sim' : 'Não'}`);
    } else {
      logError(`Status: Falha`);
      logError(`Erro: ${JSON.stringify(r.error)}`);
    }
  });

  log('\n' + '='.repeat(60), colors.magenta);
  log('TESTES CONCLUÍDOS', colors.magenta);
  log('='.repeat(60), colors.magenta);

  // Verificar logs do terminal para confirmar carregamento do contexto
  log('\n' + '='.repeat(60), colors.yellow);
  log('VERIFICAÇÃO DE LOGS', colors.yellow);
  log('='.repeat(60), colors.yellow);
  logInfo('Verifique o terminal onde o servidor Next.js está rodando');
  logInfo('Procure por mensagens como:');
  logInfo('  - "Contexto de estoque carregado: X produtos"');
  logInfo('  - Erros relacionados à busca de contexto de estoque');
  logInfo('\nSe você vir a mensagem "Contexto de estoque carregado",');
  logInfo('significa que o contexto está sendo buscado corretamente do banco de dados.');
}

// Executar os testes
main().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
