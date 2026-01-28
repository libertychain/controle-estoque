import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/aquisicoes/listar - Listar aquisições para filtro
export async function GET(request: NextRequest) {
  try {
    const aquisicoes = await db.aquisicao.findMany({
      where: {
        ativo: true
      },
      include: {
        fornecedor: true
      },
      orderBy: { criado_em: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        aquisicoes
      }
    })
  } catch (error) {
    console.error('Erro ao buscar aquisições:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar aquisições'
        }
      },
      { status: 500 }
    )
  }
}
