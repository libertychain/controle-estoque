import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/fornecedores - Listar fornecedores
export async function GET(request: NextRequest) {
  try {
    console.log('Iniciando busca de fornecedores...')
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {
      ativo: true
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { nome: { contains: search } },
        { cnpj: { contains: search } }
      ]
    }

    console.log('Buscando fornecedores com where:', where)
    // Get fornecedores
    const fornecedores = await db.fornecedor.findMany({
      where,
      orderBy: { nome: 'asc' }
    })

    console.log('Fornecedores encontrados:', fornecedores.length)
    return NextResponse.json({
      success: true,
      data: {
        fornecedores,
        total: fornecedores.length
      }
    })
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar fornecedores',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    )
  }
}
