/**
 * Script de teste para verificar se a busca de produtos funciona corretamente
 * com acentos e case-insensitive
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
      logInfo(`Resposta da IA:\n${data.data?.resposta || data.resposta || 'Sem resposta'}`);
      
      // Verificar se a resposta contém informações de produtos
      const resposta = data.data?.resposta || data.resposta || '';
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
  log('TESTE DE BUSCA DE PRODUTOS COM ACENTOS', colors.magenta);
  log('='.repeat(60), colors.magenta);
  logInfo(`URL base: ${BASE_URL}`);
  logInfo(`Data/Hora: ${new Date().toISOString()}`);

  const resultados = [];

  // Teste 1: Pergunta sobre "álcool" (com acento)
  const teste1 = await testLLMChat(
    'Qual é o saldo de Álcool?',
    'Teste 1: Saldo de Álcool (com acento)'
  );
  resultados.push({ teste: 'Saldo de Álcool (com acento)', ...teste1 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Pergunta sobre "alcool" (sem acento)
  const teste2 = await testLLMChat(
    'Qual é o saldo de alcool?',
    'Teste 2: Saldo de alcool (sem acento)'
  );
  resultados.push({ teste: 'Saldo de alcool (sem acento)', ...teste2 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Pergunta sobre "ÁLCOOL" (maiúsculas)
  const teste3 = await testLLMChat(
    'Qual é o saldo de ÁLCOOL?',
    'Teste 3: Saldo de ÁLCOOL (maiúsculas)'
  );
  resultados.push({ teste: 'Saldo de ÁLCOOL (maiúsculas)', ...teste3 });

  // Aguardar um pouco entre requisições
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 4: Pergunta sobre "rodo de 40cm"
  const teste4 = await testLLMChat(
    'Qual é o saldo de rodo de 40cm?',
    'Teste 4: Saldo de rodo de 40cm'
  );
  resultados.push({ teste: 'Saldo de rodo de 40cm', ...teste4 });

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
}

// Executar os testes
main().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
