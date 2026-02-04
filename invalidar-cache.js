(async () => {
  try {
    console.log('🔄 Invalidando cache de estoque...\n');
    
    const response = await fetch('http://localhost:3000/api/estoque/invalidar-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Cache de estoque invalidado com sucesso!\n');
      console.log('📊 O assistente de IA agora poderá encontrar os novos produtos migrados.\n');
    } else {
      console.log('❌ Erro ao invalidar cache:', data.error.message);
    }
  } catch (error) {
    console.error('❌ Erro ao invalidar cache:', error);
  }
})();
