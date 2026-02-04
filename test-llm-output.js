/**
 * Script para testar a API /api/llm/chat e salvar a saída em um arquivo
 */

const fs = require('fs');
const BASE_URL = 'http://localhost:3000';

async function testLLMChat(pergunta) {
  console.log(`\nTestando: "${pergunta}"`);
  
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
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const resultados = [];

  // Teste 1: Pergunta sobre saldo de "limpador de pisos"
  const teste1 = await testLLMChat('Qual é o saldo atual do limpador de pisos?');
  resultados.push({ pergunta: 'Qual é o saldo atual do limpador de pisos?', ...teste1 });

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Pergunta sobre produtos com estoque crítico
  const teste2 = await testLLMChat('Quais produtos estão com estoque crítico?');
  resultados.push({ pergunta: 'Quais produtos estão com estoque crítico?', ...teste2 });

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Pergunta sobre total de produtos no estoque
  const teste3 = await testLLMChat('Quantos produtos temos no estoque?');
  resultados.push({ pergunta: 'Quantos produtos temos no estoque?', ...teste3 });

  // Salvar resultados em um arquivo
  fs.writeFileSync('test-llm-resultados.json', JSON.stringify(resultados, null, 2));
  console.log('\nResultados salvos em test-llm-resultados.json');
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
