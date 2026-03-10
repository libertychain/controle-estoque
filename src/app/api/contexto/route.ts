/**
 * API de Gerenciamento de Contexto RAG
 * 
 * Esta API fornece endpoints para gerenciar contextos RAG de aquisições,
 * incluindo geração manual, busca e recuperação de contextos.
 * 
 * ⚠️ Requer autenticação para acessar todos os endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { aquisitionMonitor } from '@/services/aquisition-monitor.service'
import { knowledgeBase } from '@/services/knowledge-base.service'
import { contextBuilderAquisicoes } from '@/services/context-builder-aquisicoes.service'
import { requireAuth, requirePermission } from '@/lib/auth-middleware'

// GET /api/contexto/buscar - Buscar contexto por query
export async function GET(request: NextRequest) {
  // Verificar autenticação
  const authError = await requireAuth(request)
  if (authError) {
    return authError
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limite = parseInt(searchParams.get('limite') || '5', 10)

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetro obrigatório: query'
          }
        },
        { status: 400 }
      )
    }

    console.log(`🔍 Buscando contexto para query: "${query}"`)

    const inicio = Date.now()
    const resultados = await knowledgeBase.buscarContexto(query, limite)
    const tempoBusca = Date.now() - inicio

    console.log(`⏱️  Tempo de busca: ${tempoBusca}ms`)

    return NextResponse.json({
      success: true,
      data: {
        query,
        resultados,
        total: resultados.length,
        tempo_busca_ms: tempoBusca
      }
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

// POST /api/contexto/gerar/[aquisitionId] - Gerar contexto manualmente
export async function POST(request: NextRequest) {
  // Verificar autenticação e permissão de ADMIN
  const authError = await requireAuth(request)
  if (authError) {
    return authError
  }

  // Verificar se o usuário tem permissão para gerar contexto RAG
  const permissionError = await requirePermission(request, [1]) // 1 = perfil ADMIN
  if (permissionError) {
    return permissionError
  }

  try {
    const body = await request.json()
    const { aquisicao_id, acao } = body

    if (!aquisicao_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campo obrigatório: aquisicao_id'
          }
        },
        { status: 400 }
      )
    }

    console.log(`🔄 Recebida requisição para ${acao || 'gerar'} contexto da aquisição ${aquisicao_id}`)

    // Processar aquisição manualmente
    const resultado = await aquisitionMonitor.processarAquisitionManual(aquisicao_id)

    if (resultado.sucesso) {
      return NextResponse.json({
        success: true,
        data: resultado
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: resultado.erro || 'Erro ao processar aquisição'
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro ao gerar contexto:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao gerar contexto'
        }
      },
      { status: 500 }
    )
  }
}
