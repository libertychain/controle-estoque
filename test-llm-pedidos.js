// Teste do assistente de IA com perguntas sobre pedidos

const testarPerguntaSobrePedidos = async (pergunta) => {
  console.log(`\n📝 Testando pergunta: "${pergunta}"`)
  console.log('=' .repeat(60))
  
  const inicio = Date.now()
  
  try {
    const response = await fetch('http://localhost:3000/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pergunta })
    })
    
    const tempoTotal = Date.now() - inicio
    
    if (!response.ok) {
      console.error(`❌ Erro na requisição: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    
    console.log(`✅ Resposta recebida em ${tempoTotal}ms`)
    console.log('\n📋 Resposta:')
    console.log(data.data?.resposta || 'Sem resposta')
    
    if (data.data?.contexto) {
      console.log('\n📊 Contexto utilizado:')
      console.log(`  Tipo: ${data.data.contexto.tipo_resposta}`)
      console.log(`  Dados utilizados: ${JSON.stringify(data.data.contexto.dados_utilizados)}`)
    }
  } catch (error) {
    console.error(`❌ Erro ao testar pergunta:`, error.message)
  }
}

// Testar várias perguntas sobre pedidos
const testarPerguntas = async () => {
  console.log('🧪 Iniciando testes do assistente de IA com perguntas sobre pedidos')
  console.log('=' .repeat(60))
  
  const perguntas = [
    'qual foi o último pedido de limpador de piso?',
    'quais foram os últimos pedidos?',
    'qual pedido foi feito para o fornecedor ABC?',
    'quais pedidos incluem álcool?',
    'qual o saldo de alcool?',  // Pergunta de produto para comparação
  ]
  
  for (const pergunta of perguntas) {
    await testarPerguntaSobrePedidos(pergunta)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo entre testes
  }
  
  console.log('\n✅ Testes concluídos!')
}

// Executar testes
testarPerguntas()
