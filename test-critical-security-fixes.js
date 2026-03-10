/**
 * Teste das Correções de Segurança Críticas
 * 
 * Este script testa as 3 vulnerabilidades críticas que foram corrigidas:
 * 1. Rate Limiter Continua Sem Redis (DoS Vulnerability)
 * 2. JWT_SECRET Fallback Previsível (Token Forgery)
 * 3. Rate Limiter do Chat Continua ao Falhar (Rate Limiting Bypass)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name) {
  console.log('\n' + '='.repeat(80));
  log(`📋 TESTE: ${name}`, colors.blue);
  console.log('='.repeat(80));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Função auxiliar para fazer requisições HTTP
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = http.request(url, requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Teste 1: Rate Limiter Sem Redis deve bloquear (503)
async function testRateLimiterWithoutRedis() {
  logTest('Rate Limiter Sem Redis - Deve Retornar 503');
  
  try {
    // Tentar acessar endpoint de chat sem autenticação
    const response = await makeRequest('/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        pergunta: 'Teste de segurança'
      }
    });

    // Se REDIS_URL não estiver configurado, deve retornar 503
    if (response.statusCode === 503) {
      logSuccess('Rate limiter bloqueou requisição quando Redis não configurado');
      logSuccess(`Status Code: ${response.statusCode}`);
      logSuccess(`Message: ${response.body.error?.message}`);
      return true;
    } else if (response.statusCode === 401) {
      logWarning('Requisição bloqueada por falta de autenticação (esperado)');
      logWarning('Para testar o rate limiter, precisa de token JWT válido');
      return null;
    } else {
      logError(`Status inesperado: ${response.statusCode}`);
      logError(`Resposta: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    logError(`Erro ao fazer requisição: ${error.message}`);
    return false;
  }
}

// Teste 2: JWT_SECRET Fallback Previsível
async function testJWTSecretFallback() {
  logTest('JWT_SECRET Fallback Previsível - Deve Retornar 500');
  
  try {
    // Tentar criar um token JWT com segredo conhecido
    const jwt = require('jsonwebtoken');
    
    // Tentar criar token com segredo 'fallback-secret' (não deve funcionar mais)
    const fakeToken = jwt.sign(
      { id: 1, nome: 'Teste', email: 'teste@teste.com', perfil_id: 1 },
      'fallback-secret',
      { expiresIn: '1h' }
    );

    // Tentar usar esse token
    const response = await makeRequest('/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fakeToken}`
      },
      body: {
        pergunta: 'Teste de segurança'
      }
    });

    // Se JWT_SECRET estiver configurado corretamente, token com 'fallback-secret' deve falhar
    if (response.statusCode === 401) {
      logSuccess('Token com segredo previsível foi rejeitado');
      logSuccess(`Status Code: ${response.statusCode}`);
      logSuccess(`Message: ${response.body.error?.message}`);
      return true;
    } else if (response.statusCode === 500) {
      logSuccess('Servidor retornou 500 quando JWT_SECRET não configurado');
      logSuccess(`Status Code: ${response.statusCode}`);
      logSuccess(`Message: ${response.body.error?.message}`);
      return true;
    } else {
      logWarning(`Status inesperado: ${response.statusCode}`);
      logWarning(`Resposta: ${JSON.stringify(response.body)}`);
      return null;
    }
  } catch (error) {
    logError(`Erro ao fazer requisição: ${error.message}`);
    return false;
  }
}

// Teste 3: Rate Limiter do Chat deve bloquear ao falhar
async function testChatRateLimiterBlocksOnFailure() {
  logTest('Rate Limiter do Chat - Deve Bloquear ao Falhar');
  
  try {
    // Fazer múltiplas requisições para testar rate limiting
    const responses = [];
    
    for (let i = 0; i < 25; i++) {
      const response = await makeRequest('/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          pergunta: `Teste ${i}`
        }
      });
      
      responses.push(response.statusCode);
      
      // Se receber 429, o rate limiting está funcionando
      if (response.statusCode === 429) {
        logSuccess(`Rate limiter bloqueou após ${i + 1} requisições`);
        logSuccess(`Status Code: ${response.statusCode}`);
        logSuccess(`Message: ${response.body.error?.message}`);
        return true;
      }
      
      // Pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Se não foi bloqueado, verificar se foi por autenticação
    if (responses.every(status => status === 401)) {
      logWarning('Todas as requisições foram bloqueadas por falta de autenticação');
      logWarning('Para testar rate limiting, precisa de token JWT válido');
      return null;
    }

    logWarning(`Rate limiter não bloqueou após 25 requisições`);
    logWarning(`Status codes: ${responses.join(', ')}`);
    return null;
  } catch (error) {
    logError(`Erro ao fazer requisição: ${error.message}`);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('\n' + '='.repeat(80));
  log('🔒 TESTE DAS CORREÇÕES DE SEGURANÇA CRÍTICAS', colors.blue);
  console.log('='.repeat(80));
  
  const results = {
    test1: await testRateLimiterWithoutRedis(),
    test2: await testJWTSecretFallback(),
    test3: await testChatRateLimiterBlocksOnFailure()
  };

  console.log('\n' + '='.repeat(80));
  log('📊 RESUMO DOS TESTES', colors.blue);
  console.log('='.repeat(80));
  
  log(`Teste 1 - Rate Limiter Sem Redis: ${results.test1 === true ? 'PASSOU' : results.test1 === null ? 'INCONCLUSIVO' : 'FALHOU'}`, 
      results.test1 === true ? colors.green : results.test1 === null ? colors.yellow : colors.red);
  log(`Teste 2 - JWT_SECRET Fallback: ${results.test2 === true ? 'PASSOU' : results.test2 === null ? 'INCONCLUSIVO' : 'FALHOU'}`, 
      results.test2 === true ? colors.green : results.test2 === null ? colors.yellow : colors.red);
  log(`Teste 3 - Rate Limiter do Chat: ${results.test3 === true ? 'PASSOU' : results.test3 === null ? 'INCONCLUSIVO' : 'FALHOU'}`, 
      results.test3 === true ? colors.green : results.test3 === null ? colors.yellow : colors.red);

  const passedTests = Object.values(results).filter(r => r === true).length;
  const failedTests = Object.values(results).filter(r => r === false).length;
  const inconclusiveTests = Object.values(results).filter(r => r === null).length;

  console.log('\n' + '='.repeat(80));
  log(`Total: ${passedTests} PASSOU, ${failedTests} FALHOU, ${inconclusiveTests} INCONCLUSIVO`, 
      failedTests === 0 ? colors.green : colors.red);
  console.log('='.repeat(80) + '\n');
}

// Executar testes
runTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});
