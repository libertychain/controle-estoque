import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { handleApiError } from '@/lib/api-error-handler'
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeDate,
  sanitizeObject,
  sanitizeArray
} from '@/lib/input-validator'

/**
 * Função auxiliar para criar ou buscar produto com cálculo correto de saldo
 *
 * Esta função centraliza a lógica de criação de produtos para evitar duplicação
 * de código entre pedidos e aquisições.
 *
 * @param tx - Transação Prisma
 * @param descricao - Descrição do produto
 * @param fornecedorId - ID do fornecedor
 * @param categoriaId - ID da categoria (opcional, usa 'Geral' por padrão)
 * @param unidadeId - ID da unidade (opcional, usa 'UN' por padrão)
 * @returns Produto criado ou encontrado
 */
async function criarOuBuscarProduto(
  tx: any,
  descricao: string,
  fornecedorId: number,
  categoriaId?: number,
  unidadeId?: number
) {
  // Buscar categoria padrão se não fornecida
  const categoria = categoriaId
    ? await tx.categoria.findUnique({ where: { id: categoriaId } })
    : await tx.categoria.upsert({
        where: { nome: 'Geral' },
        update: {},
        create: { nome: 'Geral' }
      })

  // Buscar unidade padrão se não fornecida
  const unidade = unidadeId
    ? await tx.unidade.findUnique({ where: { id: unidadeId } })
    : await tx.unidade.upsert({
        where: { sigla: 'UN' },
        update: {},
        create: { sigla: 'UN', descricao: 'Unidade' }
      })

  // Buscar produto existente
  const produto = await tx.produto.findFirst({
    where: {
      descricao,
      fornecedor_id: fornecedorId
    }
  })

  if (produto) {
    return produto
  }

  // Buscar itens de pedidos anteriores para calcular o saldo inicial correto
  const itensPedidosAnteriores = await tx.itemPedido.findMany({
    where: {
      produto: {
        descricao,
        fornecedor_id: fornecedorId
      }
    }
  })

  // Calcular quantidade já utilizada em pedidos anteriores
  const quantidadeUtilizada = itensPedidosAnteriores.reduce(
    (total, item) => total + item.quantidade,
    0
  )

  // Buscar saldo atual existente do produto (se já existe)
  const saldoInicial = Math.max(0, (produto?.saldo_atual || 0) - quantidadeUtilizada)

  // Criar novo produto
  return await tx.produto.create({
    data: {
      descricao,
      categoria_id: categoria.id,
      unidade_id: unidade.id,
      fornecedor_id: fornecedorId,
      saldo_atual: saldoInicial,
      saldo_minimo: 0
    }
  })
}

// GET /api/aquisicoes - Listar aquisições
export async function GET(request: NextRequest) {
  const usuario = getAuthenticatedUser(request)
  
  if (!usuario) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        }
      },
      { status: 401 }
    )
  }
  
  try {
    const searchParams = request.nextUrl.searchParams
    // Validar e limitar page e limit para prevenir problemas de performance
    const page = Math.max(1, Math.min(1000, parseInt(searchParams.get('page') || '1')))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))
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
    return handleApiError(error, 'ao buscar aquisições')
  }
}

// POST /api/aquisicoes - Criar aquisição
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Sanitizar e validar todos os campos usando o utilitário
    const sanitizedBody = sanitizeObject(body, {
      numero_proc: (val) => sanitizeString(val, 50),
      modalidade: (val) => sanitizeString(val, 50),
      fornecedor_id: (val) => sanitizeNumber(val, 1),
      numero_contrato: (val) => sanitizeString(val, 50),
      data_inicio: (val) => sanitizeDate(val),
      data_fim: (val) => sanitizeDate(val),
      observacoes: (val) => sanitizeString(val, 2000)
    })

    // Validar e sanitizar produtos
    const produtos = body.produtos ? sanitizeArray(body.produtos, (p) => sanitizeObject(p, {
      descricao: (val) => sanitizeString(val, 500),
      unidade: (val) => sanitizeString(val, 10),
      marca: (val) => sanitizeString(val, 100),
      quantidade: (val) => sanitizeNumber(val, 0),
      preco_unitario: (val) => sanitizeNumber(val, 0),
      prazo_entrega: (val) => sanitizeNumber(val, 1)
    })) : []

    // Check if numero_proc already exists
    const existingAquisicao = await db.aquisicao.findFirst({
      where: { numero_proc: sanitizedBody.numero_proc }
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

    // Create aquisicao com dados sanitizados
    const aquisicao = await db.aquisicao.create({
      data: {
        numero_proc: sanitizedBody.numero_proc,
        modalidade: sanitizedBody.modalidade,
        fornecedor_id: sanitizedBody.fornecedor_id,
        numero_contrato: sanitizedBody.numero_contrato,
        data_inicio: sanitizedBody.data_inicio,
        data_fim: sanitizedBody.data_fim,
        observacoes: sanitizedBody.observacoes,
        possui_aditivos: false,
        produtos: produtos.length > 0 ? {
          create: produtos.map((p: any) => ({
            descricao: p.descricao,
            unidade: p.unidade,
            marca: p.marca,
            quantidade: p.quantidade,
            preco_unitario: p.preco_unitario,
            prazo_entrega: p.prazo_entrega
          }))
        } : undefined
      },
      include: {
        fornecedor: true,
        produtos: true
      }
    })

    // Criar automaticamente os produtos no catálogo (tabela Produto)
    if (produtos.length > 0) {
      // Buscar ou criar categoria "Geral" usando upsert para evitar race conditions
      const categoria = await db.categoria.upsert({
        where: { nome: 'Geral' },
        update: {},
        create: { nome: 'Geral' }
      })

      // Criar produtos no catálogo
      for (let i = 0; i < produtos.length; i++) {
        const p = produtos[i]
        const produtoAquisicao = aquisicao.produtos[i]

        // Buscar ou criar unidade usando upsert para evitar race conditions
        const unidade = await db.unidade.upsert({
          where: { sigla: p.unidade.toUpperCase() },
          update: {},
          create: { sigla: p.unidade.toUpperCase(), descricao: p.unidade }
        })

        // Buscar ou criar marca usando upsert para evitar race conditions
        let marca: { id: number; nome: string; ativo: boolean; criado_em: Date; atualizado: Date; } | null = null
        if (p.marca) {
          marca = await db.marca.upsert({
            where: { nome: p.marca.toUpperCase() },
            update: {},
            create: { nome: p.marca.toUpperCase() }
          })
        }

        // Verificar se o produto já existe no catálogo usando transação para evitar race conditions
        const produto = await db.$transaction(async (tx) => {
          return await criarOuBuscarProduto(
            tx,
            p.descricao,
            sanitizedBody.fornecedor_id,
            categoria.id,
            unidade.id
          )
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: aquisicao,
        message: 'Aquisição criada com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, 'ao criar aquisição')
  }
}
