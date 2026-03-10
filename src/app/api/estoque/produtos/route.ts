import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import {
  sanitizeString,
  sanitizeNumber
} from '@/lib/input-validator'

/**
 * Função auxiliar para validar parâmetros ID
 * Evita duplicação de código ao validar aquisicao_id, categoria_id, marca_id e fornecedor_id
 * 
 * @param paramValue - Valor do parâmetro (string ou null)
 * @param paramName - Nome do parâmetro para mensagem de erro
 * @returns Valor validado como número ou null se inválido
 */
function validateIdParam(paramValue: string | null, paramName: string): number | null {
  if (!paramValue) {
    return null
  }

  const parsed = parseInt(paramValue)
  if (isNaN(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

/**
 * Função auxiliar para retornar erro de validação de ID
 * 
 * @param paramName - Nome do parâmetro
 * @returns NextResponse com erro 400
 */
function idValidationError(paramName: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `${paramName}_id inválido`
      }
    },
    { status: 400 }
  )
}

/**
 * Função auxiliar para calcular o saldo real de produtos
 * Considera itens de pedidos já utilizados
 * 
 * @param tx - Transação Prisma
 * @param produtosAquisicao - Lista de produtos de aquisição
 * @returns Map com descrição do produto -> saldo real
 */
async function calcularSaldoReal(
  tx: any,
  produtosAquisicao: any[]
): Promise<Map<string, number>> {
  const itensPedidos = await tx.itemPedido.findMany({
    where: {
      produto: {
        descricao: {
          in: produtosAquisicao.map((pa: any) => pa.descricao)
        }
      }
    },
    include: {
      produto: true
    }
  })
  
  const saldoMap = new Map<string, number>()
  
  produtosAquisicao.forEach((pa: any) => {
    const quantidadeUtilizada = itensPedidos
      .filter((item: any) => item.produto.descricao === pa.descricao)
      .reduce((total: number, item: any) => total + item.quantidade, 0)
    
    const saldoAtual = Math.max(0, pa.quantidade - quantidadeUtilizada)
    saldoMap.set(pa.descricao, saldoAtual)
  })
  
  return saldoMap
}

// GET /api/estoque/produtos - Listar produtos
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
    const search = searchParams.get('search') || ''
    const aquisicaoId = searchParams.get('aquisicao_id')
    const categoriaId = searchParams.get('categoria_id')
    const marcaId = searchParams.get('marca_id')
    const fornecedorId = searchParams.get('fornecedor_id')
    const saldoCritico = searchParams.get('saldo_critico') === 'true'

    // Validar parâmetros ID antes de usar em queries
    const aquisicaoIdValido = validateIdParam(aquisicaoId, 'aquisicao')
    if (aquisicaoIdValido === null) {
      return idValidationError('aquisicao')
    }
    
    const categoriaIdValido = validateIdParam(categoriaId, 'categoria')
    if (categoriaIdValido === null) {
      return idValidationError('categoria')
    }
    
    const marcaIdValido = validateIdParam(marcaId, 'marca')
    if (marcaIdValido === null) {
      return idValidationError('marca')
    }
    
    const fornecedorIdValido = validateIdParam(fornecedorId, 'fornecedor')
    if (fornecedorIdValido === null) {
      return idValidationError('fornecedor')
    }

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

      // Buscar itens de pedidos para calcular o saldo real
      const saldoMap = await calcularSaldoReal(db, produtosAquisicao)

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
          // Saldo = quantidade da aquisição - quantidade utilizada em pedidos
          const saldoAtual = saldoMap.get(pa.descricao) || 0

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
            saldo_atual: saldoAtual,
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

    // Se não foi especificado aquisicao_id, buscar todos os produtos de estoque e de aquisição
    // Buscar todos os produtos de estoque
    const whereEstoque: any = {
      ativo: true
    }

    if (categoriaIdValido !== null) {
      whereEstoque.categoria_id = categoriaIdValido
    }

    if (marcaIdValido !== null) {
      whereEstoque.marca_id = marcaIdValido
    }

    if (fornecedorIdValido !== null) {
      whereEstoque.fornecedor_id = fornecedorIdValido
    }

    // Buscar produtos de estoque
    const produtosEstoque = await db.produto.findMany({
      where: whereEstoque,
      include: {
        categoria: true,
        unidade: true,
        marca: true,
        fornecedor: true
      },
      orderBy: { criado_em: 'desc' }
    })

    // Buscar todas as aquisições ativas
    const aquisicoes = await db.aquisicao.findMany({
      where: {
        ativo: true
      },
      include: {
        fornecedor: true
      },
      orderBy: { numero_proc: 'asc' }
    })

    // Buscar todos os produtos de aquisição de todas as aquisições
    const produtosAquisicao = await db.produtoAquisicao.findMany({
      where: {
        aquisicao: {
          ativo: true,
          ...(aquisicaoIdValido !== null ? { id: aquisicaoIdValido } : {})
        }
      },
      include: {
        aquisicao: {
          include: {
            fornecedor: true
          }
        }
      },
      orderBy: { id: 'asc' }
    })

    // Buscar itens de pedidos para calcular o saldo real
    const saldoMap = await calcularSaldoReal(db, produtosAquisicao)

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
        aquisicao: null,
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
        // Saldo = quantidade da aquisição - quantidade utilizada em pedidos
        const saldoAtual = saldoMap.get(pa.descricao) || 0

        produtosCombinados.push({
          id: pa.id,
          codigo: `PAQ-${pa.id}`,
          descricao: pa.descricao,
          categoria: { id: 0, nome: '-' },
          unidade: { id: 0, sigla: pa.unidade },
          marca: null,
          fornecedor: pa.aquisicao.fornecedor,
          aquisicao: {
            id: pa.aquisicao.id,
            numero_proc: pa.aquisicao.numero_proc,
            modalidade: pa.aquisicao.modalidade
          },
          saldo_atual: saldoAtual,
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

    // Sanitizar e validar campos
    const descricaoSanitizada = sanitizeString(descricao, 500)
    const categoriaIdSanitizada = sanitizeNumber(categoria_id, 1)
    const unidadeIdSanitizada = sanitizeNumber(unidade_id, 1)
    const marcaIdSanitizada = marca_id ? sanitizeNumber(marca_id, 1) : null
    const fornecedorIdSanitizada = fornecedor_id ? sanitizeNumber(fornecedor_id, 1) : null
    const saldoMinimoSanitizado = sanitizeNumber(saldo_minimo, 0)
    const localizacaoSanitizada = localizacao ? sanitizeString(localizacao, 200) : null

    // Validate required fields
    if (!descricaoSanitizada || !categoriaIdSanitizada || !unidadeIdSanitizada) {
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

    // Generate unique product code and create product in a transaction to avoid race conditions
    const produto = await db.$transaction(async (tx) => {
      const year = new Date().getFullYear()
      const count = await tx.produto.count({
        where: {
          codigo: {
            startsWith: `PRD-${year}`
          }
        }
      })
      const codigo = `PRD-${year}-${String(count + 1).padStart(4, '0')}`

      // Create product
      return await tx.produto.create({
        data: {
          codigo,
          descricao: descricaoSanitizada,
          categoria_id: categoriaIdSanitizada,
          unidade_id: unidadeIdSanitizada,
          marca_id: marcaIdSanitizada,
          fornecedor_id: fornecedorIdSanitizada,
          saldo_minimo: saldoMinimoSanitizado,
          localizacao: localizacaoSanitizada,
          saldo_atual: 0
        },
        include: {
          categoria: true,
          unidade: true,
          marca: true,
          fornecedor: true
        }
      })
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
