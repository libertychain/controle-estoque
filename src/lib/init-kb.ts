/**
 * Inicialização da Knowledge Base
 * 
 * Este arquivo implementa um padrão singleton lazy para inicialização da Knowledge Base,
 * garantindo que a inicialização ocorra apenas uma vez e que erros sejam capturados adequadamente.
 */

import { knowledgeBase } from '@/services/knowledge-base.service'

let kbInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * Garante que a Knowledge Base foi inicializada
 * 
 * Usa um padrão singleton lazy para garantir que a inicialização ocorra apenas uma vez.
 * Se a inicialização já estiver em andamento, retorna a mesma Promise.
 * 
 * @returns Promise que resolve quando a Knowledge Base estiver inicializada
 */
export async function ensureKnowledgeBaseInitialized(): Promise<void> {
  // Se já está inicializada, retornar imediatamente
  if (kbInitialized) {
    return
  }

  // Se já está inicializando, retornar a mesma Promise
  if (initializationPromise) {
    return initializationPromise
  }

  // Criar nova Promise de inicialização
  initializationPromise = (async () => {
    try {
      console.log('🔄 Inicializando Knowledge Base (lazy)...')
      await knowledgeBase.inicializar()
      kbInitialized = true
      console.log('✅ Knowledge Base inicializada com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar Knowledge Base:', error)
      throw error
    } finally {
      // Limpar a Promise após conclusão (sucesso ou erro)
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * Força a re-inicialização da Knowledge Base
 * 
 * Útil para testes ou quando a Knowledge Base precisa ser recarregada.
 * 
 * @returns Promise que resolve quando a Knowledge Base estiver re-inicializada
 */
export async function forceReinitializeKnowledgeBase(): Promise<void> {
  kbInitialized = false
  return ensureKnowledgeBaseInitialized()
}
