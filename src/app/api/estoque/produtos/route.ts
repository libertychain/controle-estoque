import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/estoque/produtos - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const aquisicaoId = searchParams.get('aquisicao_id')
    const categoriaId = searchParams.get('categoria_id')
    const marcaId = searchParams.get('marca_id')
    const fornecedorId = searchParams.get('fornecedor_id')
    const saldoCritico = searchParams.get('saldo_critico') === 'true'

    // Se foi especificado aquisicao_id, buscar produtos da aquisição
    if (aquisicaoId) {
      const aquisicao = await db.aquisicao.findUnique({
        where: { id: parseInt(aquisicaoId) },
        include: {
          fornecedor: true
        }
      })

      if (!aquisicao) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Aquisição não encontrada'
            }
          },
          { status: 404 }
        )
      }

      // Buscar produtos da aquisição (ProdutoAquisicao)
      const produtosAquisicao = await db.produtoAquisicao.findMany({
        where: {
          aquisicao_id: parseInt(aquisicaoId)
        },
        orderBy: { id: 'asc' }
      })

      // Buscar produtos de estoque deste fornecedor
      const produtosEstoque = await db.produto.findMany({
        where: {
          fornecedor_id: aquisicao.fornecedor.id,
          ativo: true
        },
        include: {
          categoria: true,
          unidade: true,
          marca: true,
          fornecedor: true
        }
      })

      // Criar mapa de produtos de estoque por descrição para verificar se já existe
      const produtosEstoqueMap = new Map()
      produtosEstoque.forEach(p => {
        produtosEstoqueMap.set(p.descricao, p)
      })

      // Combinar produtos: mostrar produtos de estoque e produtos de aquisição que ainda não estão no estoque
      const produtosCombinados: any[] = []

      // Adicionar produtos de estoque
      produtosEstoque.forEach(p => {
        produtosCombinados.push({
          id: p.id,
          codigo: p.codigo,
          descricao: p.descricao,
          categoria: p.categoria,
          unidade: p.unidade,
          marca: p.marca,
          fornecedor: p.fornecedor,
          aquisicao: {
            id: aquisicao.id,
            numero_proc: aquisicao.numero_proc,
            modalidade: aquisicao.modalidade
          },
          saldo_atual: p.saldo_atual,
          saldo_minimo: p.saldo_minimo,
          localizacao: p.localizacao,
          ativo: p.ativo,
          tipo: 'estoque'
        })
      })

      // Adicionar produtos de aquisição que ainda não estão no estoque
      produtosAquisicao.forEach(pa => {
        if (!produtosEstoqueMap.has(pa.descricao)) {
          produtosCombinados.push({
            id: pa.id,
            codigo: `PAQ-${pa.id}`,
            descricao: pa.descricao,
            categoria: { id: 0, nome: '-' },
            unidade: { id: 0, sigla: pa.unidade },
            marca: null,
            fornecedor: aquisicao.fornecedor,
            aquisicao: {
              id: aquisicao.id,
              numero_proc: aquisicao.numero_proc,
              modalidade: aquisicao.modalidade
            },
            saldo_atual: pa.quantidade,
            saldo_minimo: 0,
            localizacao: null,
            ativo: true,
            tipo: 'aquisicao'
          })
        }
      })

      // Aplicar filtro de busca
      let produtosFiltrados = produtosCombinados
      if (search) {
        const searchLower = search.toLowerCase()
        produtosFiltrados = produtosCombinados.filter(p =>
          p.codigo.toLowerCase().includes(searchLower) ||
          p.descricao.toLowerCase().includes(searchLower) ||
          p.categoria.nome.toLowerCase().includes(searchLower) ||
          p.marca?.nome?.toLowerCase().includes(searchLower) ||
          p.fornecedor?.nome?.toLowerCase().includes(searchLower)
        )
      }

      // Aplicar filtro de saldo crítico
      if (saldoCritico) {
        produtosFiltrados = produtosFiltrados.filter(p => p.saldo_atual <= p.saldo_minimo)
      }

      return NextResponse.json({
        success: true,
        data: {
          produtos: produtosFiltrados,
          pagination: {
            total: produtosFiltrados.length,
            page: 1,
            limit: produtosFiltrados.length,
            totalPages: 1
          }
        }
      })
    }

    // Se não foi especificado aquisicao_id, buscar apenas produtos de estoque
    const where: any = {
      ativo: true
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search } },
        { descricao: { contains: search } }
      ]
    }

    if (categoriaId) {
      where.categoria_id = parseInt(categoriaId)
    }

    if (marcaId) {
      where.marca_id = parseInt(marcaId)
    }

    if (fornecedorId) {
      where.fornecedor_id = parseInt(fornecedorId)
    }

    // Get products with relations
    const [produtos, total] = await Promise.all([
      db.produto.findMany({
        where,
        include: {
          categoria: true,
          unidade: true,
          marca: true,
          fornecedor: true
        },
        orderBy: { criado_em: 'desc' }
      }),
      db.produto.count({ where })
    ])

    // Filtrar por saldo crítico no JavaScript
    let produtosFiltrados = produtos
    if (saldoCritico) {
      produtosFiltrados = produtos.filter(p => p.saldo_atual <= p.saldo_minimo)
    }

    // Adicionar informações da aquisição aos produtos
    const produtosComInfo = produtosFiltrados.map(p => ({
      ...p,
      aquisicao: null,
      tipo: 'estoque'
    }))

    return NextResponse.json({
      success: true,
      data: {
        produtos: produtosComInfo,
        pagination: {
          total: produtosComInfo.length,
          page: 1,
          limit: produtosComInfo.length,
          totalPages: 1
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao buscar produtos'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/estoque/produtos - Criar produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      descricao,
      categoria_id,
      unidade_id,
      marca_id,
      fornecedor_id,
      saldo_minimo,
      localizacao
    } = body

    // Validate required fields
    if (!descricao || !categoria_id || !unidade_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campos obrigatórios: descricao, categoria_id, unidade_id'
          }
        },
        { status: 400 }
      )
    }

    // Generate unique product code
    const year = new Date().getFullYear()
    const count = await db.produto.count({
      where: {
        codigo: {
          startsWith: `PRD-${year}`
        }
      }
    })
    const codigo = `PRD-${year}-${String(count + 1).padStart(4, '0')}`

    // Create product
    const produto = await db.produto.create({
      data: {
        codigo,
        descricao,
        categoria_id,
        unidade_id,
        marca_id: marca_id || null,
        fornecedor_id: fornecedor_id || null,
        saldo_minimo: saldo_minimo || 0,
        localizacao,
        saldo_atual: 0
      },
      include: {
        categoria: true,
        unidade: true,
        marca: true,
        fornecedor: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: produto,
        message: 'Produto criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao criar produto'
        }
      },
      { status: 500 }
    )
  }
}
