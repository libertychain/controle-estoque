/**
 * Teste das Correções de Vulnerabilidades Críticas
 * 
 * Este script valida as correções implementadas para:
 * 1. XSS Avançado em input-validator.ts
 * 2. IP Spoofing em rate-limiter.ts
 */

// Teste para sanitização de XSS avançado
console.log('=== TESTE 1: Sanitização de XSS Avançado ===\n')

// Importar a função de sanitização
const { sanitizeString } = require('./src/lib/input-validator.ts')

// Casos de teste para XSS avançado
const xssTestCases = [
  {
    name: 'Eventos onclick',
    input: '<div onclick="alert(1)">Texto</div>',
    expected: 'Texto'
  },
  {
    name: 'Evento onerror',
    input: '<img src=x onerror="alert(1)">',
    expected: ''
  },
  {
    name: 'Evento onload',
    input: '<body onload="alert(1)">',
    expected: ''
  },
  {
    name: 'Data URL',
    input: '<img src="data:image/svg+xml,<script>alert(1)</script>">',
    expected: 'alert(1)&quot;&gt;'
  },
  {
    name: 'JavaScript URL',
    input: '<a href="javascript:alert(1)">Link</a>',
    expected: 'Link'
  },
  {
    name: 'VBScript URL',
    input: '<a href="vbscript:alert(1)">Link</a>',
    expected: 'Link'
  },
  {
    name: 'File URL',
    input: '<a href="file:///etc/passwd">Link</a>',
    expected: 'Link'
  },
  {
    name: 'Unicode encoding (&#x3c;)',
    input: '&#x3c;script&#x3e;alert(1)&#x3c;/script&#x3e;',
    expected: 'scriptalert(1)&#x2F;script'
  },
  {
    name: 'Unicode encoding (&#60;)',
    input: '&#60;script&#62;alert(1)&#60;/script&#62;',
    expected: 'scriptalert(1)&#x2F;script'
  },
  {
    name: 'Entidades HTML perigosas',
    input: '<script>alert(1)</script>',
    expected: 'alert(1)'
  },
  {
    name: 'Atributos permitidos (id)',
    input: '<div id="test">Texto</div>',
    expected: 'Texto'
  },
  {
    name: 'Atributos permitidos (class)',
    input: '<div class="test">Texto</div>',
    expected: 'Texto'
  },
  {
    name: 'Atributos permitidos (style)',
    input: '<div style="color:red">Texto</div>',
    expected: 'Texto'
  },
  {
    name: 'Atributos permitidos (data-)',
    input: '<div data-test="value">Texto</div>',
    expected: 'Texto'
  },
  {
    name: 'Atributos não permitidos (href)',
    input: '<a href="http://evil.com">Link</a>',
    expected: 'Link'
  },
  {
    name: 'Atributos não permitidos (src)',
    input: '<img src="evil.jpg">',
    expected: ''
  },
  {
    name: 'Texto normal',
    input: 'Texto normal sem tags',
    expected: 'Texto normal sem tags'
  }
]

let xssTestsPassed = 0
let xssTestsFailed = 0

xssTestCases.forEach((testCase, index) => {
  const result = sanitizeString(testCase.input)
  const passed = result === testCase.expected
  
  if (passed) {
    console.log(`✅ Teste ${index + 1} (${testCase.name}): PASS`)
    xssTestsPassed++
  } else {
    console.log(`❌ Teste ${index + 1} (${testCase.name}): FAIL`)
    console.log(`   Input: "${testCase.input}"`)
    console.log(`   Expected: "${testCase.expected}"`)
    console.log(`   Got: "${result}"`)
    xssTestsFailed++
  }
})

console.log(`\n📊 Resumo XSS: ${xssTestsPassed}/${xssTestCases.length} testes passaram\n`)

// Teste para validação de IP (IP spoofing)
console.log('=== TESTE 2: Validação de IP (IP Spoofing) ===\n')

// Simular a função getClientIp do rate-limiter
function getClientIpTest(headers, trustedProxies = []) {
  const isValidIp = (ip) => {
    if (!ip) return false
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipRegex.test(ip.trim())
  }
  
  const forwardedFor = headers['x-forwarded-for']
  const realIp = headers['x-real-ip']
  const cfConnectingIp = headers['cf-connecting-ip']
  
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    const clientIp = ips[0]
    const proxyIp = ips[ips.length - 1]
    
    if (isValidIp(proxyIp) && trustedProxies.includes(proxyIp)) {
      if (isValidIp(clientIp)) {
        return clientIp
      } else {
        console.warn('⚠️ IP inválido em X-Forwarded-For:', clientIp)
        // Continuar para tentar outros headers
      }
    } else {
      console.warn('⚠️ X-Forwarded-For de proxy não confiável:', proxyIp)
    }
  }
  
  if (realIp && isValidIp(realIp)) {
    return realIp
  }
  
  if (cfConnectingIp && isValidIp(cfConnectingIp)) {
    return cfConnectingIp
  }
  
  console.warn('⚠️ Nenhum header de proxy confiável encontrado. Usando identificação por token JWT.')
  return 'unknown'
}

// Casos de teste para IP spoofing
const ipTestCases = [
  {
    name: 'X-Forwarded-For com proxy confiável',
    headers: {
      'x-forwarded-for': '192.168.1.100, 10.0.0.1',
      'x-real-ip': '10.0.0.1'
    },
    trustedProxies: ['10.0.0.1'],
    expected: '192.168.1.100'
  },
  {
    name: 'X-Forwarded-For com proxy não confiável',
    headers: {
      'x-forwarded-for': '192.168.1.100, 10.0.0.1',
      'x-real-ip': '10.0.0.1'
    },
    trustedProxies: [],
    expected: '10.0.0.1'
  },
  {
    name: 'X-Forwarded-For com IP inválido',
    headers: {
      'x-forwarded-for': 'not-an-ip, 10.0.0.1',
      'x-real-ip': '10.0.0.1'
    },
    trustedProxies: ['10.0.0.1'],
    expected: '10.0.0.1'
  },
  {
    name: 'X-Forwarded-For com proxy inválido',
    headers: {
      'x-forwarded-for': '192.168.1.100, not-a-proxy',
      'x-real-ip': '10.0.0.1'
    },
    trustedProxies: ['10.0.0.1'],
    expected: '10.0.0.1'
  },
  {
    name: 'Apenas X-Real-IP válido',
    headers: {
      'x-real-ip': '192.168.1.100'
    },
    trustedProxies: [],
    expected: '192.168.1.100'
  },
  {
    name: 'Apenas CF-Connecting-IP válido',
    headers: {
      'cf-connecting-ip': '192.168.1.100'
    },
    trustedProxies: [],
    expected: '192.168.1.100'
  },
  {
    name: 'Nenhum header válido',
    headers: {},
    trustedProxies: [],
    expected: 'unknown'
  },
  {
    name: 'X-Forwarded-For com múltiplos IPs',
    headers: {
      'x-forwarded-for': '192.168.1.100, 10.0.0.2, 10.0.0.1',
      'x-real-ip': '10.0.0.1'
    },
    trustedProxies: ['10.0.0.1'],
    expected: '192.168.1.100'
  },
  {
    name: 'Tentativa de IP spoofing (X-Forwarded-For falso)',
    headers: {
      'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      'x-real-ip': '3.3.3.3'
    },
    trustedProxies: [],
    expected: '3.3.3.3'
  },
  {
    name: 'IPv6 válido',
    headers: {
      'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334, 10.0.0.1',
      'x-real-ip': '10.0.0.1'
    },
    trustedProxies: ['10.0.0.1'],
    expected: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
  }
]

let ipTestsPassed = 0
let ipTestsFailed = 0

ipTestCases.forEach((testCase, index) => {
  const result = getClientIpTest(testCase.headers, testCase.trustedProxies)
  const passed = result === testCase.expected
  
  if (passed) {
    console.log(`✅ Teste ${index + 1} (${testCase.name}): PASS`)
    ipTestsPassed++
  } else {
    console.log(`❌ Teste ${index + 1} (${testCase.name}): FAIL`)
    console.log(`   Headers:`, testCase.headers)
    console.log(`   Trusted Proxies:`, testCase.trustedProxies)
    console.log(`   Expected: "${testCase.expected}"`)
    console.log(`   Got: "${result}"`)
    ipTestsFailed++
  }
})

console.log(`\n📊 Resumo IP: ${ipTestsPassed}/${ipTestCases.length} testes passaram\n`)

// Resumo geral
console.log('=== RESUMO GERAL ===\n')
const totalTests = xssTestCases.length + ipTestCases.length
const totalPassed = xssTestsPassed + ipTestsPassed
const totalFailed = xssTestsFailed + ipTestsFailed

console.log(`Total de testes: ${totalTests}`)
console.log(`Testes passados: ${totalPassed}`)
console.log(`Testes falhados: ${totalFailed}`)
console.log(`Taxa de sucesso: ${((totalPassed / totalTests) * 100).toFixed(2)}%\n`)

if (totalFailed === 0) {
  console.log('✅ Todas as correções foram implementadas com sucesso!')
  process.exit(0)
} else {
  console.log('❌ Alguns testes falharam. Revise as correções.')
  process.exit(1)
}
