import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/fornecedores/[id] - Atualizar fornecedor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido'
          }
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('Atualizando fornecedor:', id, body)

    // Validação básica
    if (!body.codigo || !body.nome) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Código e nome são obrigatórios'
          }
        },
        { status: 400 }
      )
    }

    // Verificar se o fornecedor existe
    const fornecedorExistente = await db.fornecedor.findUnique({
      where: { id: parsedId }
    })

    if (!fornecedorExistente) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fornecedor não encontrado'
          }
        },
        { status: 404 }
      )
    }

    // Verificar se já existe outro fornecedor com o mesmo código
    const fornecedorComMesmoCodigo = await db.fornecedor.findFirst({
      where: {
        codigo: body.codigo,
        NOT: { id: parsedId }
      }
    })

    if (fornecedorComMesmoCodigo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'Já existe outro fornecedor com este código'
          }
        },
        { status: 409 }
      )
    }

    // Atualizar fornecedor
    const fornecedor = await db.fornecedor.update({
      where: { id: parsedId },
      data: {
        codigo: body.codigo,
        nome: body.nome,
        cnpj: body.cnpj || null,
        contato: body.contato || null,
        telefone: body.telefone || null,
        email: body.email || null,
        endereco: body.endereco || null
      }
    })

    console.log('Fornecedor atualizado com sucesso:', parsedId)
    return NextResponse.json({
      success: true,
      data: {
        fornecedor
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao atualizar fornecedor',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/fornecedores/[id] - Excluir fornecedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    if (isNaN(parsedId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido'
          }
        },
        { status: 400 }
      )
    }

    // Verificar se o fornecedor existe
    const fornecedor = await db.fornecedor.findUnique({
      where: { id: parsedId }
    })

    if (!fornecedor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fornecedor não encontrado'
          }
        },
        { status: 404 }
      )
    }

    // Verificar se há produtos vinculados
    const produtosVinculados = await db.produto.count({
      where: { fornecedor_id: parsedId }
    })

    if (produtosVinculados > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: `Não é possível excluir este fornecedor pois existem ${produtosVinculados} produto(s) vinculado(s)`
          }
        },
        { status: 409 }
      )
    }

    // Verificar se há aquisições vinculadas
    const aquisicoesVinculadas = await db.aquisicao.count({
      where: { fornecedor_id: parsedId }
    })

    if (aquisicoesVinculadas > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: `Não é possível excluir este fornecedor pois existem ${aquisicoesVinculadas} aquisição(ões) vinculada(s)`
          }
        },
        { status: 409 }
      )
    }

    // Excluir fornecedor
    await db.fornecedor.delete({
      where: { id: parsedId }
    })

    console.log('Fornecedor excluído com sucesso:', parsedId)
    return NextResponse.json({
      success: true,
      data: {
        message: 'Fornecedor excluído com sucesso'
      }
    })
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao excluir fornecedor',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    )
  }
}
