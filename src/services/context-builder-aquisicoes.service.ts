/**
 * Context Builder para Aquisições - Serviço para gerar contexto RAG de aquisições
 * 
 * Este serviço processa aquisições e gera contextos enriquecidos para o sistema RAG,
 * usando o LLM para enriquecer descrições de produtos e criar estruturas padronizadas.
 */

import { db } from '@/lib/db'
import { 
  enriquecerDescricoesProdutos, 
  ProdutoEnriquecido,
  ResultadoEnriquecimento 
} from './llm-context.service'

/**
 * Interface para contexto RAG de aquisição
 */
export interface ContextoRAGAquisicao {
  aquisicao: {
    id: number
    numero: string
    modalidade: string
    fornecedor: string
    fornecedor_id: number
    data_inicio: string | null
    data_fim: string | null
    numero_contrato: string | null
  }
  produtos: Array<{
    codigo?: string
    descricao: string
    descricao_enriquecida: string
    palavras_chave: string[]
    categoria?: string
    unidade: string
    preco_unitario: number
    quantidade_contratada: number
    aplicacoes: string[]
    tags: string[]
  }>
  metadados: {
    data_geracao: string
    tipo: string
    versao: string
    total_produtos: number
    valor_total: number
  }
}

/**
 * Resultado do processamento de aquisição
 */
export interface ResultadoProcessamentoAquisicao {
  sucesso: boolean
  aquisicao_id: number
  contexto?: ContextoRAGAquisicao
  erro?: string
  tempo_processamento: number
}

/**
 * Classe responsável por construir contextos RAG para aquisições
 */
export class ContextBuilderAquisicoes {
  /**
   * Processa uma aquisição e gera o contexto RAG
   * 
   * @param aquisicaoId - ID da aquisição para processar
   * @returns Resultado do processamento
   */
  async processarAquisicao(aquisicaoId: number): Promise<ResultadoProcessamentoAquisicao> {
    const inicio = Date.now()
    console.log(`🔄 Iniciando processamento da aquisição ${aquisicaoId}...`)

    try {
      // Buscar aquisição com produtos
      const aquisicao = await db.aquisicao.findUnique({
        where: { id: aquisicaoId },
        include: {
          fornecedor: true,
          produtos: true
        }
      })

      if (!aquisicao) {
        throw new Error(`Aquisição ${aquisicaoId} não encontrada`)
      }

      if (!aquisicao.produtos || aquisicao.produtos.length === 0) {
        throw new Error(`Aquisição ${aquisicaoId} não possui produtos`)
      }

      console.log(`  📦 Aquisição encontrada: ${aquisicao.numero_proc} com ${aquisicao.produtos.length} produtos`)

      // Enriquecer descrições dos produtos
      const produtosParaEnriquecer = aquisicao.produtos.map(p => ({
        codigo: `PAQ-${aquisicao.id}-${p.id}`,
        descricao: p.descricao,
        categoria: undefined,
        unidade: p.unidade,
        preco: p.preco_unitario
      }))

      console.log(`  🤖 Enviando ${produtosParaEnriquecer.length} produtos para enriquecimento...`)
      const resultadoEnriquecimento: ResultadoEnriquecimento = 
        await enriquecerDescricoesProdutos(produtosParaEnriquecer)

      // Logar erros de enriquecimento
      if (resultadoEnriquecimento.erros.length > 0) {
        console.warn(`  ⚠️  ${resultadoEnriquecimento.erros.length} produtos com erro de enriquecimento:`)
        resultadoEnriquecimento.erros.forEach(erro => {
          console.warn(`    - ${erro.produto.substring(0, 50)}...: ${erro.erro}`)
        })
      }

      // Criar estrutura de contexto RAG
      const contexto = this.gerarEstruturaContexto(aquisicao, resultadoEnriquecimento.produtos)

      const tempoProcessamento = Date.now() - inicio
      console.log(`✅ Processamento concluído em ${tempoProcessamento}ms`)

      return {
        sucesso: true,
        aquisicao_id: aquisicaoId,
        contexto,
        tempo_processamento: tempoProcessamento
      }
    } catch (error) {
      const tempoProcessamento = Date.now() - inicio
      console.error(`❌ Erro ao processar aquisição ${aquisicaoId}:`, error)

      return {
        sucesso: false,
        aquisicao_id: aquisicaoId,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        tempo_processamento: tempoProcessamento
      }
    }
  }

  /**
   * Gera a estrutura JSON padronizada para RAG
   * 
   * @param aquisicao - Dados da aquisição
   * @param produtosEnriquecidos - Produtos com descrições enriquecidas
   * @returns Estrutura de contexto RAG
   */
  private gerarEstruturaContexto(
    aquisicao: any,
    produtosEnriquecidos: ProdutoEnriquecido[]
  ): ContextoRAGAquisicao {
      const produtos = aquisicao.produtos.map((produto: any, index: number) => {
      const produtoEnriquecido = produtosEnriquecidos[index]
      
      return {
        codigo: produtoEnriquecido?.codigo,
        descricao: produto.descricao,
        descricao_enriquecida: produtoEnriquecido?.descricao_enriquecida || produto.descricao,
        palavras_chave: produtoEnriquecido?.palavras_chave || [],
        categoria: produtoEnriquecido?.categoria_sugerida,
        unidade: produto.unidade,
        preco_unitario: produto.preco_unitario,
        quantidade_contratada: produto.quantidade,
        aplicacoes: produtoEnriquecido?.aplicacoes || [],
        tags: produtoEnriquecido?.tags || []
      }
    })

    const valorTotal = produtos.reduce(
      (total: number, p: any) => total + (p.preco_unitario * p.quantidade_contratada),
      0
    )

    return {
      aquisicao: {
        id: aquisicao.id,
        numero: aquisicao.numero_proc,
        modalidade: aquisicao.modalidade,
        fornecedor: aquisicao.fornecedor.nome,
        fornecedor_id: aquisicao.fornecedor.id,
        data_inicio: aquisicao.data_inicio?.toISOString() || null,
        data_fim: aquisicao.data_fim?.toISOString() || null,
        numero_contrato: aquisicao.numero_contrato
      },
      produtos,
      metadados: {
        data_geracao: new Date().toISOString(),
        tipo: 'AQUISICAO',
        versao: '1.0',
        total_produtos: produtos.length,
        valor_total: valorTotal
      }
    }
  }

  /**
   * Processa múltiplas aquisições em lote
   * 
   * @param aquisicaoIds - Lista de IDs de aquisições para processar
   * @returns Lista de resultados de processamento
   */
  async processarLoteAquisicoes(aquisicaoIds: number[]): Promise<ResultadoProcessamentoAquisicao[]> {
    console.log(`🔄 Iniciando processamento em lote de ${aquisicaoIds.length} aquisições...`)
    
    const resultados: ResultadoProcessamentoAquisicao[] = []

    for (let i = 0; i < aquisicaoIds.length; i++) {
      const aquisicaoId = aquisicaoIds[i]
      console.log(`\n[${i + 1}/${aquisicaoIds.length}] Processando aquisição ${aquisicaoId}...`)
      
      const resultado = await this.processarAquisicao(aquisicaoId)
      resultados.push(resultado)

      // Pequeno delay entre aquisições para não sobrecarregar o Ollama
      if (i < aquisicaoIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    const sucesso = resultados.filter(r => r.sucesso).length
    const falhas = resultados.filter(r => !r.sucesso).length

    console.log(`\n✅ Processamento em lote concluído: ${sucesso} sucesso, ${falhas} falhas`)

    return resultados
  }

  /**
   * Busca aquisições que ainda não possuem contexto gerado
   * 
   * @returns Lista de IDs de aquisições sem contexto
   */
  async buscarAquisicoesSemContexto(): Promise<number[]> {
    // Buscar todas as aquisições ativas
    const aquisicoes = await db.aquisicao.findMany({
      where: {
        ativo: true
      },
      select: {
        id: true
      },
      orderBy: {
        criado_em: 'asc'
      }
    })

    // TODO: Filtrar aquisições que já têm contexto RAG quando a migração for aplicada
    return aquisicoes.map(a => a.id)
  }

  /**
   * Busca aquisições que precisam de reprocessamento
   * (contexto gerado há mais de X dias)
   * 
   * @param dias - Número de dias para considerar desatualizado
   * @returns Lista de IDs de aquisições para reprocessar
   */
  async buscarAquisicoesParaReprocessar(dias: number = 30): Promise<number[]> {
    // TODO: Implementar quando a migração for aplicada
    return []
  }
}

// Exportar instância única (singleton)
export const contextBuilderAquisicoes = new ContextBuilderAquisicoes()

export default contextBuilderAquisicoes
