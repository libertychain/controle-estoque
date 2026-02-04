/**
 * Script simples para testar a API /api/llm/chat e ver a resposta completa
 */

const BASE_URL = 'http://localhost:3000';

async function testLLMChat(pergunta) {
  console.log('\n' + '='.repeat(60));
  console.log(`Pergunta: "${pergunta}"`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pergunta })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro:', JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    console.log('\nResposta completa:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao fazer requisição:', error.message);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE SIMPLES - API /api/llm/chat');
  console.log('='.repeat(60));

  // Teste 1: Pergunta sobre saldo de "limpador de pisos"
  await testLLMChat('Qual é o saldo atual do limpador de pisos?');

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Pergunta sobre produtos com estoque crítico
  await testLLMChat('Quais produtos estão com estoque crítico?');

  console.log('\n' + '='.repeat(60));
  console.log('Testes concluídos. Verifique os logs do servidor Next.js.');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
