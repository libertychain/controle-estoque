/**
 * Tipos TypeScript para o sistema LLM
 * 
 * Este arquivo define as interfaces e tipos utilizados
 * em todo o sistema de assistente LLM baseado em RAG.
 */

/**
 * Representa uma mensagem no formato de chat do LLM
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Contexto completo do sistema que será enviado ao LLM
 */
export interface ContextoSistema {
  documentacao: string
  dados: string
  historico?: LLMMessage[]
}

/**
 * Resposta estruturada do LLM
 */
export interface RespostaLLM {
  resposta: string
  contexto_utilizado: {
    tipo_resposta: string
    dados_utilizados: string[]
  }
  acoes_sugeridas?: string[] | null
}

/**
 * Configuração do modelo LLM
 */
export interface LLMConfig {
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  options?: {
    num_ctx?: number
    top_p?: number
    top_k?: number
  }
}

/**
 * Resposta genérica da API do LLM
 */
export interface LLMResponse {
  success: boolean
  data?: any
  error?: string
  raw_response?: string
}
