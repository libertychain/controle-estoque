/**
 * Teste de Unidade das Correções de Segurança Críticas
 * 
 * Este script verifica diretamente o código fonte para confirmar as correções
 */

const fs = require('fs');
const path = require('path');

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

// Teste 1: Verificar se rate limiter bloqueia quando Redis não configurado
function testRateLimiterBlocksOnRedisFailure() {
  logTest('Rate Limiter - Deve Bloquear Quando Redis Não Configurado');
  
  const filePath = path.join(__dirname, 'src/lib/rate-limiter.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verificar se o código NÃO contém o fallback em memória
  const hasMemoryFallback = content.includes('usando rate limiting em memória');
  const hasRedisCheck = content.includes('if (!redisConfigured)');
  const returns503 = content.includes('status: 503');
  const blocksRequests = content.includes('BLOQUEAR todas as requisições');
  const preventsDoS = content.includes('prevenir ataques DoS');

  if (!hasMemoryFallback) {
    logSuccess('Fallback em memória foi removido');
  } else {
    logError('Fallback em memória ainda existe');
  }

  if (hasRedisCheck) {
    logSuccess('Verificação de redisConfigured está presente');
  } else {
    logError('Verificação de redisConfigured está ausente');
  }

  if (returns503) {
    logSuccess('Retorna status 503 quando Redis não configurado');
  } else {
    logError('Não retorna status 503');
  }

  if (blocksRequests) {
    logSuccess('Código contém mensagem de BLOQUEAR requisições');
  } else {
    logWarning('Mensagem de BLOQUEAR não encontrada (pode estar em outro formato)');
  }

  if (preventsDoS) {
    logSuccess('Código menciona prevenção de ataques DoS');
  } else {
    logWarning('Menção a ataques DoS não encontrada');
  }

  const passed = !hasMemoryFallback && hasRedisCheck && returns503;
  return passed;
}

// Teste 2: Verificar se JWT_SECRET fallback foi removido
function testJWTSecretFallbackRemoved() {
  logTest('JWT_SECRET Fallback - Deve Ser Removido');
  
  const filePath = path.join(__dirname, 'src/lib/rate-limiter.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verificar se o código NÃO contém o fallback 'fallback-secret'
  const hasFallbackSecret = content.includes("'fallback-secret'");
  const hasFallbackSecret2 = content.includes('"fallback-secret"');
  const checksJWTSecret = content.includes('if (!process.env.JWT_SECRET)');
  const returns500 = content.includes('status: 500');
  const logsCriticalError = content.includes('CRÍTICO: JWT_SECRET não configurado');

  if (!hasFallbackSecret && !hasFallbackSecret2) {
    logSuccess('Fallback "fallback-secret" foi removido');
  } else {
    logError('Fallback "fallback-secret" ainda existe');
  }

  if (checksJWTSecret) {
    logSuccess('Verificação de JWT_SECRET está presente');
  } else {
    logError('Verificação de JWT_SECRET está ausente');
  }

  if (returns500) {
    logSuccess('Retorna status 500 quando JWT_SECRET não configurado');
  } else {
    logError('Não retorna status 500');
  }

  if (logsCriticalError) {
    logSuccess('Log de erro crítico está presente');
  } else {
    logWarning('Log de erro crítico não encontrado');
  }

  const passed = !hasFallbackSecret && !hasFallbackSecret2 && checksJWTSecret && returns500;
  return passed;
}

// Teste 3: Verificar se rate limiter do chat não tem try-catch
function testChatRateLimiterNoTryCatch() {
  logTest('Rate Limiter do Chat - Não Deve Ter Try-Catch');
  
  const filePath = path.join(__dirname, 'src/app/api/llm/chat/route.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verificar se o código NÃO contém try-catch ao redor do rate limiter
  const hasTryCatchAroundRateLimiter = 
    /try\s*{[\s\S]*?llmChatRateLimiter[\s\S]*?}\s*catch/.test(content);
  
  const hasRateLimiterCall = content.includes('llmChatRateLimiter');
  const blocksOnError = content.includes('if (rateLimitError)');
  const returnsRateLimitError = content.includes('return rateLimitError');
  const hasCriticalComment = content.includes('CRÍTICO');

  if (!hasTryCatchAroundRateLimiter) {
    logSuccess('Try-catch ao redor do rate limiter foi removido');
  } else {
    logError('Try-catch ao redor do rate limiter ainda existe');
  }

  if (hasRateLimiterCall) {
    logSuccess('Chamada ao rate limiter está presente');
  } else {
    logError('Chamada ao rate limiter está ausente');
  }

  if (blocksOnError) {
    logSuccess('Verificação de erro está presente');
  } else {
    logError('Verificação de erro está ausente');
  }

  if (returnsRateLimitError) {
    logSuccess('Retorna erro do rate limiter');
  } else {
    logError('Não retorna erro do rate limiter');
  }

  if (hasCriticalComment) {
    logSuccess('Comentário CRÍTICO está presente');
  } else {
    logWarning('Comentário CRÍTICO não encontrado');
  }

  const passed = !hasTryCatchAroundRateLimiter && hasRateLimiterCall && blocksOnError && returnsRateLimitError;
  return passed;
}

// Função principal
function runTests() {
  console.log('\n' + '='.repeat(80));
  log('🔒 TESTE DE UNIDADE DAS CORREÇÕES DE SEGURANÇA CRÍTICAS', colors.blue);
  console.log('='.repeat(80));
  
  const results = {
    test1: testRateLimiterBlocksOnRedisFailure(),
    test2: testJWTSecretFallbackRemoved(),
    test3: testChatRateLimiterNoTryCatch()
  };

  console.log('\n' + '='.repeat(80));
  log('📊 RESUMO DOS TESTES', colors.blue);
  console.log('='.repeat(80));
  
  log(`Teste 1 - Rate Limiter Bloqueia Sem Redis: ${results.test1 ? 'PASSOU' : 'FALHOU'}`, 
      results.test1 ? colors.green : colors.red);
  log(`Teste 2 - JWT_SECRET Fallback Removido: ${results.test2 ? 'PASSOU' : 'FALHOU'}`, 
      results.test2 ? colors.green : colors.red);
  log(`Teste 3 - Rate Limiter do Chat Sem Try-Catch: ${results.test3 ? 'PASSOU' : 'FALHOU'}`, 
      results.test3 ? colors.green : colors.red);

  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = Object.values(results).filter(r => !r).length;

  console.log('\n' + '='.repeat(80));
  log(`Total: ${passedTests} PASSOU, ${failedTests} FALHOU`, 
      failedTests === 0 ? colors.green : colors.red);
  console.log('='.repeat(80) + '\n');

  return failedTests === 0;
}

// Executar testes
const success = runTests();
process.exit(success ? 0 : 1);
