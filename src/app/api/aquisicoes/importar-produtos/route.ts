import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// POST /api/aquisicoes/importar-produtos - Importar produtos de Excel/CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Arquivo não fornecido'
          }
        },
        { status: 400 }
      )
    }

    // Verificar extensão do arquivo
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Formato de arquivo inválido. Use .xlsx, .xls ou .csv'
          }
        },
        { status: 400 }
      )
    }

    // Ler o arquivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let produtos: any[] = []

    // Processar CSV
    if (fileName.endsWith('.csv')) {
      produtos = parseCSV(buffer.toString('utf-8'))
    } else {
      // Processar Excel (.xlsx, .xls)
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      
      // Converter para formato de produtos
      produtos = parseExcelData(jsonData)
    }

    return NextResponse.json({
      success: true,
      data: {
        produtos,
        total: produtos.length
      },
      message: `${produtos.length} produtos importados com sucesso`
    })

  } catch (error) {
    console.error('Erro ao importar produtos:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao importar produtos'
        }
      },
      { status: 500 }
    )
  }
}

// Função para parsear CSV
function parseCSV(csvText: string): any[] {
  const linhas = csvText.split('\n')
  const produtos: any[] = []

  // Pular cabeçalho se existir
  const startIndex = linhas[0].toLowerCase().includes('descricao') ? 1 : 0

  for (let i = startIndex; i < linhas.length; i++) {
    const linha = linhas[i].trim()
    if (!linha) continue

    // Parse simples de CSV (considerando separador ; ou ,)
    const colunas = linha.includes(';') ? linha.split(';') : linha.split(',')

    // Mapear colunas (assumindo ordem: descricao, unidade, marca, quantidade, preco_unitario, prazo_entrega)
    if (colunas.length >= 4) {
      produtos.push({
        descricao: colunas[0]?.trim() || '',
        unidade: colunas[1]?.trim() || 'UN',
        marca: colunas[2]?.trim() || null,
        quantidade: parseFloat(colunas[3]?.trim() || '0') || 0,
        preco_unitario: parseFloat(colunas[4]?.trim() || '0') || 0,
        prazo_entrega: colunas[5]?.trim() ? parseInt(colunas[5].trim()) : null
      })
    }
  }

  return produtos
}

// Função para parsear dados do Excel
function parseExcelData(data: any[][]): any[] {
  const produtos: any[] = []
  
  // Verificar se há dados
  if (!data || data.length === 0) {
    return produtos
  }

  // Determinar o índice inicial (pular cabeçalho se existir)
  const firstRow = data[0].map((cell: any) => String(cell || '').toLowerCase())
  const hasHeader = firstRow.some((cell: string) =>
    cell.includes('descricao') ||
    cell.includes('descrição') ||
    cell.includes('item') ||
    cell.includes('marca')
  )
  const startIndex = hasHeader ? 1 : 0

  // Mapear índices das colunas baseados no cabeçalho
  let colIndices = {
    descricao: 0,
    marca: 1,
    unidade: 2,
    quantidade: 3,
    preco: 4
  }

  if (hasHeader) {
    firstRow.forEach((cell, index) => {
      const normalized = cell.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalized.includes('descricao') || normalized.includes('descricao') || normalized.includes('item') || normalized.includes('produto')) {
        colIndices.descricao = index
      } else if (normalized.includes('marca')) {
        colIndices.marca = index
      } else if (normalized.includes('unidade') || normalized.includes('medida')) {
        colIndices.unidade = index
      } else if (normalized.includes('quantidade') || normalized.includes('qtd')) {
        colIndices.quantidade = index
      } else if (normalized.includes('valor') || normalized.includes('preco') || normalized.includes('unitario')) {
        colIndices.preco = index
      }
    })
  }

  for (let i = startIndex; i < data.length; i++) {
    const row = data[i]
    
    // Pular linhas vazias
    if (!row || row.length === 0) continue

    // Pular linha de total (que contém "total" em algum lugar)
    const rowText = row.join(' ').toLowerCase()
    if (rowText.includes('total') || rowText.includes('r$')) {
      continue
    }

    // Extrair valores
    const descricao = String(row[colIndices.descricao] || '').trim() || ''
    const marca = row[colIndices.marca] ? String(row[colIndices.marca]).trim() : null
    const unidade = String(row[colIndices.unidade] || '').trim() || 'UN'
    const quantidade = parseQuantity(row[colIndices.quantidade])
    const precoUnitario = parsePrice(row[colIndices.preco])

    // Pular se não tiver descrição ou quantidade
    if (!descricao || quantidade === 0) continue

    produtos.push({
      descricao,
      unidade,
      marca,
      quantidade,
      preco_unitario: precoUnitario,
      prazo_entrega: null
    })
  }

  return produtos
}

// Função para parsear quantidade
function parseQuantity(value: any): number {
  if (!value) return 0
  const strValue = String(value).trim()
  // Remover formatação brasileira
  const cleanValue = strValue.replace(/\./g, '').replace(',', '.')
  return parseFloat(cleanValue) || 0
}

// Função para parsear preço no formato brasileiro
function parsePrice(value: any): number {
  if (!value) return 0
  const strValue = String(value).trim()
  
  // Remover símbolo de moeda e espaços
  let cleanValue = strValue
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
  
  // Verificar se usa vírgula como separador decimal (formato brasileiro)
  if (cleanValue.includes(',')) {
    // Formato brasileiro: 1.234,56 ou 1234,56
    // Remover pontos de milhar e substituir vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
  }
  // Se não tem vírgula, assume que já está no formato correto com ponto decimal
  
  return parseFloat(cleanValue) || 0
}
