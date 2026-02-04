/**
 * Produto Search Service
 * 
 * Este serviço fornece funções para buscar produtos no banco de dados
 * baseado em palavras-chave extraídas de perguntas em linguagem natural.
 */

import { db } from '@/lib/db'

export interface ProdutoBusca {
  codigo: string
  descricao: string
  saldo_atual: number
  saldo_minimo: number
  categoria: string
  unidade: string
  marca?: string | null
  localizacao?: string | null
}

export interface ResultadoBusca {
  success: boolean
  produtos?: ProdutoBusca[]
  total_encontrado?: number
  erro?: string
}

/**
 * Remove acentos de uma string (para busca case-insensitive)
 */
function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Extrai palavras-chave de uma pergunta para busca de produtos
 */
function extrairPalavrasChave(pergunta: string): string[] {
  // Palavras irrelevantes para ignorar (stop words)
  const stopWords = new Set([
    'qual', 'quais', 'o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'para', 'com', 'sem',
    'tem', 'temos', 'temos', 'existe', 'existem', 'ha', 'tem', 'saldo', 'saldos',
    'quantidade', 'quantas', 'quanto', 'quantos', 'disponivel', 'disponiveis',
    'estoque', 'produtos', 'produto', 'e', 'sao', 'foi', 'foram'
  ])

  // Termos genéricos que causam falsos positivos (evitar)
  const termosGenericos = new Set([
    'liquido', 'gel', 'ml', 'litro', 'litros', 'l', 'ml', 'embalagem',
    'uso', 'domestico', 'domestica', 'uso', 'para', 'com', 'sem',
    'propriedade', 'propriedades', 'fragrancia', 'fragrancias', 'conforme',
    'solicitacao', 'solicitada', 'solicitado', 'solicitar', 'solicitacao',
    '70', '70o', '70%', 'inpm', 'graduacao', 'graduacao', 'perfume',
    'perfumado', 'perfumada', 'plastico', 'plastica', 'resistente',
    'transparente', 'atoxico', 'atoxica', 'pacote', 'contendo',
    'ml', 'cm', 'mm', 'g', 'kg', 'unidade', 'unidades', 'tipo',
    'tamanho', 'cor', 'capacidade', 'medio', 'media', 'grande',
    'pequeno', 'p', 'm', 'g', 'embalagem', 'original',
    'fabricante', 'fabricante', 'registro', 'anvisa', 'sif', 'data',
    'fabricacao', 'validade', 'lote', 'procedencia', 'informacoes',
    'nutricionais', 'identificacao', 'externamente', 'diaria', 'imediata',
    'fresca', 'fresco', 'maduro', 'maduracao', 'adequado', 'adequada',
    'livre', 'ausente', 'sem', 'com', 'sem', 'contendo', 'sem',
    'congelado', 'nao', 'fermentado', 'conservantes', 'adicao',
    'acucar', 'substancias', 'estranhas', 'devera', 'obtido',
    'partir', 'podendo', 'nao', 'conter', 'ausente', 'livre',
    'lesoes', 'fisicas', 'mecanicos', 'oriundos', 'manuseio',
    'transporte', 'apresentando', 'grau', 'maturacao', 'tal',
    'permita', 'suportar', 'manipulacao', 'conservacao', 'condicoes',
    'apropriadas', 'integras', 'apresentando', 'apresentacao', 'coloracao',
    'uniformes', 'firme', 'intacto', 'enfermidades', 'insetos',
    'sujidades', 'nao', 'devera', 'pesando', 'media', 'especie',
    'vegetal', 'orgao', 'organico', 'lavado', 'in', 'natura',
    'excesso', 'terra', 'insetos', 'debulhado', 'colhidos',
    'dia', 'entrega', 'sabor', 'goiaba', 'caja', 'acerola',
    'maracuja', 'graviola', 'macaxeira', 'mamao', 'papaya',
    'manga', 'melao', 'maca', 'abacate', 'abacaxi', 'alface',
    'lisa', 'crepa', 'beterraba', 'chuchu', 'acelga', 'pimenta',
    'cheiro', 'tangerina', 'alho', 'banana', 'prata', 'kiwi',
    'hortela', 'feijao', 'verde', 'doce', 'caseiro', 'limao',
    'pera', 'mel', 'puro', 'abelha', 'manteiga', 'tipo',
    'terra', 'creme', 'dental', 'adulto', 'fluor', 'algodao',
    'hidrofilo', 'multiplo', 'bolas', 'pacote', 'aromatizante',
    'ambiente', 'aerosol', 'aromas', 'variados', 'lava', 'louca',
    'pasta', 'alto', 'brilho', 'umectante', 'bio', 'amaciante',
    'roupas', 'concentrado', 'vassoura', 'nylon', 'tipo', 'novica',
    'multiuso', 'cabo', 'longo', 'azulim', 'limpa', 'piso',
    'polidor', 'aluminio', 'panelas', 'inseticida', 'aerosol',
    'multi', 'eficaz', 'contra', 'moscas', 'saco', 'lixo',
    'reforcada', 'tamanho', 'cor', 'branca', 'leve', 'mil',
    'unidade', 'no', 'ponto', 'maturacao', 'adequada', 'manchas',
    'odor', 'sabor', 'goiaba', 'caja', 'acerola', 'maracuja',
    'graviola', 'macaxeira', 'mamao', 'papaya', 'manga', 'melao',
    'maca', 'abacate', 'abacaxi', 'alface', 'lisa', 'crepa',
    'beterraba', 'chuchu', 'acelga', 'pimenta', 'cheiro', 'tangerina'
  ])

  // Remover pontuação, converter para minúsculas e remover acentos
  const texto = removerAcentos(pergunta)
    .toLowerCase()
    .replace(/[.,?!;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Extrair palavras com mais de 2 caracteres
  const palavras = texto
    .split(' ')
    .filter(palavra => {
      // Ignorar palavras muito curtas
      if (palavra.length <= 2) return false
      
      // Ignorar stop words
      if (stopWords.has(palavra)) return false
      
      // Ignorar termos genéricos que causam falsos positivos
      if (termosGenericos.has(palavra)) return false
      
      // Ignorar números isolados (ex: 70, 500, etc.)
      if (/^\d+$/.test(palavra)) return false
      
      // Ignorar medidas isoladas (ex: cm, ml, kg, etc.)
      if (/^(cm|mm|g|kg|ml|l|un|m|p)$/i.test(palavra)) return false
      
      return true
    })

  return palavras
}

/**
 * Busca produtos no banco de dados baseado em palavras-chave
 * Nota: SQLite não suporta mode: 'insensitive', então fazemos filtragem em memória
 */
export async function buscarProdutosPorPalavrasChave(
  palavrasChave: string[],
  limite: number = 10
): Promise<ResultadoBusca> {
  try {
    if (palavrasChave.length === 0) {
      return {
        success: false,
        erro: 'Nenhuma palavra-chave fornecida para busca'
      }
    }

    // Buscar todos os produtos ativos (para filtragem em memória)
    const todosProdutos = await db.produto.findMany({
      where: {
        ativo: true
      },
      include: {
        categoria: {
          select: {
            nome: true
          }
        },
        unidade: {
          select: {
            sigla: true
          }
        },
        marca: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        saldo_atual: 'desc'
      }
    })

    // Filtrar produtos em memória usando busca case-insensitive com acentos removidos
    const produtosFiltrados = todosProdutos.filter(p => {
      const codigoNormalizado = removerAcentos(p.codigo.toLowerCase())
      const descricaoNormalizada = removerAcentos(p.descricao.toLowerCase())
      const categoriaNormalizada = removerAcentos(p.categoria.nome.toLowerCase())
      
      // Verificar se alguma palavra-chave está presente em código, descrição ou categoria
      return palavrasChave.some(palavra => 
        codigoNormalizado.includes(palavra) ||
        descricaoNormalizada.includes(palavra) ||
        categoriaNormalizada.includes(palavra)
      )
    })

    // Limitar resultado
    const produtos = produtosFiltrados.slice(0, limite)

    const produtosBusca: ProdutoBusca[] = produtos.map(p => ({
      codigo: p.codigo,
      descricao: p.descricao,
      saldo_atual: p.saldo_atual,
      saldo_minimo: p.saldo_minimo,
      categoria: p.categoria.nome,
      unidade: p.unidade.sigla,
      marca: p.marca?.nome,
      localizacao: p.localizacao
    }))

    return {
      success: true,
      produtos: produtosBusca,
      total_encontrado: produtos.length
    }
  } catch (error) {
    console.error('Erro ao buscar produtos por palavras-chave:', error)
    return {
      success: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao buscar produtos'
    }
  }
}

/**
 * Busca produtos baseado em uma pergunta em linguagem natural
 */
export async function buscarProdutosPorPergunta(
  pergunta: string,
  limite: number = 10
): Promise<ResultadoBusca> {
  const palavrasChave = extrairPalavrasChave(pergunta)
  console.log(`🔍 Palavras-chave extraídas: ${palavrasChave.join(', ')}`)
  
  return buscarProdutosPorPalavrasChave(palavrasChave, limite)
}

/**
 * Formata produtos encontrados como string para contexto do LLM
 */
export function formatarProdutosParaContexto(produtos: ProdutoBusca[]): string {
  if (produtos.length === 0) {
    return 'NENHUM PRODUTO ENCONTRADO.'
  }

  const linhas = produtos.map(p => {
    let linha = `[${p.codigo}] ${p.descricao} | Saldo: ${p.saldo_atual} ${p.unidade} | Mínimo: ${p.saldo_minimo} ${p.unidade} | Categoria: ${p.categoria}`
    
    if (p.saldo_atual <= p.saldo_minimo) {
      linha += ' | ESTOQUE CRÍTICO'
    }
    
    return linha
  })

  return `=== PRODUTOS ENCONTRADOS: ${produtos.length} ===\n${linhas.join('\n')}`
}
