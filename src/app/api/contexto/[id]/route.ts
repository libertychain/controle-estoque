/**
 * API de Contexto RAG por ID
 * 
 * Esta API fornece endpoints para obter e reprocessar contextos RAG
 * de aquisições específicas.
 * 
 * ⚠️ Requer autenticação para acessar todos os endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { knowledgeBase } from '@/services/knowledge-base.service'
import { contextBuilderAquisicoes } from '@/services/context-builder-aquisicoes.service'
import { requireAuth } from '@/lib/auth-middleware'

// GET /api/contexto/[id] - Obter contexto de uma aquisição
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticação
  const authError = await requireAuth(request)
  if (authError) {
    return authError
  }

  try {
    const { id } = await params
    const aquisicaoId = parseInt(id)

    if (isNaN(aquisicaoId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID da aquisição inválido'
          }
        },
        { status: 400 }
      )
    }

    console.log(`🔍 Buscando contexto da aquisição ${aquisicaoId}`)

    const contexto = await knowledgeBase.getContextoPorAquisicao(aquisicaoId)

    if (!contexto) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contexto não encontrado para esta aquisição'
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contexto
    })
  } catch (error) {
    console.error('Erro ao buscar contexto:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar contexto'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/contexto/[id]/reprocessar - Reprocessar contexto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticação
  const authError = await requireAuth(request)
  if (authError) {
    return authError
  }

  try {
    const { id } = await params
    const aquisicaoId = parseInt(id)

    if (isNaN(aquisicaoId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID da aquisição inválido'
          }
        },
        { status: 400 }
      )
    }

    console.log(`🔄 Reprocessando contexto da aquisição ${aquisicaoId}`)

    const inicio = Date.now()

    // Processar aquisição novamente
    const resultado = await contextBuilderAquisicoes.processarAquisicao(aquisicaoId)

    if (resultado.sucesso && resultado.contexto) {
      // Salvar contexto atualizado na Knowledge Base
      await knowledgeBase.salvarContexto(aquisicaoId, resultado.contexto)

      const tempoProcessamento = Date.now() - inicio

      console.log(`✅ Contexto da aquisição ${aquisicaoId} reprocessado com sucesso (${tempoProcessamento}ms)`)

      return NextResponse.json({
        success: true,
        data: {
          aquisicao_id: aquisicaoId,
          tempo_processamento: tempoProcessamento,
          contexto: resultado.contexto
        }
      })
    } else {
      console.error(`❌ Erro ao reprocessar aquisição ${aquisicaoId}: ${resultado.erro}`)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: resultado.erro || 'Erro ao reprocessar contexto'
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro ao reprocessar contexto:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao reprocessar contexto'
        }
      },
      { status: 500 }
    )
  }
}
