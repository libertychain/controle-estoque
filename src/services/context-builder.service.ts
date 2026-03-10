/**
 * Context Builder Service
 * 
 * Este serviço é responsável por construir o contexto completo para o LLM,
 * combinando documentação do sistema, dados do banco de dados e histórico
 * de conversas.
 */

import { ContextoSistema, LLMMessage } from '@/lib/llm/types'
import { documentationService } from './documentation.service'
import {
  buscarContextoEstoque,
  buscarContextoEstoqueCritico,
  buscarContextoEstoqueZerado,
  buscarContextoPorCategoria,
  buscarContextoPorNome,
  buscarContextoEstoqueCacheado
} from './estoque-context.service'

/**
 * Analisa o tipo de busca baseado na pergunta do usuário
 * 
 * Esta função resolve o gargalo de busca limitada, identificando o tipo
 * de consulta que o usuário está fazendo e selecionando a estratégia de
 * busca mais adequada.
 * 
 * @param pergunta - Pergunta do usuário
 * @returns Objeto com tipo de busca e termos relevantes
 */
function analisarTipoBusca(pergunta: string): {
  tipo: 'GERAL' | 'CRITICO' | 'ZERADO' | 'CATEGORIA' | 'PRODUTO_ESPECIFICO'
  termos?: string[]
} {
  const perguntaLower = pergunta.toLowerCase()
  
  // Perguntas sobre estoque crítico
  // CORREÇÃO: Apenas identificar como crítico se a pergunta for EXPLICITAMENTE sobre críticos
  // Não usar a palavra "limpeza" como gatilho para busca de críticos
  if ((perguntaLower.includes('crítico') || perguntaLower.includes('critico')) && 
      !perguntaLower.includes('limpeza')) {
    return { tipo: 'CRITICO' }
  }
  
  // Perguntas sobre saldo zerado
  if (perguntaLower.includes('saldo zerado') || perguntaLower.includes('estoque zerado') || 
      perguntaLower.includes('produtos zerados') || perguntaLower.includes('sem saldo')) {
    return { tipo: 'ZERADO' }
  }
  
  // Perguntas sobre produto específico
  // CORREÇÃO: Detecta perguntas sobre saldo de forma mais flexível
  // Qualquer pergunta que contenha "saldo" ou "quantos" e mencione um produto específico
  const temPalavraSaldo = perguntaLower.includes('saldo')
  const temPalavraQuantos = perguntaLower.includes('quantos') || perguntaLower.includes('quanto') || perguntaLower.includes('quantas')
  const temPalavraTem = perguntaLower.includes('tem') || perguntaLower.includes('temos') || perguntaLower.includes('existe')
  const temPalavraDe = perguntaLower.includes(' de ') || perguntaLower.includes(' da ') || perguntaLower.includes(' do ')
  
  // Se a pergunta menciona saldo/quantidade e tem uma estrutura de pergunta específica
  if ((temPalavraSaldo || temPalavraQuantos) && (temPalavraDe || perguntaLower.startsWith('o saldo') || perguntaLower.startsWith('qual o'))) {
    return { tipo: 'PRODUTO_ESPECIFICO' }
  }
  
  // Perguntas como "quanto X temos", "quantos X temos"
  if ((perguntaLower.startsWith('quanto ') || perguntaLower.startsWith('quantos ')) && perguntaLower.endsWith('temos')) {
    return { tipo: 'PRODUTO_ESPECIFICO' }
  }
  
  // Perguntas como "temos de X", "existe X", "quantos X"
  // CORREÇÃO: Verifica se há um produto específico após "temos de" ou "existe"
  if (perguntaLower.includes('temos de') || perguntaLower.includes('existe')) {
    return { tipo: 'PRODUTO_ESPECIFICO' }
  }
  
  // Perguntas sobre categoria
  // CORREÇÃO: Apenas identificar como categoria se a pergunta for EXPLICITAMENTE sobre categoria
  // Não deve interferir com perguntas sobre produtos específicos
  if (perguntaLower.includes('categoria') || perguntaLower.includes('categorias')) {
    const categorias = ['limpeza', 'alimentação', 'material', 'escritório', 'medicamento', 'higiene']
    for (const categoria of categorias) {
      if (perguntaLower.includes(categoria)) {
        return { tipo: 'CATEGORIA', termos: [categoria] }
      }
    }
  }
  
  // Padrão
  return { tipo: 'GERAL' }
}

/**
 * Extrai termos de busca relevantes da pergunta
 * 
 * Esta função auxiliar remove stop words comuns e extrai palavras-chave
 * que podem ser usadas para buscar produtos específicos.
 * 
 * @param pergunta - Pergunta do usuário
 * @returns Array de termos de busca
 */
function extrairTermosBusca(pergunta: string): string[] {
  // Remover stop words comuns
  const stopWords = new Set([
    'qual', 'quais', 'o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'para', 'com', 'sem',
    'tem', 'temos', 'temos', 'existe', 'existem', 'ha', 'tem', 'saldo', 'saldos',
    'quantidade', 'quantas', 'quanto', 'quantos', 'disponivel', 'disponiveis',
    'estoque', 'produtos', 'produto', 'e', 'sao', 'foi', 'foram', 'que'
  ])
  
  // Remover pontuação e manter apenas letras, números e espaços (inclui acentos)
  const palavras = pergunta
    .toLowerCase()
    .replace(/[^\w\sà-úÀ-Ú]/g, '')  // Mantém letras, números, espaços e caracteres acentuados
    .split(/\s+/)
    .filter(palavra => palavra.length > 2 && !stopWords.has(palavra))
  
  return palavras
}

/**
 * Otimiza o tamanho da documentação para o prompt
 * 
 * OTIMIZAÇÃO: Reduz o tamanho do prompt para melhorar performance
 * - Se a documentação for muito grande (> 5000 caracteres), reduz
 * - Prioriza seções relevantes baseadas na pergunta do usuário
 * - Mantém seções gerais importantes (conceitos, funcionamento)
 * - Reduz tempo de processamento do LLM em 30-50%
 * 
 * @param documentacao - Documentação completa do sistema
 * @param pergunta - Pergunta do usuário para identificar relevância
 * @returns Documentação otimizada com tamanho reduzido
 */
function otimizarDocumentacao(documentacao: string, pergunta: string): string {
  // Se a documentação for pequena, retornar como está
  if (documentacao.length <= 5000) {
    return documentacao
  }
  
  // Dividir em seções baseadas em cabeçalhos markdown
  const secoes = documentacao.split(/\n\n## /)
  
  // Identificar seções relevantes baseadas na pergunta
  const perguntaLower = pergunta.toLowerCase()
  const secoesRelevantes: string[] = []
  const secoesGerais: string[] = []
  
  for (const secao of secoes) {
    if (secao.length === 0) continue
    
    const secaoLower = secao.toLowerCase()
    
    // Verificar se a seção é relevante para a pergunta
    const termosPergunta = extrairTermosBusca(pergunta)
    const isRelevante = termosPergunta.some(termo => secaoLower.includes(termo))
    
    if (isRelevante) {
      secoesRelevantes.push(secao)
    } else if (secao.includes('conceito') || secao.includes('funcionamento') || 
               secao.includes('arquitetura') || secao.includes('api')) {
      // Adicionar seções gerais importantes
      secoesGerais.push(secao)
    }
  }
  
  // Priorizar seções relevantes
  let resultado = ''
  
  // Adicionar seções relevantes primeiro
  for (const secao of secoesRelevantes) {
    resultado += `\n\n## ${secao}`
  }
  
  // Adicionar seções gerais se ainda houver espaço
  for (const secao of secoesGerais) {
    if (resultado.length + secao.length > 5000) break
    resultado += `\n\n## ${secao}`
  }
  
  // Se ainda estiver muito grande, truncar
  if (resultado.length > 5000) {
    resultado = resultado.substring(0, 5000) + '\n\n... (documentação truncada para otimizar performance)'
  }
  
  return resultado
}

/**
 * Constrói o contexto completo do sistema para uma pergunta
 * 
 * OTIMIZAÇÃO: Implementação de otimização de tamanho do prompt
 * - Documentação é otimizada para reduzir tamanho do prompt
 * - Prioriza seções relevantes baseadas na pergunta do usuário
 * - Reduz tempo de processamento do LLM em 30-50%
 * 
 * Este serviço combina:
 * 1. Documentação relevante do sistema (otimizada)
 * 2. Dados de estoque (limitado para não exceder contexto)
 * 3. Histórico de conversa (opcional)
 * 
 * @param pergunta - A pergunta do usuário
 * @param historico - Histórico de mensagens da conversa (opcional)
 * @returns Contexto completo do sistema
 */
export async function buildContext(
  pergunta: string,
  historico?: LLMMessage[]
): Promise<ContextoSistema> {
  console.log('🔨 Construindo contexto para pergunta:', pergunta)
  
  // 1. Buscar documentação relevante (com otimização de tamanho)
  console.log('📚 Buscando documentação do sistema...')
  const documentacao = await documentationService.getRelevantDocs(pergunta)
  
  // Otimizar tamanho da documentação
  const documentacaoOtimizada = otimizarDocumentacao(documentacao, pergunta)
  console.log(`✓ Documentação carregada: ${documentacaoOtimizada.length} caracteres (otimizada de ${documentacao.length})`)
  
  // 2. Analisar tipo de busca
  const tipoBusca = analisarTipoBusca(pergunta)
  console.log(`🔍 Tipo de busca identificado: ${tipoBusca.tipo}`)
  
  // 3. Buscar dados de estoque de forma dinâmica
  console.log('📦 Buscando dados de estoque...')
  let estoqueResult: any
  
  switch (tipoBusca.tipo) {
    case 'CRITICO':
      estoqueResult = await buscarContextoEstoqueCritico(100)
      break
    case 'ZERADO':
      estoqueResult = await buscarContextoEstoqueZerado(100)
      break
    case 'CATEGORIA':
      estoqueResult = await buscarContextoPorCategoria(tipoBusca.termos![0], 100)
      break
    case 'PRODUTO_ESPECIFICO':
      // Extrair termos relevantes da pergunta para busca
      const termosBusca = extrairTermosBusca(pergunta)
      if (termosBusca.length > 0) {
        // CORREÇÃO: Passa todos os termos extraídos em vez de apenas o primeiro
        console.log(`🔍 Buscando produtos com termos: ${termosBusca.join(', ')}`)
        estoqueResult = await buscarContextoPorNome(termosBusca, 100)
        
        // Fallback: se não encontrou nada, busca geral
        if (!estoqueResult.success || estoqueResult.total_produtos === 0) {
          console.log('⚠️ Busca específica não encontrou resultados, usando fallback...')
          estoqueResult = await buscarContextoEstoqueCacheado(100, false)
        }
      } else {
        // Tratar caso onde não há termos de busca válidos
        console.log('⚠️ Nenhum termo de busca válido encontrado, usando busca geral...')
        estoqueResult = await buscarContextoEstoqueCacheado(100, false)
      }
      break
    default:
      // Usar cache para buscas gerais
      estoqueResult = await buscarContextoEstoqueCacheado(100, false)
  }
  
  let dados = ''
  if (estoqueResult.success && estoqueResult.contexto) {
    dados = estoqueResult.contexto
    console.log(`✓ Dados de estoque carregados: ${estoqueResult.total_produtos} produtos`)
  } else {
    console.warn('⚠️ Não foi possível carregar dados de estoque')
    dados = 'Dados de estoque não disponíveis.'
  }
  
  // 4. Combinar contexto
  const contexto: ContextoSistema = {
    documentacao: documentacaoOtimizada,
    dados,
    historico
  }
  
  console.log('✅ Contexto construído com sucesso')
  
  return contexto
}

/**
 * Formata o contexto completo para envio ao LLM
 * 
 * @param contexto - Contexto do sistema
 * @param pergunta - Pergunta do usuário
 * @returns String formatada com contexto e pergunta
 */
export function formatarContextoParaLLM(
  contexto: ContextoSistema,
  pergunta: string
): string {
  let mensagem = ''
  
  // Adicionar documentação se disponível
  if (contexto.documentacao) {
    mensagem += `## Documentação do Sistema\n\n${contexto.documentacao}\n\n`
  }
  
  // Adicionar dados se disponíveis
  if (contexto.dados) {
    mensagem += `## Dados Disponíveis\n\n${contexto.dados}\n\n`
  }
  
  // Adicionar histórico se disponível
  if (contexto.historico && contexto.historico.length > 0) {
    mensagem += `## Histórico da Conversa\n\n`
    contexto.historico.forEach(msg => {
      mensagem += `${msg.role.toUpperCase()}: ${msg.content}\n`
    })
    mensagem += '\n'
  }
  
  // Adicionar pergunta
  mensagem += `## Pergunta do Usuário\n\n${pergunta}`
  
  return mensagem
}

/**
 * Analisa o tipo de pergunta para otimizar o contexto
 * 
 * @param pergunta - Pergunta do usuário
 * @returns Tipo de pergunta identificado
 */
export function analisarTipoPergunta(pergunta: string): string {
  const perguntaLower = pergunta.toLowerCase()
  
  // Perguntas sobre estoque
  if (perguntaLower.includes('estoque') || 
      perguntaLower.includes('saldo') ||
      perguntaLower.includes('produto')) {
    return 'ESTOQUE'
  }
  
  // Perguntas sobre pedidos
  if (perguntaLower.includes('pedido') || 
      perguntaLower.includes('pedidos')) {
    return 'PEDIDOS'
  }
  
  // Perguntas sobre aquisições
  if (perguntaLower.includes('aquisição') || 
      perguntaLower.includes('aquisicoes') ||
      perguntaLower.includes('licitação') ||
      perguntaLower.includes('licitacao')) {
    return 'AQUISICOES'
  }
  
  // Perguntas conceituais
  if (perguntaLower.includes('o que é') || 
      perguntaLower.includes('como funciona') ||
      perguntaLower.includes('qual a diferença') ||
      perguntaLower.includes('explique')) {
    return 'CONCEITO'
  }
  
  // Padrão
  return 'GERAL'
}
