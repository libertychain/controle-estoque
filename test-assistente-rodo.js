// Teste do assistente de IA para verificar se consegue encontrar o produto "rodo de 40cm"

async function testarAssistente() {
  try {
    console.log('🧪 Testando assistente de IA com pergunta sobre "rodo de 40cm"...');
    
    const response = await fetch('http://localhost:3000/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pergunta: 'Qual é o saldo do rodo de 40cm?'
      })
    });

    const data = await response.json();
    
    console.log('\n📊 Resposta do assistente:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n✅ Teste bem-sucedido!');
      console.log(`Resposta: ${data.data.resposta}`);
      
      if (data.data.resposta.includes('Não encontrei')) {
        console.log('\n⚠️  O assistente ainda não encontrou o produto no contexto.');
      } else {
        console.log('\n🎉 O assistente encontrou o produto!');
      }
    } else {
      console.log('\n❌ Teste falhou:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro ao testar assistente:', error.message);
    console.log('\n💡 Dica: Certifique-se de que o servidor está rodando em http://localhost:3000');
  }
}

testarAssistente();
