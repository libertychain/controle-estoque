/**
 * API de Chat com Assistente LLM
 * 
 * ATUALIZAÇÃO: Simplificou o fluxo para usar a nova arquitetura RAG flexível.
 * 
 * Fluxo simplificado:
 * 1. Receber pergunta do usuário
 * 2. Construir contexto completo (documentação + dados)
 * 3. Enviar para o LLM
 * 4. Retornar resposta
 * 
 * Removido:
 * - Sistema de detecção por padrões (regex)
 * - Funções ePerguntaGeralSobreEstoque() e ePerguntaSobrePedidos()
 * - Lógica complexa de filtragem de contexto
 */

import { NextRequest, NextResponse } from 'next/server'
import { perguntar } from '@/services/llm.service'
import { buildContext, formatarContextoParaLLM } from '@/services/context-builder.service'
import { handleApiError } from '@/lib/api-error-handler'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { llmChatRateLimiter } from '@/lib/rate-limiter'

// POST /api/llm/chat - Chat com o assistente
export async function POST(request: NextRequest) {
  // Aplicar rate limiting com try-catch para evitar falhas silenciosas
  // Se o rate limiter falhar, logar o erro e continuar sem rate limiting (fail-open)
  try {
    const rateLimitError = await llmChatRateLimiter(request)
    if (rateLimitError) {
      return rateLimitError
    }
  } catch (error) {
    console.error('Erro no rate limiter de chat LLM:', error)
    // Continuar sem rate limiting em caso de erro (fail-open)
    // Isso garante que o sistema continue funcionando mesmo se Redis falhar
  }
  
  const usuario = getAuthenticatedUser(request)
  
  if (!usuario) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    const { pergunta, contexto } = body

    if (!pergunta) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campo obrigatório: pergunta'
          }
        },
        { status: 400 }
      )
    }

    const inicioTotal = Date.now()
    console.log('🚀 Nova pergunta recebida:', pergunta)
    
    // Construir contexto completo usando o Context Builder
    const inicioContexto = Date.now()
    const contextoSistema = await buildContext(pergunta)
    const tempoContexto = Date.now() - inicioContexto
    console.log(`⏱️  Tempo de construção de contexto: ${tempoContexto}ms`)
    
    // Formatar contexto para envio ao LLM
    const contextoFormatado = formatarContextoParaLLM(contextoSistema, pergunta)
    
    // Log de debug: mostrar o contexto completo
    console.log('\n📋 CONTEXTO ENVIADO PARA O LLM:')
    console.log('='.repeat(80))
    console.log(`Documentação: ${contextoSistema.documentacao.length} caracteres`)
    console.log(`Dados: ${contextoSistema.dados.length} caracteres`)
    console.log(`Histórico: ${contextoSistema.historico?.length || 0} mensagens`)
    console.log('='.repeat(80));
    console.log(`\n📝 PERGUNTA: ${pergunta}\n`)
    
    // Enviar para o LLM
    const inicioLLM = Date.now()
    const response = await perguntar(pergunta, contextoFormatado)
    const tempoLLM = Date.now() - inicioLLM
    const tempoTotal = Date.now() - inicioTotal
    
    console.log(`\n⏱️  Tempo de processamento LLM: ${tempoLLM}ms`)
    console.log(`⏱️  Tempo total da requisição: ${tempoTotal}ms`)

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'ao processar pergunta')
  }
}
