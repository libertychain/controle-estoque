import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/aquisicoes - Listar aquisições
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      ativo: true
    }

    if (search) {
      where.OR = [
        { numero_proc: { contains: search } },
        { fornecedor: { nome: { contains: search } } },
        { numero_contrato: { contains: search } }
      ]
    }

    // Get aquisicoes with relations
    const [aquisicoes, total] = await Promise.all([
      db.aquisicao.findMany({
        where,
        skip,
        take: limit,
        include: {
          fornecedor: true,
          _count: {
            select: {
              produtos: true,
              aditivos: true
            }
          }
        },
        orderBy: { criado_em: 'desc' }
      }),
      db.aquisicao.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        aquisicoes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
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

// POST /api/aquisicoes - Criar aquisição
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      numero_proc,
      modalidade,
      fornecedor_id,
      numero_contrato,
      data_inicio,
      data_fim,
      observacoes,
      produtos
    } = body

    // Validate required fields
    if (!numero_proc || !modalidade || !fornecedor_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campos obrigatórios: numero_proc, modalidade, fornecedor_id'
          }
        },
        { status: 400 }
      )
    }

    // Check if numero_proc already exists
    const existingAquisicao = await db.aquisicao.findFirst({
      where: { numero_proc }
    })

    if (existingAquisicao) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Número de processo já cadastrado'
          }
        },
        { status: 409 }
      )
    }

    // Create aquisicao
    const aquisicao = await db.aquisicao.create({
      data: {
        numero_proc,
        modalidade,
        fornecedor_id: parseInt(fornecedor_id),
        numero_contrato: numero_contrato || null,
        data_inicio: data_inicio ? new Date(data_inicio) : null,
        data_fim: data_fim ? new Date(data_fim) : null,
        observacoes: observacoes || null,
        possui_aditivos: false,
        produtos: produtos && produtos.length > 0 ? {
          create: produtos.map((p: any) => ({
            descricao: p.descricao,
            unidade: p.unidade,
            marca: p.marca || null,
            quantidade: parseFloat(p.quantidade.toString().replace(',', '.')), // Converter string para number, substituindo vírgula por ponto
            preco_unitario: parseFloat(p.preco_unitario),
            prazo_entrega: p.prazo_entrega ? parseInt(p.prazo_entrega) : null
          }))
        } : undefined
      },
      include: {
        fornecedor: true,
        produtos: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: aquisicao,
        message: 'Aquisição criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar aquisição:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao criar aquisição'
        }
      },
      { status: 500 }
    )
  }
}
