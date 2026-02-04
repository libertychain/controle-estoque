const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: Check product balance before creating order
async function test1_checkProductBalance() {
  console.log('\n=== TESTE 1: Verificar saldo do produto antes de criar pedido ===');
  
  const { status, data } = await request(`${BASE_URL}/api/estoque/produtos`);
  if (status !== 200) {
    console.error('❌ Erro ao buscar produtos:', data);
    return null;
  }
  
  const product = data.data.produtos.find(p => p.codigo === 'PAQ-41');
  if (!product) {
    console.error('❌ Produto PAQ-41 não encontrado');
    return null;
  }
  
  console.log(`✅ Produto encontrado: ${product.descricao}`);
  console.log(`   ID: ${product.id}`);
  console.log(`   Código: ${product.codigo}`);
  console.log(`   Saldo atual: ${product.saldo_atual}`);
  
  return product;
}

// Test 2: Create order
async function test2_createOrder() {
  console.log('\n=== TESTE 2: Criar pedido ===');
  
  const orderData = {
    secretaria_id: 2, // Secretaria de Saúde
    setor_id: 5, // Departamento de Nutrição
    observacoes: 'Teste de atualização de estoque',
    pedidos_por_fornecedor: [
      {
        fornecedor_id: 3, // Limpeza Total Distribuidora
        itens: [
          {
            produto_aquisicao_id: 41, // Sabão em Pó 500g
            quantidade: 5,
            observacao: 'Teste de estoque'
          }
        ]
      }
    ]
  };
  
  console.log('Enviando pedido:', JSON.stringify(orderData, null, 2));
  
  const { status, data } = await request(`${BASE_URL}/api/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  if (status !== 201) {
    console.error('❌ Erro ao criar pedido:', data);
    return null;
  }
  
  console.log('✅ Pedido criado com sucesso!');
  console.log(`   Número de pedidos criados: ${data.data.total}`);
  console.log(`   Pedidos: ${JSON.stringify(data.data.pedidos.map(p => ({ id: p.id, numero: p.numero })), null, 2)}`);
  
  // Return the first order created
  return data.data.pedidos[0];
}

// Test 3: Check product balance after creating order
async function test3_checkProductBalanceAfterCreation(productId, orderId) {
  console.log('\n=== TESTE 3: Verificar saldo do produto após criar pedido ===');
  
  const { status, data } = await request(`${BASE_URL}/api/estoque/produtos`);
  if (status !== 200) {
    console.error('❌ Erro ao buscar produtos:', data);
    return null;
  }
  
  const product = data.data.produtos.find(p => p.id === productId);
  if (!product) {
    console.error('❌ Produto não encontrado');
    return null;
  }
  
  console.log(`✅ Produto encontrado: ${product.descricao}`);
  console.log(`   Saldo atual: ${product.saldo_atual}`);
  
  // Check stock movements
  const { status: movStatus, data: movData } = await request(`${BASE_URL}/api/estoque/movimentacoes?produto_id=${productId}`);
  if (movStatus === 200) {
    console.log(`   Movimentações de estoque: ${movData.data.movimentacoes.length}`);
    const recentMovements = movData.data.movimentacoes.filter(m => m.observacao.includes(orderId.toString()) || m.observacao.includes('PED-'));
    console.log(`   Movimentações recentes: ${recentMovements.length}`);
    recentMovements.forEach(m => {
      console.log(`     - Tipo: ${m.tipo}, Quantidade: ${m.quantidade}, Saldo anterior: ${m.saldo_anterior}, Saldo novo: ${m.saldo_novo}`);
    });
  }
  
  return product;
}

// Test 4: Update order (increase quantity)
async function test4_updateOrderIncrease(orderId) {
  console.log('\n=== TESTE 4: Editar pedido (aumentar quantidade) ===');
  
  // First, get current order
  const { status: getStatus, data: getData } = await request(`${BASE_URL}/api/pedidos/${orderId}`);
  if (getStatus !== 200) {
    console.error('❌ Erro ao buscar pedido:', getData);
    return null;
  }
  
  const currentOrder = getData.data.pedido;
  console.log(`Pedido atual: ${currentOrder.numero}`);
  console.log(`Itens: ${JSON.stringify(currentOrder.itens, null, 2)}`);
  
  // Update first item quantity
  const updateData = {
    itens: currentOrder.itens.map(item => ({
      produto_aquisicao_id: 41, // Use the same produto_aquisicao_id
      quantidade: item.quantidade + 3, // Increase by 3
      observacao: item.observacao
    }))
  };
  
  console.log('Enviando atualização:', JSON.stringify(updateData, null, 2));
  
  const { status, data } = await request(`${BASE_URL}/api/pedidos/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  if (status !== 200) {
    console.error('❌ Erro ao atualizar pedido:', data);
    return null;
  }
  
  console.log('✅ Pedido atualizado com sucesso!');
  console.log(`   Pedido: ${data.data.numero}`);
  console.log(`   Itens: ${JSON.stringify(data.data.itens, null, 2)}`);
  
  return data.data;
}

// Test 5: Check product balance after increasing quantity
async function test5_checkProductBalanceAfterIncrease(productId, orderId) {
  console.log('\n=== TESTE 5: Verificar saldo do produto após aumentar quantidade ===');
  
  const { status, data } = await request(`${BASE_URL}/api/estoque/produtos`);
  if (status !== 200) {
    console.error('❌ Erro ao buscar produtos:', data);
    return null;
  }
  
  const product = data.data.produtos.find(p => p.id === productId);
  if (!product) {
    console.error('❌ Produto não encontrado');
    return null;
  }
  
  console.log(`✅ Produto encontrado: ${product.descricao}`);
  console.log(`   Saldo atual: ${product.saldo_atual}`);
  
  // Check stock movements
  const { status: movStatus, data: movData } = await request(`${BASE_URL}/api/estoque/movimentacoes?produto_id=${productId}`);
  if (movStatus === 200) {
    const recentMovements = movData.data.movimentacoes.filter(m => m.observacao.includes(orderId.toString()) || m.observacao.includes('PED-'));
    console.log(`   Movimentações recentes: ${recentMovements.length}`);
    recentMovements.forEach(m => {
      console.log(`     - Tipo: ${m.tipo}, Quantidade: ${m.quantidade}, Saldo anterior: ${m.saldo_anterior}, Saldo novo: ${m.saldo_novo}`);
    });
  }
  
  return product;
}

// Test 6: Update order (decrease quantity)
async function test6_updateOrderDecrease(orderId) {
  console.log('\n=== TESTE 6: Editar pedido (diminuir quantidade) ===');
  
  // First, get current order
  const { status: getStatus, data: getData } = await request(`${BASE_URL}/api/pedidos/${orderId}`);
  if (getStatus !== 200) {
    console.error('❌ Erro ao buscar pedido:', getData);
    return null;
  }
  
  const currentOrder = getData.data.pedido;
  console.log(`Pedido atual: ${currentOrder.numero}`);
  console.log(`Itens: ${JSON.stringify(currentOrder.itens, null, 2)}`);
  
  // Update first item quantity (decrease by 2)
  const updateData = {
    itens: currentOrder.itens.map(item => ({
      produto_aquisicao_id: 41, // Use the same produto_aquisicao_id
      quantidade: Math.max(1, item.quantidade - 2), // Decrease by 2, minimum 1
      observacao: item.observacao
    }))
  };
  
  console.log('Enviando atualização:', JSON.stringify(updateData, null, 2));
  
  const { status, data } = await request(`${BASE_URL}/api/pedidos/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  if (status !== 200) {
    console.error('❌ Erro ao atualizar pedido:', data);
    return null;
  }
  
  console.log('✅ Pedido atualizado com sucesso!');
  console.log(`   Pedido: ${data.data.numero}`);
  console.log(`   Itens: ${JSON.stringify(data.data.itens, null, 2)}`);
  
  return data.data;
}

// Test 7: Check product balance after decreasing quantity
async function test7_checkProductBalanceAfterDecrease(productId, orderId) {
  console.log('\n=== TESTE 7: Verificar saldo do produto após diminuir quantidade ===');
  
  const { status, data } = await request(`${BASE_URL}/api/estoque/produtos`);
  if (status !== 200) {
    console.error('❌ Erro ao buscar produtos:', data);
    return null;
  }
  
  const product = data.data.produtos.find(p => p.id === productId);
  if (!product) {
    console.error('❌ Produto não encontrado');
    return null;
  }
  
  console.log(`✅ Produto encontrado: ${product.descricao}`);
  console.log(`   Saldo atual: ${product.saldo_atual}`);
  
  // Check stock movements
  const { status: movStatus, data: movData } = await request(`${BASE_URL}/api/estoque/movimentacoes?produto_id=${productId}`);
  if (movStatus === 200) {
    const recentMovements = movData.data.movimentacoes.filter(m => m.observacao.includes(orderId.toString()) || m.observacao.includes('PED-'));
    console.log(`   Movimentações recentes: ${recentMovements.length}`);
    recentMovements.forEach(m => {
      console.log(`     - Tipo: ${m.tipo}, Quantidade: ${m.quantidade}, Saldo anterior: ${m.saldo_anterior}, Saldo novo: ${m.saldo_novo}`);
    });
  }
  
  return product;
}

// Test 8: Delete order
async function test8_deleteOrder(orderId) {
  console.log('\n=== TESTE 8: Excluir pedido ===');
  
  console.log(`Excluindo pedido ID: ${orderId}`);
  
  const { status, data } = await request(`${BASE_URL}/api/pedidos/${orderId}`, {
    method: 'DELETE'
  });
  
  if (status !== 200) {
    console.error('❌ Erro ao excluir pedido:', data);
    return null;
  }
  
  console.log('✅ Pedido excluído com sucesso!');
  console.log(`   Mensagem: ${data.message}`);
  
  return data.data;
}

// Test 9: Check product balance after deleting order
async function test9_checkProductBalanceAfterDeletion(productId, orderId) {
  console.log('\n=== TESTE 9: Verificar saldo do produto após excluir pedido ===');
  
  const { status, data } = await request(`${BASE_URL}/api/estoque/produtos`);
  if (status !== 200) {
    console.error('❌ Erro ao buscar produtos:', data);
    return null;
  }
  
  const product = data.data.produtos.find(p => p.id === productId);
  if (!product) {
    console.error('❌ Produto não encontrado');
    return null;
  }
  
  console.log(`✅ Produto encontrado: ${product.descricao}`);
  console.log(`   Saldo atual: ${product.saldo_atual}`);
  
  // Check stock movements
  const { status: movStatus, data: movData } = await request(`${BASE_URL}/api/estoque/movimentacoes?produto_id=${productId}`);
  if (movStatus === 200) {
    const recentMovements = movData.data.movimentacoes.filter(m => m.observacao.includes(orderId.toString()) || m.observacao.includes('PED-'));
    console.log(`   Movimentações recentes: ${recentMovements.length}`);
    recentMovements.forEach(m => {
      console.log(`     - Tipo: ${m.tipo}, Quantidade: ${m.quantidade}, Saldo anterior: ${m.saldo_anterior}, Saldo novo: ${m.saldo_novo}`);
    });
  }
  
  return product;
}

// Main test function
async function runTests() {
  console.log('========================================');
  console.log('INICIANDO TESTES DE ATUALIZAÇÃO DE ESTOQUE');
  console.log('========================================');
  
  try {
    // Test 1: Check product balance before creating order
    const product = await test1_checkProductBalance();
    if (!product) {
      console.error('❌ Teste 1 falhou. Abortando testes.');
      return;
    }
    
    // Test 2: Create order
    const order = await test2_createOrder();
    if (!order) {
      console.error('❌ Teste 2 falhou. Abortando testes.');
      return;
    }
    
    // Test 3: Check product balance after creating order
    const productAfterCreation = await test3_checkProductBalanceAfterCreation(product.id, order.numero);
    if (!productAfterCreation) {
      console.error('❌ Teste 3 falhou. Abortando testes.');
      return;
    }
    
    // Verify balance decreased
    const expectedBalanceAfterCreation = product.saldo_atual - 5;
    if (productAfterCreation.saldo_atual === expectedBalanceAfterCreation) {
      console.log(`✅ Saldo atualizado corretamente: ${product.saldo_atual} - 5 = ${productAfterCreation.saldo_atual}`);
    } else {
      console.error(`❌ Saldo incorreto: esperado ${expectedBalanceAfterCreation}, obtido ${productAfterCreation.saldo_atual}`);
    }
    
    // Test 4: Update order (increase quantity)
    const updatedOrder = await test4_updateOrderIncrease(order.id);
    if (!updatedOrder) {
      console.error('❌ Teste 4 falhou. Abortando testes.');
      return;
    }
    
    // Test 5: Check product balance after increasing quantity
    const productAfterIncrease = await test5_checkProductBalanceAfterIncrease(product.id, order.numero);
    if (!productAfterIncrease) {
      console.error('❌ Teste 5 falhou. Abortando testes.');
      return;
    }
    
    // Verify balance decreased further
    const expectedBalanceAfterIncrease = expectedBalanceAfterCreation - 3;
    if (productAfterIncrease.saldo_atual === expectedBalanceAfterIncrease) {
      console.log(`✅ Saldo atualizado corretamente: ${expectedBalanceAfterCreation} - 3 = ${productAfterIncrease.saldo_atual}`);
    } else {
      console.error(`❌ Saldo incorreto: esperado ${expectedBalanceAfterIncrease}, obtido ${productAfterIncrease.saldo_atual}`);
    }
    
    // Test 6: Update order (decrease quantity)
    const decreasedOrder = await test6_updateOrderDecrease(order.id);
    if (!decreasedOrder) {
      console.error('❌ Teste 6 falhou. Abortando testes.');
      return;
    }
    
    // Test 7: Check product balance after decreasing quantity
    const productAfterDecrease = await test7_checkProductBalanceAfterDecrease(product.id, order.numero);
    if (!productAfterDecrease) {
      console.error('❌ Teste 7 falhou. Abortando testes.');
      return;
    }
    
    // Verify balance increased (stock returned)
    const expectedBalanceAfterDecrease = expectedBalanceAfterIncrease + 2;
    if (productAfterDecrease.saldo_atual === expectedBalanceAfterDecrease) {
      console.log(`✅ Saldo atualizado corretamente: ${expectedBalanceAfterIncrease} + 2 = ${productAfterDecrease.saldo_atual}`);
    } else {
      console.error(`❌ Saldo incorreto: esperado ${expectedBalanceAfterDecrease}, obtido ${productAfterDecrease.saldo_atual}`);
    }
    
    // Test 8: Delete order
    const deletedOrder = await test8_deleteOrder(order.id);
    if (!deletedOrder) {
      console.error('❌ Teste 8 falhou. Abortando testes.');
      return;
    }
    
    // Test 9: Check product balance after deleting order
    const productAfterDeletion = await test9_checkProductBalanceAfterDeletion(product.id, order.numero);
    if (!productAfterDeletion) {
      console.error('❌ Teste 9 falhou. Abortando testes.');
      return;
    }
    
    // Verify balance returned to original
    if (productAfterDeletion.saldo_atual === product.saldo_atual) {
      console.log(`✅ Saldo restaurado corretamente: ${product.saldo_atual}`);
    } else {
      console.error(`❌ Saldo incorreto: esperado ${product.saldo_atual}, obtido ${productAfterDeletion.saldo_atual}`);
    }
    
    console.log('\n========================================');
    console.log('TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Run tests
runTests();
