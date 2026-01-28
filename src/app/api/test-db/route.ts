import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('Testando conexão com o banco de dados...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL)
    
    const fornecedores = await db.fornecedor.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Conexão bem-sucedida',
      data: {
        fornecedores,
        total: fornecedores.length
      }
    })
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error)
    console.error('Detalhes:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao conectar ao banco de dados',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    )
  }
}
