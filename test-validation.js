const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testValidation() {
  // Teste 1: Email inválido
  console.log('Teste 1: Email inválido');
  const result1 = await makeRequest('POST', '/api/fornecedores', {
    codigo: 'TEST4',
    nome: 'Teste',
    email: 'email-invalido'
  });
  console.log('Status:', result1.statusCode);
  console.log('Response:', JSON.stringify(result1.data, null, 2));
  console.log();

  // Teste 2: CNPJ inválido
  console.log('Teste 2: CNPJ inválido');
  const result2 = await makeRequest('POST', '/api/fornecedores', {
    codigo: 'TEST5',
    nome: 'Teste',
    cnpj: '12345678000190'
  });
  console.log('Status:', result2.statusCode);
  console.log('Response:', JSON.stringify(result2.data, null, 2));
  console.log();

  // Teste 3: HTML malicioso com CNPJ válido
  console.log('Teste 3: HTML malicioso com CNPJ válido');
  const result3 = await makeRequest('POST', '/api/fornecedores', {
    codigo: 'TEST6',
    nome: '<script>alert("xss")</script>',
    cnpj: '11222333000181'
  });
  console.log('Status:', result3.statusCode);
  console.log('Response:', JSON.stringify(result3.data, null, 2));
  console.log();

  // Teste 4: String muito longa
  console.log('Teste 4: String muito longa');
  const longString = 'A'.repeat(100);
  const result4 = await makeRequest('POST', '/api/aquisicoes', {
    numero_proc: longString,
    modalidade: 'Teste',
    fornecedor_id: 1
  });
  console.log('Status:', result4.statusCode);
  console.log('Response:', JSON.stringify(result4.data, null, 2));
}

testValidation().catch(console.error);
