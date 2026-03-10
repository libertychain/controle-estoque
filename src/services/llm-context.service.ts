/**
 * LLM Context Service - Serviço especializado para geração de contexto RAG
 * 
 * Este serviço fornece funções para gerar contextos enriquecidos para o sistema RAG
 * usando o modelo Qwen2.5-3B via Ollama.
 */

import { LLMMessage, LLMResponse, LLMConfig } from '@/lib/llm/types'

const LLM_CONFIG: LLMConfig = {
  model: process.env.LLM_MODEL || 'qwen2.5:3b',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
  max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
  stream: false,
  options: {
    num_ctx: parseInt(process.env.LLM_NUM_CTX || '4096'),
    top_p: parseFloat(process.env.LLM_TOP_P || '0.9'),
    top_k: parseInt(process.env.LLM_TOP_K || '40')
  }
}

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

/**
 * Faz uma chamada genérica à API do Ollama
 */
async function callOllama(messages: LLMMessage[], config: LLMConfig = {}): Promise<LLMResponse> {
  try {
    const finalConfig = { ...LLM_CONFIG, ...config }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: finalConfig.model,
        messages,
        stream: finalConfig.stream,
        options: {
          temperature: finalConfig.temperature,
          num_predict: finalConfig.max_tokens,
          num_ctx: finalConfig.options?.num_ctx,
          top_p: finalConfig.options?.top_p,
          top_k: finalConfig.options?.top_k
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: data.message?.content || ''
    }
  } catch (error) {
    console.error('Erro ao chamar Ollama:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Interface para produto enriquecido
 */
export interface ProdutoEnriquecido {
  codigo?: string
  descricao: string
  descricao_enriquecida: string
  palavras_chave: string[]
  categoria_sugerida?: string
  aplicacoes: string[]
  tags: string[]
}

/**
 * Interface para resultado de enriquecimento
 */
export interface ResultadoEnriquecimento {
  produtos: ProdutoEnriquecido[]
  erros: Array<{ produto: string; erro: string }>
}

/**
 * Enriquece a descrição de um produto usando o LLM
 * 
 * @param produto - Dados do produto para enriquecer
 * @returns Produto enriquecido com descrição detalhada, palavras-chave, etc.
 */
export async function enriquecerDescricaoProduto(produto: {
  codigo?: string
  descricao: string
  categoria?: string
  unidade?: string
  preco?: number
}): Promise<LLMResponse> {
  const systemPrompt = `Analise este produto e gere uma descrição enriquecida para RAG:

Código: ${produto.codigo || 'N/A'}
Descrição: ${produto.descricao}
Categoria: ${produto.categoria || 'N/A'}
Unidade: ${produto.unidade || 'N/A'}
Preço: ${produto.preco ? `R$ ${produto.preco.toFixed(2)}` : 'N/A'}

Gere:
1. Uma descrição detalhada do produto (50-100 palavras)
2. Palavras-chave relevantes para busca (5-10 termos)
3. Categoria sugerida se não informada
4. Aplicações típicas do produto (3-5 aplicações)
5. Tags úteis para categorização (3-5 tags)

Responda APENAS em JSON válido:
{
  "descricao_enriquecida": "string",
  "palavras_chave": ["string"],
  "categoria_sugerida": "string",
  "aplicacoes": ["string"],
  "tags": ["string"]
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: produto.descricao
    }
  ]

  const response = await callOllama(messages)

  if (response.success && response.data) {
    try {
      // Try to parse JSON from response
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
      
      // JSON não encontrado na resposta
      console.warn('⚠️  LLM não retornou JSON válido:', response.data.substring(0, 200))
      return { 
        success: false, 
        error: 'LLM não retornou JSON válido',
        raw_response: response.data
      }
    } catch (error) {
      console.error('❌ Erro ao parsear JSON da LLM:', error)
      return { 
        success: false, 
        error: `Erro ao parsear JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        raw_response: response.data
      }
    }
  }

  return response
}

/**
 * Enriquece múltiplas descrições de produtos
 * 
 * @param produtos - Lista de produtos para enriquecer
 * @returns Lista de produtos enriquecidos e erros
 */
export async function enriquecerDescricoesProdutos(
  produtos: Array<{
    codigo?: string
    descricao: string
    categoria?: string
    unidade?: string
    preco?: number
  }>
): Promise<ResultadoEnriquecimento> {
  const produtosEnriquecidos: ProdutoEnriquecido[] = []
  const erros: Array<{ produto: string; erro: string }> = []

  console.log(`🔄 Iniciando enriquecimento de ${produtos.length} produtos...`)

  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i]
    console.log(`  [${i + 1}/${produtos.length}] Processando: ${produto.descricao.substring(0, 50)}...`)

    try {
      const resultado = await enriquecerDescricaoProduto(produto)

      if (resultado.success && resultado.data) {
        produtosEnriquecidos.push({
          codigo: produto.codigo,
          descricao: produto.descricao,
          descricao_enriquecida: resultado.data.descricao_enriquecida,
          palavras_chave: resultado.data.palavras_chave || [],
          categoria_sugerida: resultado.data.categoria_sugerida,
          aplicacoes: resultado.data.aplicacoes || [],
          tags: resultado.data.tags || []
        })
      } else {
        erros.push({
          produto: produto.descricao,
          erro: resultado.error || 'Erro desconhecido'
        })
      }
    } catch (error) {
      console.error(`Erro ao processar produto ${produto.descricao}:`, error)
      erros.push({
        produto: produto.descricao,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // Pequeno delay para não sobrecarregar o Ollama
    if (i < produtos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`✅ Enriquecimento concluído: ${produtosEnriquecidos.length} sucesso, ${erros.length} erros`)

  return {
    produtos: produtosEnriquecidos,
    erros
  }
}

/**
 * Extrai palavras-chave de um texto usando TF-IDF simplificado
 * 
 * @param texto - Texto para extrair palavras-chave
 * @param maxKeywords - Número máximo de palavras-chave
 * @returns Lista de palavras-chave
 */
export function extrairPalavrasChave(texto: string, maxKeywords: number = 10): string[] {
  // Normalizar texto: lowercase, remover pontuação
  const textoNormalizado = texto
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Remover stop words em português
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'um', 'uma',
    'os', 'as', 'que', 'é', 'foi', 'se', 'na', 'no', 'como', 'mais', 'mas',
    'não', 'ou', 'se', 'ao', 'pela', 'pelo', 'das', 'dos', 'à', 'às', 'ser',
    'estar', 'ter', 'haver', 'fazer', 'ir', 'vir', 'saber', 'poder', 'querer'
  ])

  // Tokenizar
  const palavras = textoNormalizado.split(' ').filter(palavra => 
    palavra.length > 2 && !stopWords.has(palavra)
  )

  // Contar frequência
  const frequencia = new Map<string, number>()
  palavras.forEach(palavra => {
    frequencia.set(palavra, (frequencia.get(palavra) || 0) + 1)
  })

  // Ordenar por frequência e retornar top N
  return Array.from(frequencia.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([palavra]) => palavra)
}

/**
 * Calcula similaridade entre duas strings usando Jaccard
 * 
 * @param texto1 - Primeiro texto
 * @param texto2 - Segundo texto
 * @returns Score de similaridade (0-1)
 */
export function calcularSimilaridade(texto1: string, texto2: string): number {
  const palavras1 = new Set(extrairPalavrasChave(texto1, 100))
  const palavras2 = new Set(extrairPalavrasChave(texto2, 100))

  const intersecao = new Set([...palavras1].filter(p => palavras2.has(p)))
  const uniao = new Set([...palavras1, ...palavras2])

  return uniao.size > 0 ? intersecao.size / uniao.size : 0
}

/**
 * Busca produtos similares baseados em palavras-chave
 * 
 * @param query - Query de busca
 * @param produtos - Lista de produtos para buscar
 * @param threshold - Limiar de similaridade (0-1)
 * @returns Produtos similares ordenados por relevância
 */
export function buscarProdutosSimilares(
  query: string,
  produtos: ProdutoEnriquecido[],
  threshold: number = 0.3
): Array<{ produto: ProdutoEnriquecido; score: number }> {
  const queryPalavrasChave = extrairPalavrasChave(query, 20)

  return produtos
    .map(produto => {
      // Calcular similaridade baseada em palavras-chave
      const produtoPalavrasChave = [
        ...produto.palavras_chave,
        ...produto.tags,
        ...extrairPalavrasChave(produto.descricao_enriquecida, 20)
      ]

      const querySet = new Set(queryPalavrasChave)
      const produtoSet = new Set(produtoPalavrasChave)

      const intersecao = new Set([...querySet].filter(p => produtoSet.has(p)))
      const uniao = new Set([...querySet, ...produtoSet])

      const score = uniao.size > 0 ? intersecao.size / uniao.size : 0

      return { produto, score }
    })
    .filter(resultado => resultado.score >= threshold)
    .sort((a, b) => b.score - a.score)
}

export default {
  enriquecerDescricaoProduto,
  enriquecerDescricoesProdutos,
  extrairPalavrasChave,
  calcularSimilaridade,
  buscarProdutosSimilares
}
