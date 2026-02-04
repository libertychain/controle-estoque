// Test script for LLM API integration
const http = require('http');

const testData = {
  pergunta: "Olá! Responda apenas com 'OK' se você estiver funcionando.",
  contexto: ""
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/llm/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing LLM API...');
console.log('Request:', JSON.stringify(testData, null, 2));

const req = http.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('\nParsed Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('\n✅ SUCCESS: LLM API is working correctly!');
        process.exit(0);
      } else {
        console.log('\n❌ FAILED: LLM API returned an error');
        console.log('Error:', parsed.error);
        process.exit(1);
      }
    } catch (e) {
      console.log('\n❌ FAILED: Could not parse response as JSON');
      console.log('Error:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error(`\n❌ FAILED: Request error: ${error.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
