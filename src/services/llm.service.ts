/**
 * LLM Service - Integração com Ollama
 *
 * Este serviço fornece funções para interagir com o modelo de linguagem local (Ollama).
 * É utilizado no backend para todas as operações de IA.
 *
 * ATUALIZAÇÃO: Agora usa os novos tipos e prompts do sistema RAG flexível.
 * ATUALIZAÇÃO: Adicionado suporte para integração com contexto RAG.
 */

import { LLMMessage, LLMResponse, LLMConfig } from '@/lib/llm/types'
import { SYSTEM_PROMPT } from '@/lib/llm/prompts'
import { knowledgeBase, ResultadoBusca } from './knowledge-base.service'

const DEFAULT_CONFIG: LLMConfig = {
  model: process.env.LLM_MODEL || 'qwen3:1.7b',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.4'),
  max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '3000'),
  stream: false,
  options: {
    num_ctx: parseInt(process.env.LLM_NUM_CTX || '8192'),
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
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

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
          num_predict: finalConfig.max_tokens
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
 * Normaliza a descrição de um produto
 */
export async function normalizarDescricao(descricao: string): Promise<LLMResponse> {
  const systemPrompt = `Você é um assistente especializado em normalizar descrições de produtos para um sistema de controle de estoque.

Regras:
1. Mantenha as informações essenciais do produto
2. Use terminologia técnica correta
3. Padronize formatação (primeira letra maiúscula, minúsculas para o restante)
4. Remova repetições e redundâncias
5. Se possível, identifique marca, categoria e unidade de medida
6. Retorne apenas JSON válido

Descrição original: {{descricao}}

Responda com o seguinte formato JSON:
{
  "descricao_normalizada": "string",
  "marca_sugerida": "string ou null",
  "categoria_sugerida": "string ou null",
  "unidade_sugerida": "string ou null",
  "palavras_chave": ["string"],
  "confianca": 0.0-1.0,
  "observacoes": "string ou null"
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt.replace('{{descricao}}', descricao)
    },
    {
      role: 'user',
      content: descricao
    }
  ]

  const response = await callOllama(messages, { temperature: 0.2, max_tokens: 500 })

  if (response.success && response.data) {
    try {
      // Try to parse JSON from response
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Interpreta um pedido em linguagem natural
 */
export async function interpretarPedido(texto: string, context?: {
  secretarias?: string[]
  setores?: string[]
}): Promise<LLMResponse> {
  const secretariasList = context?.secretarias?.join(', ') || 'Secretaria de Educação, Secretaria de Saúde, Secretaria de Finanças'
  const setoresList = context?.setores?.join(', ') || 'Departamento de Ensino Fundamental, Departamento de Nutrição, Departamento de Contabilidade'

  const systemPrompt = `Você é um assistente especializado em interpretar pedidos de estoque em linguagem natural.

Pedido do usuário: {{texto}}

Contexto do sistema:
- Secretarias disponíveis: ${secretariasList}
- Setores disponíveis: ${setoresList}

Regras:
1. Identifique a secretaria e setor de destino
2. Extraia todos os produtos e quantidades mencionados
3. Normalize as descrições dos produtos
4. Verifique se há ambiguidades
5. Retorne apenas JSON válido

Responda com:
{
  "secretaria_identificada": "string ou null",
  "setor_identificado": "string ou null",
  "itens": [
    {
      "produto_sugerido": "string",
      "quantidade": number,
      "unidade": "string ou null",
      "observacao": "string ou null",
      "ambiguidade": boolean
    }
  ],
  "resumo": "string",
  "necessita_clarificacao": boolean,
  "perguntas_clarificacao": ["string"]
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt.replace('{{texto}}', texto)
    },
    {
      role: 'user',
      content: texto
    }
  ]

  const response = await callOllama(messages, { temperature: 0.3, max_tokens: 1000 })

  if (response.success && response.data) {
    try {
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Verifica disponibilidade de produtos para um pedido
 */
export async function verificarDisponibilidade(itens: Array<{
  produto_sugerido: string
  quantidade: number
}>, estoque: Array<{
  descricao: string
  saldo_atual: number
  saldo_minimo: number
}>): Promise<LLMResponse> {
  const itensTexto = itens.map(i => `- ${i.produto_sugerido}: ${i.quantidade} unidades`).join('\n')
  const estoqueTexto = estoque.map(e => `- ${e.descricao}: Saldo ${e.saldo_atual} (Mín: ${e.saldo_minimo})`).join('\n')

  const systemPrompt = `Você é um assistente que verifica a disponibilidade de produtos em estoque para um pedido.

Itens solicitados:
${itensTexto}

Estoque atual:
${estoqueTexto}

Regras:
1. Verifique se o saldo atual é suficiente para cada item
2. Calcule quanto será necessário repor
3. Priorize itens críticos (saldo abaixo do mínimo)
4. Retorne apenas JSON válido

Responda com:
{
  "itens_verificados": [
    {
      "produto": "string",
      "quantidade_solicitada": number,
      "saldo_atual": number,
      "disponivel": boolean,
      "quantidade_disponivel": number,
      "saldo_apos_pedido": number,
      "saldo_minimo": number,
      "critico": boolean,
      "acao_recomendada": "ATENDER" | "ATENDER_PARCIAL" | "NAO_ATENDER" | "REPOR"
    }
  ],
  "resumo_pedido": {
    "total_itens": number,
    "itens_disponiveis": number,
    "itens_indisponiveis": number,
    "itens_criticos": number
  },
  "recomendacoes": ["string"],
  "risco": "BAIXO" | "MEDIO" | "ALTO"
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    }
  ]

  const response = await callOllama(messages, { temperature: 0.2, max_tokens: 1000 })

  if (response.success && response.data) {
    try {
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Agrupa itens por fornecedor
 */
export async function agruparPorFornecedor(itens: Array<{
  produto_id: number
  quantidade: number
}>, fornecedores: Array<{
  id: number
  codigo: string
  nome: string
}>): Promise<LLMResponse> {
  const itensTexto = itens.map(i => `- Produto ID ${i.produto_id}: ${i.quantidade} unidades`).join('\n')
  const fornecedoresTexto = fornecedores.map(f => `- ${f.codigo}: ${f.nome}`).join('\n')

  const systemPrompt = `Você é um assistente que agrupa itens de pedido por fornecedor para otimizar entregas.

Itens do pedido:
${itensTexto}

Fornecedores disponíveis:
${fornecedoresTexto}

Regras:
1. Agrupe itens que pertencem ao mesmo fornecedor
2. Considere o fornecedor principal de cada produto
3. Calcule subtotal por fornecedor
4. Retorne apenas JSON válido

Responda com:
{
  "fornecedores": [
    {
      "fornecedor_id": number,
      "fornecedor_nome": "string",
      "fornecedor_cnpj": "string",
      "itens": [
        {
          "produto_codigo": "string",
          "produto_descricao": "string",
          "quantidade": number,
          "preco_unitario": number,
          "subtotal": number
        }
      ],
      "subtotal_pedido": number,
      "prazo_entrega": number
    }
  ],
  "total_geral": number,
  "fornecedores_distintos": number,
  "observacoes": ["string"]
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    }
  ]

  const response = await callOllama(messages, { temperature: 0.2, max_tokens: 800 })

  if (response.success && response.data) {
    try {
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Gera relatório textual
 */
export async function gerarRelatorio(tipo: string, dados: any, detalhes: boolean = true): Promise<LLMResponse> {
  const dadosTexto = typeof dados === 'string' ? dados : JSON.stringify(dados, null, 2)

  const systemPrompt = `Você é um assistente que gera relatórios executivos sobre estoque.

Tipo de relatório: ${tipo}
Dados do estoque:
${dadosTexto}
Detalhes: ${detalhes}

Gere um relatório executivo incluindo:
1. Visão geral
2. Pontos críticos
3. Tendências observadas
4. Recomendações

Use linguagem profissional e executiva.
Máximo 500 palavras.

Responda com:
{
  "relatorio": "string",
  "resumo_executivo": "string",
  "pontos_criticos": ["string"],
  "recomendacoes": ["string"]
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    }
  ]

  const response = await callOllama(messages, { temperature: 0.4, max_tokens: 1500 })

  if (response.success && response.data) {
    try {
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Responde perguntas sobre o sistema (chat)
 *
 * ATUALIZAÇÃO: Agora usa o novo system prompt flexível que permite:
 * - Responder qualquer pergunta relacionada ao sistema
 * - Usar documentação e dados fornecidos
 * - Usar conhecimento externo quando apropriado
 * - Explicar conceitos e funcionamento do sistema
 *
 * @param pergunta - Pergunta do usuário
 * @param contexto - Contexto completo do sistema (documentação + dados)
 * @returns Resposta estruturada do LLM
 */
export async function perguntar(pergunta: string, contexto: string): Promise<LLMResponse> {
  // Usar o novo system prompt flexível
  const systemPrompt = SYSTEM_PROMPT

  // UserMessage contém o contexto e a pergunta
  const userMessage = `CONTEXTO DO SISTEMA:
${contexto}

PERGUNTA: ${pergunta}

Responda com o formato JSON especificado no system prompt.`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userMessage
    }
  ]

  // Usar configuração padrão (llama3:8b com parâmetros otimizados)
  const response = await callOllama(messages)

  if (response.success && response.data) {
    try {
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Gera plano de automação a partir de descrição em texto
 */
export async function gerarPlanoAutomacao(descricao: string): Promise<LLMResponse> {
  const systemPrompt = `Você é um assistente especializado em criar planos de automação web para tarefas administrativas.

Tarefa descrita: {{descricao}}

Contexto:
- Sistema: Sistema de Controle de Estoque
- Automação disponível: Selenium + Selenoid
- Ações possíveis: navegação web, preenchimento de formulários, extração de dados

Gere um plano estruturado em etapas para executar esta tarefa.

Responda com:
{
  "plano_execucao": {
    "objetivo": "string",
    "pre_requisitos": ["string"],
    "etapas": [
      {
        "numero": number,
        "descricao": "string",
        "acao": "NAVEGAR" | "PREENCHER" | "CLICAR" | "EXTRAIR" | "AGUARDAR" | "VALIDAR",
        "detalhes": {},
        "sucesso_criterio": "string"
      }
    ]
  },
  "dados_necessarios": ["string"],
  "erros_possiveis": ["string"],
  "estrategia_fallback": ["string"],
  "estimativa_tempo": "string"
}`

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt.replace('{{descricao}}', descricao)
    }
  ]

  const response = await callOllama(messages, { temperature: 0.3, max_tokens: 2000 })

  if (response.success && response.data) {
    try {
      const jsonMatch = response.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return { success: true, data: parsed }
      }
    } catch (error) {
      console.error('Erro ao parsear JSON da LLM:', error)
    }
  }

  return response
}

/**
 * Gera resposta com contexto RAG
 * 
 * Este método busca contexto relevante na Knowledge Base e o inclui
 * na resposta do LLM para fornecer informações mais precisas.
 * 
 * @param pergunta - Pergunta do usuário
 * @param contexto - Contexto adicional do sistema (opcional)
 * @returns Resposta do LLM com contexto RAG
 */
export async function perguntarComRAG(
  pergunta: string,
  contexto?: string
): Promise<LLMResponse> {
  console.log(`🔍 Buscando contexto RAG para pergunta: "${pergunta}"`)

  // Buscar contexto relevante na Knowledge Base
  const inicioBusca = Date.now()
  const resultadosRAG = await knowledgeBase.buscarContexto(pergunta, 3)
  const tempoBusca = Date.now() - inicioBusca

  console.log(`⏱️  Tempo de busca RAG: ${tempoBusca}ms`)
  console.log(`📊 Contextos encontrados: ${resultadosRAG.length}`)

  // Construir contexto RAG formatado
  let contextoRAG = ''

  if (resultadosRAG.length > 0) {
    contextoRAG = '\n\n## Contexto RAG (Aquisições Relevantes)\n\n'

    resultadosRAG.forEach((resultado, index) => {
      contextoRAG += `### Aquisição ${index + 1}: ${resultado.contexto.aquisicao.numero}\n`
      contextoRAG += `- Fornecedor: ${resultado.contexto.aquisicao.fornecedor}\n`
      contextoRAG += `- Modalidade: ${resultado.contexto.aquisicao.modalidade}\n`
      contextoRAG += `- Score de relevância: ${resultado.score.toFixed(2)}\n\n`

      if (resultado.produtos_relevantes.length > 0) {
        contextoRAG += `**Produtos Relevantes:**\n`
        resultado.produtos_relevantes.forEach(produto => {
          contextoRAG += `- ${produto.descricao}\n`
          contextoRAG += `  Descrição enriquecida: ${produto.descricao_enriquecida}\n`
          contextoRAG += `  Palavras-chave: ${produto.palavras_chave.join(', ')}\n`
          contextoRAG += `  Score: ${produto.score.toFixed(2)}\n\n`
        })
      }
    })

    contextoRAG += '---\n\n'
  }

  // Combinar contexto RAG com contexto adicional
  const contextoCompleto = contextoRAG + (contexto || '')

  // Usar o método perguntar existente com o contexto completo
  const response = await perguntar(pergunta, contextoCompleto)

  // Adicionar metadados sobre o contexto RAG usado
  if (response.success && response.data) {
    response.data.contexto_rag = {
      encontrados: resultadosRAG.length,
      tempo_busca_ms: tempoBusca,
      aquisicoes: resultadosRAG.map(r => ({
        id: r.contexto.aquisicao.id,
        numero: r.contexto.aquisicao.numero,
        score: r.score
      }))
    }
  }

  return response
}
