import { NextResponse } from 'next/server'
import { invalidarCacheEstoque } from '@/services/estoque-context.service'

// POST /api/estoque/invalidar-cache - Invalidar cache de estoque
export async function POST() {
  try {
    await invalidarCacheEstoque()

    return NextResponse.json({
      success: true,
      message: 'Cache de estoque invalidado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao invalidar cache:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao invalidar cache'
        }
      },
      { status: 500 }
    )
  }
}
