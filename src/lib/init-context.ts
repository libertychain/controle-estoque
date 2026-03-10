/**
 * Contexto de Inicialização - Inicialização Eager da Knowledge Base
 * 
 * Este módulo garante que a Knowledge Base seja inicializada antes do primeiro
 * request da aplicação, eliminando a latência de inicialização lazy.
 * 
 * Funcionalidades:
 * - Inicialização assíncrona para não bloquear o servidor
 * - Tratamento de erros robusto
 * - Logs detalhados para monitoramento
 * - Re-inicialização em caso de falha
 */

import { knowledgeBase } from '@/services/knowledge-base.service'

/**
 * Inicializa a Knowledge Base de forma assíncrona
 * 
 * Esta função deve ser chamada durante a inicialização da aplicação
 * para garantir que o índice de busca esteja pronto antes do primeiro request.
 */
export async function inicializarKnowledgeBase(): Promise<void> {
  console.log('🚀 Iniciando inicialização da Knowledge Base...')

  try {
    // Inicializar a Knowledge Base
    await knowledgeBase.inicializar()
    console.log('✅ Knowledge Base inicializada com sucesso')
  } catch (error) {
    console.error('❌ Erro fatal ao inicializar Knowledge Base:', error)
    throw error
  }
}

/**
 * Inicializa a Knowledge Base com retry automático
 * 
 * Tenta inicializar a Knowledge Base com múltiplas tentativas em caso de falha.
 * Útil para ambientes de produção onde a inicialização pode falhar temporariamente.
 * 
 * @param maxTentativas - Número máximo de tentativas (padrão: 3)
 * @param intervalo - Intervalo entre tentativas em milissegundos (padrão: 5000)
 * @returns Promise que resolve quando a inicialização é bem-sucedida
 */
export async function inicializarKnowledgeBaseComRetry(
  maxTentativas: number = 3,
  intervalo: number = 5000
): Promise<void> {
  let tentativas = 0
  let erro: Error | null = null

  while (tentativas < maxTentativas) {
    tentativas++
    console.log(`🔄 Tentativa ${tentativas}/${maxTentativas} de inicializar Knowledge Base...`)

    try {
      await inicializarKnowledgeBase()
      console.log(`✅ Inicialização concluída após ${tentativas} tentativa(s)`)
      return
    } catch (error) {
      erro = error as Error
      console.error(`❌ Tentativa ${tentativas} falhou:`, erro.message)

      if (tentativas < maxTentativas) {
        console.log(`⏳ Aguardando ${intervalo}ms antes da próxima tentativa...`)
        await new Promise(resolve => setTimeout(resolve, intervalo))
      }
    }
  }

  console.error(`❌ Falha ao inicializar Knowledge Base após ${maxTentativas} tentativas`)
  throw erro || new Error('Erro desconhecido ao inicializar Knowledge Base')
}

/**
 * Verifica se a Knowledge Base já foi inicializada
 * 
 * @returns true se inicializada, false caso contrário
 */
export function isKnowledgeBaseInicializada(): boolean {
  const stats = knowledgeBase.getEstatisticas()
  return stats.inicializado
}

/**
 * Obtém estatísticas da inicialização da Knowledge Base
 *
 * @returns Estatísticas da inicialização
 */
export function getEstatisticasInicializacao(): {
  inicializada: boolean
  total_contextos: number
  total_palavras_chave: number
} {
  const stats = knowledgeBase.getEstatisticas()
  return {
    inicializada: stats.inicializado,
    total_contextos: stats.total_contextos,
    total_palavras_chave: stats.total_palavras_chave
  }
}
