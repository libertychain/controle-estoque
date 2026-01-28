import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/secretarias - Listar secretarias
export async function GET(request: NextRequest) {
  try {
    const secretarias = await db.secretaria.findMany({
      where: {
        ativo: true
      },
      orderBy: {
        nome: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        secretarias
      }
    })
  } catch (error) {
    console.error('Erro ao buscar secretarias:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar secretarias'
        }
      },
      { status: 500 }
    )
  }
}
