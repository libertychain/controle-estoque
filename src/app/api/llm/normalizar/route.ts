import { NextRequest, NextResponse } from 'next/server'
import { normalizarDescricao } from '@/services/llm.service'

// POST /api/llm/normalizar - Normalizar descrição de produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { descricao } = body

    if (!descricao) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campo obrigatório: descricao'
          }
        },
        { status: 400 }
      )
    }

    const response = await normalizarDescricao(descricao)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao normalizar descrição:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao normalizar descrição'
        }
      },
      { status: 500 }
    )
  }
}
