import { NextRequest, NextResponse } from 'next/server'
import { perguntar } from '@/services/llm.service'

// POST /api/llm/chat - Chat com o assistente
export async function POST(request: NextRequest) {
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

    const response = await perguntar(pergunta, contexto || '')

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro no chat LLM:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao processar pergunta'
        }
      },
      { status: 500 }
    )
  }
}
