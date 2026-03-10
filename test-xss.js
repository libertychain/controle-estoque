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

async function testXSS() {
  const result = await makeRequest('POST', '/api/fornecedores', {
    codigo: `TEST-XSS-${Date.now()}`,
    nome: '<script>alert("xss")</script>',
    cnpj: '11222333000181'
  });
  
  console.log('Status:', result.statusCode);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.statusCode === 201) {
    const nome = result.data.data.fornecedor.nome;
    console.log('\nNome retornado:', nome);
    console.log('Contém <script>?', nome.includes('<script>'));
    console.log('Contém <?', nome.includes('<'));
    console.log('Contém &#x', nome.includes('&#x'));
  }
}

testXSS().catch(console.error);
