import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/setores - Listar setores
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const secretariaId = searchParams.get('secretaria_id')

    const where: any = {
      ativo: true
    }

    if (secretariaId) {
      where.secretaria_id = parseInt(secretariaId)
    }

    const setores = await db.setor.findMany({
      where,
      include: {
        secretaria: true
      },
      orderBy: {
        nome: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        setores
      }
    })
  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar setores'
        }
      },
      { status: 500 }
    )
  }
}
