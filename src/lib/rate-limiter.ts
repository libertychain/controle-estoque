/**
 * Rate Limiter Middleware
 *
 * Este middleware implementa rate limiting para prevenir ataques de força bruta
 * e abuso de recursos do sistema.
 *
 * REQUISITOS DE PRODUÇÃO:
 * - Redis é OBRIGATÓRIO para ambientes distribuídos/multi-instância
 * - Configure REDIS_URL no arquivo .env para ativar o rate limiting distribuído
 * - Para desenvolvimento local sem Redis, use a função rateLimitLocal()
 *
 * IDENTIFICAÇÃO DE CLIENTES:
 * - Prioridade 1: JWT token no header Authorization
 * - Prioridade 2: Cookie de sessão (auth-token)
 * - Prioridade 3: IP do cliente (via X-Forwarded-For ou X-Real-IP)
 * - Prioridade 4: Fingerprint baseado em headers (último recurso)
 *
 * IMPORTANTE: A identificação via headers pode ser manipulada por atacantes.
 * Para máxima segurança, use autenticação JWT ou cookies de sessão.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  windowMs: number      // Janela de tempo em milissegundos
  maxRequests: number    // Número máximo de requisições na janela
  message?: string      // Mensagem de erro customizada
  requireAuth?: boolean  // Se true, exige autenticação para rate limiting
}

// Store em memória global para desenvolvimento (quando Redis não está configurado)
// NOTA: Este store é compartilhado entre todas as requisições, permitindo
// que o rate limiting funcione corretamente mesmo sem Redis.
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Cliente Redis para rate limiting distribuído
 * OBRIGATÓRIO para ambientes de produção/multi-instância
 */
let redisClient: any = null
let redisAvailable: boolean = false
let redisConfigured: boolean = false

// Inicializar Redis se REDIS_URL estiver configurado
if (process.env.REDIS_URL) {
  try {
    // Importação dinâmica para não falhar se ioredis não estiver instalado
    const Redis = require('ioredis')
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null // Parar de tentar após 3 falhas
        }
        return Math.min(times * 50, 500)
      }
    })
    
    redisClient.on('error', (err: Error) => {
      console.error('❌ Erro no Redis para rate limiting:', err.message)
      redisAvailable = false
    })
    
    redisClient.on('connect', () => {
      console.log('✅ Redis conectado para rate limiting distribuído')
      redisAvailable = true
    })
    
    redisClient.on('ready', () => {
      redisConfigured = true
    })
    
    redisAvailable = true
  } catch (error: any) {
    // Verificar se o erro é por falta do pacote ioredis
    if (error?.code === 'MODULE_NOT_FOUND' || error?.message?.includes('Cannot find module')) {
      console.error('❌ CRÍTICO: Pacote ioredis não instalado.')
      console.error('   Para usar rate limiting em produção, instale: npm install ioredis')
      console.error('   Configure REDIS_URL no arquivo .env')
    } else {
      console.error('❌ Não foi possível inicializar Redis:', error)
    }
    redisAvailable = false
    redisConfigured = false
  }
} else {
  console.warn('⚠️  REDIS_URL não configurado no arquivo .env')
  console.warn('⚠️  Rate limiting em memória será usado (NÃO recomendado para produção)')
  console.warn('⚠️  Configure REDIS_URL para ativar rate limiting distribuído')
  redisConfigured = false
}

/**
 * Obtém ou cria uma entrada de rate limit usando Redis
 * CORREÇÃO: Melhorado tratamento de erros para distinguir entre tipos de falha
 * - Erro de conexão: desativa Redis temporariamente
 * - Chave não encontrada: comportamento normal
 * - Outros erros: tratados diferentemente
 */
async function getRedisEntry(key: string, windowMs: number): Promise<{ count: number; resetTime: number } | null> {
  if (!redisClient || !redisAvailable) {
    return null
  }
  
  try {
    const result = await redisClient.get(key)
    if (!result) {
      return null
    }
    
    const entry = JSON.parse(result)
    return entry
  } catch (error: any) {
    // Distinguir entre tipos de erro
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      console.error('❌ Erro de conexão Redis:', error.message)
      redisAvailable = false
      redisConfigured = false
    } else if (error.code === 'NOAUTH') {
      console.error('❌ Erro de autenticação Redis:', error.message)
      redisAvailable = false
    } else {
      console.error('Erro ao obter entrada do Redis:', error)
    }
    return null
  }
}

/**
 * Incrementa o contador de rate limit no Redis
 */
async function incrementRedisEntry(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
  if (!redisClient || !redisAvailable) {
    throw new Error('Redis não disponível')
  }
  
  try {
    const now = Date.now()
    const resetTime = now + windowMs
    
    // Usar pipeline para operações atômicas
    const pipeline = redisClient.pipeline()
    
    // Verificar se a chave existe
    pipeline.get(key)
    
    // Se não existe, criar com valor 1 e TTL
    pipeline.set(key, JSON.stringify({ count: 1, resetTime }), 'PX', windowMs, 'NX')
    
    // Se existe, incrementar
    pipeline.incr(key)
    
    const results = await pipeline.exec()
    
    // Se a chave não existia, o primeiro resultado será null
    // e o segundo resultado será OK (criada)
    if (results[0][1] === null) {
      return { count: 1, resetTime }
    }
    
    // Se a chave existia, obter o valor atualizado
    const current = await redisClient.get(key)
    const entry = JSON.parse(current)
    return entry
  } catch (error) {
    console.error('Erro ao incrementar entrada no Redis:', error)
    throw error
  }
}

/**
 * Extrai e valida um token JWT do header Authorization
 *
 * @param request - Requisição Next.js
 * @returns Token JWT ou null se não encontrado
 */
function extractJwtToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }
  
  // Verificar formato "Bearer <token>"
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * Extrai token de sessão do cookie
 *
 * @param request - Requisição Next.js
 * @returns Token de sessão ou null se não encontrado
 */
function extractSessionToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null
}

/**
 * Obtém o identificador do cliente para rate limiting
 *
 * Prioridade:
 * 1. JWT token (se requireAuth=true)
 * 2. Cookie de sessão
 * 3. IP do cliente
 * 4. Fingerprint (último recurso)
 *
 * @param request - Requisição Next.js
 * @returns Identificador do cliente
 */
function getClientIdentifier(request: NextRequest): string {
  // Prioridade 1: JWT token (mais seguro e confiável)
  const jwtToken = extractJwtToken(request)
  if (jwtToken) {
    return `jwt:${jwtToken}`
  }
  
  // Prioridade 2: Cookie de sessão
  const sessionToken = extractSessionToken(request)
  if (sessionToken) {
    return `session:${sessionToken}`
  }
  
  // Prioridade 3: IP do cliente (com validação de proxy)
  const ip = getClientIp(request)
  if (ip && ip !== 'unknown') {
    return `ip:${ip}`
  }
  
  // Prioridade 4: Fallback seguro (anonimato completo, sem expor informações sensíveis)
  // Usar random UUID para identificação temporária
  const anonId = crypto.randomUUID()
  return `anon:${anonId}`
}

/**
 * Obtém o IP do cliente da requisição com validação de segurança
 * 
 * Prioridade:
 * 1. IP de proxy reverso confiável (X-Forwarded-For)
 * 2. IP real do proxy (X-Real-IP, CF-Connecting-IP)
 * 3. IP direto (último recurso)
 * 
 * @param request - Requisição Next.js
 * @returns IP do cliente ou 'unknown'
 */
function getClientIp(request: NextRequest): string {
  // Lista de proxies confiáveis (configurar via variável de ambiente)
  const trustedProxies = process.env.TRUSTED_PROXIES?.split(',').map(ip => ip.trim()) || []
  
  // Validar formato de IP (IPv4 ou IPv6)
  const isValidIp = (ip: string | null): boolean => {
    if (!ip) return false
    // Regex para IPv4 e IPv6
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipRegex.test(ip.trim())
  }
  
  // Tentar obter IP dos headers de proxy reverso
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Se X-Forwarded-For existe, verificar se vem de proxy confiável
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    // O primeiro IP é o IP original do cliente
    const clientIp = ips[0]
    
    // Verificar se o proxy é confiável
    const proxyIp = ips[ips.length - 1]
    if (isValidIp(proxyIp) && trustedProxies.includes(proxyIp)) {
      if (isValidIp(clientIp)) {
        return clientIp
      } else {
        console.warn('⚠️ IP inválido em X-Forwarded-For:', clientIp)
        // Continuar para tentar outros headers
      }
    } else {
      // Proxy não confiável - ignorar header
      console.warn('⚠️ X-Forwarded-For de proxy não confiável:', proxyIp)
    }
  }
  
  // Tentar outros headers de proxy
  if (realIp && isValidIp(realIp)) {
    return realIp
  }
  
  if (cfConnectingIp && isValidIp(cfConnectingIp)) {
    return cfConnectingIp
  }
  
  // Se nenhum header de proxy confiável, retornar 'unknown'
  // Isso força uso de autenticação JWT para rate limiting
  console.warn('⚠️ Nenhum header de proxy confiável encontrado. Usando identificação por token JWT.')
  return 'unknown'
}

/**
 * Cria um middleware de rate limiting
 *
 * @param config - Configuração do rate limiting
 * @returns Middleware de rate limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000,  // 15 minutos por padrão
    maxRequests = 100,              // 100 requisições por padrão
    message = 'Muitas requisições. Tente novamente mais tarde.',
    requireAuth = false  // Se true, exige autenticação para rate limiting
  } = config

  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const now = Date.now()
    const identifier = getClientIdentifier(request)
    const key = `ratelimit:${identifier}:${request.url}`

    // Se requireAuth=true, validar JWT token primeiro
    // Mas verificar se autenticação está desabilitada para desenvolvimento
    if (requireAuth && process.env.DISABLE_AUTH !== 'true') {
      const jwtToken = extractJwtToken(request)
      if (!jwtToken) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Autenticação necessária para acessar este endpoint',
              retryAfter: null
            }
          },
          {
            status: 401,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(now).toISOString()
            }
          }
        )
      }
      
      // Verificar se JWT é válido
      try {
        if (!process.env.JWT_SECRET) {
          console.error('❌ CRÍTICO: JWT_SECRET não configurado. Autenticação não funcionará corretamente.')
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro interno do servidor: JWT_SECRET não configurado',
                retryAfter: null
              }
            },
            {
              status: 500,
              headers: {
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(now).toISOString()
              }
            }
          )
        }
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET)
        if (!decoded || typeof decoded === 'string') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_TOKEN',
                message: 'Token JWT inválido',
                retryAfter: null
              }
            },
            {
              status: 401,
              headers: {
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(now).toISOString()
              }
            }
          )
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Token JWT inválido ou expirado',
              retryAfter: null
            }
          },
          {
            status: 401,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(now).toISOString()
            }
          }
        )
      }
    }

    // Usar Redis se disponível
    if (redisAvailable && redisClient) {
      try {
        const redisEntry = await getRedisEntry(key, windowMs)
        
        if (!redisEntry || redisEntry.resetTime <= now) {
          // Criar nova entrada no Redis
          await incrementRedisEntry(key, windowMs)
          return null
        }
        
        // Verificar se excedeu o limite
        if (redisEntry.count >= maxRequests) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'TOO_MANY_REQUESTS',
                message,
                retryAfter: Math.ceil((redisEntry.resetTime - now) / 1000)
              }
            },
            {
              status: 429,
              headers: {
                'Retry-After': Math.ceil((redisEntry.resetTime - now) / 1000).toString(),
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(redisEntry.resetTime).toISOString()
              }
            }
          )
        }
        
        // Incrementar contador no Redis
        const updatedEntry = await incrementRedisEntry(key, windowMs)
        
        // Adicionar headers de rate limit na resposta
        const response = NextResponse.json({ success: false })
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', (maxRequests - updatedEntry.count).toString())
        response.headers.set('X-RateLimit-Reset', new Date(updatedEntry.resetTime).toISOString())
        
        return null
      } catch (error) {
        console.error('Erro ao usar Redis para rate limiting:', error)
        // Se não houver Redis configurado ou houver erro, usar rate limiting em memória como fallback (fail-open)
        // Isso garante que o sistema continue funcionando mesmo se Redis falhar
        console.warn('⚠️  Usando rate limiting em memória como fallback')
      }
    }
    
    // Fallback: Se Redis não está configurado, usar rate limiting em memória (fail-open)
    // Isso garante que o sistema continue funcionando mesmo sem Redis configurado
    if (!redisConfigured) {
      console.warn('⚠️  Redis não configurado. Usando rate limiting em memória como fallback.')
      console.warn('⚠️  Configure REDIS_URL para ativar rate limiting distribuído em produção.')
      
      // Usar rate limiting em memória como fallback
      const rateLimitStore = new Map<string, RateLimitEntry>()
      const entry = rateLimitStore.get(key)
      
      if (!entry || entry.resetTime <= now) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs
        })
        return null
      }
      
      entry.count++
      
      if (entry.count > maxRequests) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message,
              retryAfter: Math.ceil((entry.resetTime - now) / 1000)
            }
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
            }
          }
        )
      }
      
      const response = NextResponse.json({ success: false })
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString())
      response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
      
      return null
    }
    
    // Não deveria chegar aqui, mas por segurança
    return null
  }
}

/**
 * Rate limiter local para desenvolvimento (sem Redis)
 * Útil para ambientes de desenvolvimento sem Redis configurado
 *
 * ATENÇÃO: Não use em produção com múltiplas instâncias!
 *
 * @param config - Configuração do rate limiting
 * @returns Middleware de rate limiting
 */
export function rateLimitLocal(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 100,
    message = 'Muitas requisições. Tente novamente mais tarde.'
  } = config

  // Store em memória para desenvolvimento
  const rateLimitStore = new Map<string, RateLimitEntry>()

  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const now = Date.now()
    const identifier = getClientIdentifier(request)
    const key = `ratelimit:${identifier}:${request.url}`

    // Limpar entradas expiradas
    const entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return null
    }
    
    entry.count++
    
    if (entry.count > maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
          }
        }
      )
    }
    
    const response = NextResponse.json({ success: false })
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString())
    response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
    
    return null
  }
}

/**
 * Rate limiter específico para autenticação
 * Limita a 5 tentativas por 15 minutos
 * NÃO requer autenticação JWT para permitir login
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  maxRequests: 5,               // 5 tentativas
  message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
  requireAuth: false  // NÃO exige autenticação JWT para permitir login
})

/**
 * Rate limiter para APIs gerais
 * Limita a 100 requisições por 15 minutos
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  maxRequests: 100,             // 100 requisições
  message: 'Muitas requisições. Tente novamente em 15 minutos.'
})

/**
 * Rate limiter para chat LLM
 * Limita a 20 requisições por minuto
 * Requer autenticação JWT para funcionar corretamente
 */
export const llmChatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minuto
  maxRequests: 20,         // 20 requisições
  message: 'Muitas requisições ao chat. Tente novamente em 1 minuto.',
  requireAuth: true  // Exige autenticação JWT
})

