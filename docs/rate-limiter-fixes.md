# Correções do Rate Limiter - Documentação

## Resumo das Correções

Este documento descreve as correções críticas implementadas no rate limiter para torná-lo seguro para ambientes de produção.

## Problemas Corrigidos

### 1. Rate Limiter em Memória Sem Redis (CORRIGIDO)

**Problema Original:**
- O rate limiter usava armazenamento em memória como fallback quando Redis não estava configurado
- Em ambientes distribuídos/multi-instância, cada instância teria seu próprio store
- Atacantes poderiam contornar o rate limitando redirecionando requisições para diferentes instâncias

**Solução Implementada (Opção A - Recomendada):**
- ✅ **Redis tornou-se OBRIGATÓRIO** para ambientes de produção
- ✅ Removido o fallback em memória do rate limiter principal
- ✅ Adicionação de função [`rateLimitLocal()`](../src/lib/rate-limiter.ts:474) para desenvolvimento sem Redis
- ✅ Mensagens de erro claras quando Redis não está configurado
- ✅ Status 503 (Service Unavailable) quando rate limiting não está configurado

**Impacto:**
- **Segurança:** Atacantes não podem mais contornar o rate limitando múltiplas instâncias
- **Produção:** Rate limiting distribuído funcional em ambientes com múltiplas instâncias
- **Desenvolvimento:** Função [`rateLimitLocal()`](../src/lib/rate-limiter.ts:474) disponível para ambientes sem Redis

**Requisitos para Produção:**
```bash
# Instalar ioredis
npm install ioredis

# Configurar no arquivo .env
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua-chave-secreta-aqui
```

---

### 2. Fingerprint de Headers Inseguro (CORRIGIDO)

**Problema Original:**
- Quando não era possível determinar o IP, o sistema gerava um fingerprint baseado em headers (user-agent, accept, accept-language, accept-encoding)
- Este fingerprint podia ser facilmente manipulado por atacantes
- Headers podem ser falsificados, permitindo bypass do rate limiting

**Solução Implementada:**
- ✅ **Prioridade 1: JWT Token** (via header `Authorization: Bearer <token>`)
- ✅ **Prioridade 2: Cookie de Sessão** (`auth-token` cookie)
- ✅ **Prioridade 3: IP do Cliente** (via X-Forwarded-For ou X-Real-IP)
- ✅ **Prioridade 4: Fingerprint** (último recurso, menos seguro)
- ✅ **Opção `requireAuth: true`** para endpoints que exigem autenticação

**Implementação:**

#### Funções de Extração de Identificador

```typescript
// Extrai JWT token do header Authorization
function extractJwtToken(request: NextRequest): string | null

// Extrai token de sessão do cookie
function extractSessionToken(request: NextRequest): string | null

// Obtém identificador do cliente com prioridade definida
function getClientIdentifier(request: NextRequest): string
```

#### Exemplo de Uso com Autenticação

```typescript
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  maxRequests: 5,
  message: 'Muitas tentativas de autenticação.',
  requireAuth: true  // Exige JWT token
})
```

**Impacto:**
- **Segurança:** Fingerprint de headers não mais usado como identificador principal
- **Autenticação:** JWT tokens e cookies de sessão são identificadores mais robustos
- **Bypass:** Atacantes não podem mais facilmente falsificar headers para contornar rate limiting
- **Compliance:** Atendem a melhores práticas de segurança

---

## Estrutura do Rate Limiter

### Configuração

```typescript
interface RateLimitConfig {
  windowMs: number      // Janela de tempo em milissegundos
  maxRequests: number    // Número máximo de requisições na janela
  message?: string      // Mensagem de erro customizada
  requireAuth?: boolean  // Se true, exige autenticação JWT
}
```

### Rate Limiters Disponíveis

#### 1. [`authRateLimiter`](../src/lib/rate-limiter.ts:537)
- **Uso:** Autenticação/login
- **Limite:** 5 tentativas por 15 minutos
- **Requer Autenticação:** ✅ Sim (JWT obrigatório)

```typescript
import { authRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await authRateLimiter(request)
  if (rateLimitResponse) {
    return rateLimitResponse  // Retorna 429 se excedido
  }
  // Processar autenticação...
}
```

#### 2. [`apiRateLimiter`](../src/lib/rate-limiter.ts:547)
- **Uso:** APIs gerais
- **Limite:** 100 requisições por 15 minutos
- **Requer Autenticação:** ❌ Não

```typescript
import { apiRateLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await apiRateLimiter(request)
  if (rateLimitResponse) {
    return rateLimitResponse  // Retorna 429 se excedido
  }
  // Processar requisição...
}
```

#### 3. [`llmChatRateLimiter`](../src/lib/rate-limiter.ts:557)
- **Uso:** Chat LLM
- **Limite:** 20 requisições por minuto
- **Requer Autenticação:** ❌ Não

```typescript
import { llmChatRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await llmChatRateLimiter(request)
  if (rateLimitResponse) {
    return rateLimitResponse  // Retorna 429 se excedido
  }
  // Processar chat LLM...
}
```

#### 4. [`rateLimitLocal()`](../src/lib/rate-limiter.ts:474)
- **Uso:** Desenvolvimento sem Redis
- **Limite:** 100 requisições por 15 minutos
- **Requer Autenticação:** ❌ Não
- **⚠️ ATENÇÃO:** Não use em produção com múltiplas instâncias!

```typescript
import { rateLimitLocal } from '@/lib/rate-limiter'

// Usar em desenvolvimento
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimitLocal({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  })(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  // Processar requisição...
}
```

---

## Headers de Resposta

Quando uma requisição é limitada (status 429), o rate limiter retorna os seguintes headers:

```
Retry-After: <segundos>
X-RateLimit-Limit: <limite>
X-RateLimit-Remaining: <restante>
X-RateLimit-Reset: <timestamp ISO>
```

**Exemplo de Resposta:**

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Muitas requisições. Tente novamente em 15 minutos.",
    "retryAfter": 847
  }
}
```

---

## Configuração de Ambiente

### .env (Requisitos para Produção)

```bash
# Redis para rate limiting distribuído
REDIS_URL=redis://localhost:6379

# JWT para autenticação (se requireAuth=true)
JWT_SECRET=sua-chave-secreta-muito-complexa-aqui

# Opcional: Configurações adicionais
NODE_ENV=production
```

### Instalação de Dependências

```bash
npm install ioredis jsonwebtoken
```

---

## Melhores Práticas

### 1. Para Autenticação
```typescript
// Sempre use authRateLimiter para endpoints de autenticação
export async function POST(request: NextRequest) {
  const response = await authRateLimiter(request)
  if (response) return response
  
  // Validar credenciais...
}
```

### 2. Para APIs Públicas
```typescript
// Use apiRateLimiter para APIs sem autenticação
export async function GET(request: NextRequest) {
  const response = await apiRateLimiter(request)
  if (response) return response
  
  // Processar requisição...
}
```

### 3. Para APIs Protegidas
```typescript
// Combine rate limiting com autenticação
export async function POST(request: NextRequest) {
  // Verificar autenticação primeiro
  const authResponse = await authRateLimiter(request)
  if (authResponse) return authResponse
  
  // Processar requisição autenticada...
}
```

### 4. Para Desenvolvimento
```typescript
// Use rateLimitLocal em ambientes de desenvolvimento
export async function GET(request: NextRequest) {
  const response = await rateLimitLocal({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  })(request)
  if (response) return response
  
  // Processar requisição...
}
```

---

## Testes de Segurança

### Teste 1: Bypass via Múltiplas Instâncias
**Antes:** ✗ Atacante poderia contornar rate limitando múltiplas instâncias
**Depois:** ✓ Redis compartilha o estado entre todas as instâncias

### Teste 2: Manipulação de Headers
**Antes:** ✗ Atacante podia falsificar headers para bypass
**Depois:** ✓ JWT tokens e cookies de sessão são identificadores mais robustos

### Teste 3: Rate Limiter em Produção
**Antes:** ✗ Fallback em memória permitia bypass
**Depois:** ✓ Redis obrigatório previne bypass em ambientes distribuídos

---

## Migração para Produção

### Passo 1: Instalar Dependências
```bash
npm install ioredis jsonwebtoken
```

### Passo 2: Configurar Redis
```bash
# Usar Docker
docker run -d -p 6379:6379 redis:alpine

# Ou usar serviço gerenciado (Redis Cloud, Upstash, etc.)
```

### Passo 3: Configurar Variáveis de Ambiente
```bash
# .env
REDIS_URL=redis://localhost:6379
JWT_SECRET=gerar-uma-chave-secreta-complexa
```

### Passo 4: Verificar Configuração
```bash
# O servidor deve mostrar:
# ✅ Redis conectado para rate limiting distribuído
```

### Passo 5: Testar
```bash
# Testar rate limiting
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Deve retornar 429 após 5 tentativas
```

---

## Troubleshooting

### Problema: "Rate limiting não está configurado corretamente"
**Solução:** Configure REDIS_URL no arquivo .env

### Problema: "Autenticação necessária para acessar este endpoint"
**Solução:** Adicione JWT token no header Authorization para endpoints com `requireAuth: true`

### Problema: Rate limiter não funciona em múltiplas instâncias
**Solução:** Certifique-se de que todas as instâncias estão usando o mesmo Redis

### Problema: JWT token não é validado
**Solução:** Configure JWT_SECRET no arquivo .env

---

## Referências

- [Rate Limiting Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/RateLimiting)
- [Redis for Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiter/)
- [JWT Security](https://jwt.io/introduction)
- [OWASP Rate Limiting](https://owasp.org/www-community/attacks/Rate_limiting)

---

## Versão

- **Data:** 2026-03-08
- **Versão:** 2.0.0
- **Status:** Production Ready
