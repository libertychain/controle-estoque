/**
 * Knowledge Base Service - Serviço para gerenciar base de conhecimento RAG
 * 
 * Este serviço gerencia o armazenamento e recuperação de contextos RAG,
 * mantendo índices de busca em memória para performance.
 * 
 * OTIMIZAÇÃO DE INICIALIZAÇÃO:
 * - A Knowledge Base usa inicialização lazy (on-first-request)
 * - Isso pode causar latência na primeira requisição após o servidor iniciar
 * - Para evitar isso, chame `knowledgeBase.inicializar()` durante a inicialização da aplicação
 * - Exemplo: em `src/lib/init-context.ts` ou no arquivo de inicialização do servidor
 * 
 * Exemplo de uso:
 * ```typescript
 * // Durante a inicialização da aplicação
 * await knowledgeBase.inicializar()
 * ```
 */

import { db } from '@/lib/db'
import { ContextoRAGAquisicao } from './context-builder-aquisicoes.service'
import { extrairPalavrasChave, buscarProdutosSimilares } from './llm-context.service'

/**
 * Interface para resultado de busca
 */
export interface ResultadoBusca {
  contexto: ContextoRAGAquisicao
  score: number
  produtos_relevantes: Array<{
    descricao: string
    descricao_enriquecida: string
    palavras_chave: string[]
    score: number
  }>
}

/**
 * Interface para índice de busca
 */
interface IndiceBusca {
  aquisicao_id: number
  palavras_chave: Set<string>
  produtos: Array<{
    id: number
    descricao: string
    descricao_enriquecida: string
    palavras_chave: string[]
    tags: string[]
  }>
}

/**
 * Classe responsável por gerenciar a base de conhecimento RAG
 * 
 * Este sistema implementa:
 * - Persistência no banco de dados usando o modelo ContextoRAG
 * - Índice de busca em memória para performance
 * - Carregamento automático de contextos ao inicializar
 * - Upsert de contextos (cria ou atualiza se já existe)
 * 
 * @stable
 */
export class KnowledgeBase {
  private readonly MAX_INDICE_SIZE = 10000  // Limite máximo de entradas no índice
  private indice: Map<number, IndiceBusca> = new Map()
  private inicializado: boolean = false

  /**
   * Inicializa a base de conhecimento carregando os contextos existentes
   */
  async inicializar(): Promise<void> {
    if (this.inicializado) {
      console.log('📚 Knowledge Base já inicializada')
      return
    }

    console.log('🔄 Inicializando Knowledge Base...')
    
    try {
      // Carregar contextos do banco de dados
      const contextos = await db.contextoRAG.findMany({
        include: {
          aquisicao: true
        }
      })

      contextos.forEach(contexto => {
        try {
          const contextoParsed = JSON.parse(contexto.dados) as ContextoRAGAquisicao
          this.buildSearchIndex(contexto.aquisicao_id, contextoParsed)
        } catch (error) {
          console.error(`❌ Erro ao processar contexto da aquisição ${contexto.aquisicao_id}:`, error)
        }
      })

      this.inicializado = true
      console.log(`✅ Knowledge Base inicializada com sucesso (${contextos.length} contextos carregados)`)
    } catch (error) {
      console.error('❌ Erro ao inicializar Knowledge Base:', error)
    }
  }

  /**
   * Salva um contexto RAG no banco de dados
   * 
   * @param aquisicaoId - ID da aquisição
   * @param contexto - Contexto RAG completo
   * @returns Contexto salvo
   */
  async salvarContexto(
    aquisicaoId: number,
    contexto: ContextoRAGAquisicao
  ): Promise<any> {
    console.log(`💾 Salvando contexto para aquisição ${aquisicaoId}...`)

    try {
      // Salvar no banco de dados usando upsert (cria ou atualiza se já existe)
      const contextoSalvo = await db.contextoRAG.upsert({
        where: { aquisicao_id: aquisicaoId },
        create: {
          aquisicao_id: aquisicaoId,
          dados: JSON.stringify(contexto),
          versao: contexto.metadados.versao,
          metadados: JSON.stringify({
            total_produtos: contexto.metadados.total_produtos,
            valor_total: contexto.metadados.valor_total
          })
        },
        update: {
          dados: JSON.stringify(contexto),
          versao: contexto.metadados.versao,
          metadados: JSON.stringify({
            total_produtos: contexto.metadados.total_produtos,
            valor_total: contexto.metadados.valor_total
          }),
          data_atualizacao: new Date()
        }
      })

      // Atualizar aquisição
      await db.aquisicao.update({
        where: { id: aquisicaoId },
        data: {
          contexto_gerado: true,
          contexto_data: new Date(),
          contexto_versao: contexto.metadados.versao
        }
      })

      // Construir índice de busca
      this.buildSearchIndex(aquisicaoId, contexto)

      console.log(`✅ Contexto salvo com sucesso (ID: ${contextoSalvo.id})`)
      return contexto
    } catch (error) {
      console.error(`❌ Erro ao salvar contexto para aquisição ${aquisicaoId}:`, error)
      throw error
    }
  }

  /**
   * Busca contexto por ID da aquisição
   * 
   * @param aquisicaoId - ID da aquisição
   * @returns Contexto RAG ou null
   */
  async getContextoPorAquisicao(aquisicaoId: number): Promise<ContextoRAGAquisicao | null> {
    try {
      // Buscar do banco de dados
      const contextoDB = await db.contextoRAG.findUnique({
        where: { aquisicao_id: aquisicaoId }
      })

      if (!contextoDB) {
        return null
      }

      return JSON.parse(contextoDB.dados) as ContextoRAGAquisicao
    } catch (error) {
      console.error(`❌ Erro ao buscar contexto para aquisição ${aquisicaoId}:`, error)
      return null
    }
  }

  /**
   * Busca contextos relevantes para uma query
   * 
   * @param query - Query de busca
   * @param limite - Número máximo de resultados
   * @returns Lista de contextos relevantes ordenados por score
   */
  async buscarContexto(query: string, limite: number = 5): Promise<ResultadoBusca[]> {
    console.log(`🔍 Buscando contexto para query: "${query}"`)

    if (!this.inicializado) {
      await this.inicializar()
    }

    // Extrair palavras-chave da query
    const queryPalavrasChave = extrairPalavrasChave(query, 20)
    console.log(`  📝 Palavras-chave da query: ${queryPalavrasChave.join(', ')}`)

    // Buscar em todos os contextos indexados
    const resultados: ResultadoBusca[] = []

    for (const [aquisicaoId, indice] of this.indice.entries()) {
      // Calcular score da aquisição baseado em palavras-chave
      const aquisicaoScore = this.calcularScoreAquisicao(queryPalavrasChave, indice)

      if (aquisicaoScore > 0) {
        // Buscar produtos relevantes
        const produtosRelevantes = buscarProdutosSimilares(
          query,
          indice.produtos.map(p => ({
            codigo: '',
            descricao: p.descricao,
            descricao_enriquecida: p.descricao_enriquecida,
            palavras_chave: p.palavras_chave,
            aplicacoes: [],
            tags: p.tags
          })),
          0.2
        )

        if (produtosRelevantes.length > 0) {
          // Buscar contexto completo do banco de dados
          const contexto = await this.getContextoPorAquisicao(aquisicaoId)
          
          let contextoParaUsar: ContextoRAGAquisicao
          
          if (!contexto) {
            // Se não encontrar contexto no banco, cria um contexto parcial
            contextoParaUsar = {
              aquisicao: {
                id: aquisicaoId,
                numero: '',
                modalidade: '',
                fornecedor: '',
                fornecedor_id: 0,
                data_inicio: null,
                data_fim: null,
                numero_contrato: null
              },
              produtos: produtosRelevantes.map(p => ({
                descricao: p.produto.descricao,
                descricao_enriquecida: p.produto.descricao_enriquecida,
                palavras_chave: p.produto.palavras_chave,
                unidade: '',
                preco_unitario: 0,
                quantidade_contratada: 0,
                aplicacoes: p.produto.aplicacoes,
                tags: p.produto.tags
              })),
              metadados: {
                data_geracao: new Date().toISOString(),
                tipo: 'AQUISICAO',
                versao: '1.0',
                total_produtos: produtosRelevantes.length,
                valor_total: 0
              }
            }
          } else {
            contextoParaUsar = contexto
          }

          resultados.push({
            contexto: contextoParaUsar,
            score: aquisicaoScore,
            produtos_relevantes: produtosRelevantes.map(p => ({
              descricao: p.produto.descricao,
              descricao_enriquecida: p.produto.descricao_enriquecida,
              palavras_chave: p.produto.palavras_chave,
              score: p.score
            }))
          })
        }
      }
    }

    // Ordenar por score e limitar resultados
    const resultadosOrdenados = resultados
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)

    console.log(`✅ Encontrados ${resultadosOrdenados.length} contextos relevantes`)
    return resultadosOrdenados
  }

  /**
   * Constrói índice de busca para um contexto
   * 
   * @param aquisicaoId - ID da aquisição
   * @param contexto - Contexto RAG
   */
  private buildSearchIndex(aquisicaoId: number, contexto: ContextoRAGAquisicao): void {
    // Verificar limite antes de adicionar nova entrada
    if (this.indice.size >= this.MAX_INDICE_SIZE) {
      console.warn(`⚠️  Índice atingiu limite de ${this.MAX_INDICE_SIZE} entradas, removendo entrada mais antiga`)
      
      // Remover a primeira entrada (FIFO - First In, First Out)
      const firstKey = this.indice.keys().next().value
      if (firstKey !== undefined) {
        this.indice.delete(firstKey)
      }
    }

    const palavrasChave = new Set<string>()

    // Extrair palavras-chave da aquisição
    palavrasChave.add(contexto.aquisicao.numero.toLowerCase())
    palavrasChave.add(contexto.aquisicao.modalidade.toLowerCase())
    palavrasChave.add(contexto.aquisicao.fornecedor.toLowerCase())

    // Extrair palavras-chave dos produtos
    const produtos = contexto.produtos.map(p => ({
      id: 0,
      descricao: p.descricao,
      descricao_enriquecida: p.descricao_enriquecida,
      palavras_chave: p.palavras_chave,
      tags: p.tags
    }))

    produtos.forEach(produto => {
      produto.palavras_chave.forEach(palavra => {
        palavrasChave.add(palavra.toLowerCase())
      })
      produto.tags.forEach(tag => {
        palavrasChave.add(tag.toLowerCase())
      })
    })

    // Adicionar ao índice
    this.indice.set(aquisicaoId, {
      aquisicao_id: aquisicaoId,
      palavras_chave: palavrasChave,
      produtos
    })

    console.log(`  📊 Índice criado para aquisição ${aquisicaoId} com ${palavrasChave.size} palavras-chave`)
  }

  /**
   * Calcula score de relevância de uma aquisição para a query
   * 
   * @param queryPalavrasChave - Palavras-chave da query
   * @param indice - Índice da aquisição
   * @returns Score de relevância (0-1)
   */
  private calcularScoreAquisicao(
    queryPalavrasChave: string[],
    indice: IndiceBusca
  ): number {
    const querySet = new Set(queryPalavrasChave)
    const indiceSet = indice.palavras_chave

    // Calcular interseção
    const intersecao = new Set([...querySet].filter(p => indiceSet.has(p)))
    
    // Calcular Jaccard similarity
    const uniao = new Set([...querySet, ...indiceSet])
    const score = uniao.size > 0 ? intersecao.size / uniao.size : 0

    return score
  }

  /**
   * Limpa o índice de busca
   */
  limparIndice(): void {
    this.indice.clear()
    this.inicializado = false
    console.log('🗑️  Índice de busca limpo')
  }

  /**
   * Retorna estatísticas da base de conhecimento
   * 
   * @returns Estatísticas
   */
  getEstatisticas(): {
    total_contextos: number
    total_palavras_chave: number
    inicializado: boolean
  } {
    let totalPalavrasChave = 0

    for (const indice of this.indice.values()) {
      totalPalavrasChave += indice.palavras_chave.size
    }

    return {
      total_contextos: this.indice.size,
      total_palavras_chave: totalPalavrasChave,
      inicializado: this.inicializado
    }
  }
}

// Exportar instância única (singleton)
export const knowledgeBase = new KnowledgeBase()

export default knowledgeBase
