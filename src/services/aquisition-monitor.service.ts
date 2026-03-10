/**
 * Aquisition Monitor Service - Serviço para monitorar aquisições e gerar contexto RAG
 * 
 * Este serviço verifica periodicamente novas aquisições e dispara a geração
 * de contexto RAG para aquelas que ainda não foram processadas.
 */

import { contextBuilderAquisicoes } from './context-builder-aquisicoes.service'
import { knowledgeBase } from './knowledge-base.service'

/**
 * Configuração do monitor
 */
interface MonitorConfig {
  intervaloVerificacao: number // em milissegundos
  maxProcessamentosPorCiclo: number
  habilitado: boolean
}

/**
 * Estatísticas do monitor
 */
interface MonitorStats {
  iniciado_em: Date | null
  ultimo_ciclo: Date | null
  total_ciclos: number
  total_processados: number
  total_sucesso: number
  total_falhas: number
}

/**
 * Classe responsável por monitorar aquisições e gerar contexto RAG
 */
export class AquisitionMonitor {
  private config: MonitorConfig = {
    intervaloVerificacao: 5 * 60 * 1000, // 5 minutos
    maxProcessamentosPorCiclo: 5,
    habilitado: true
  }

  private stats: MonitorStats = {
    iniciado_em: null,
    ultimo_ciclo: null,
    total_ciclos: 0,
    total_processados: 0,
    total_sucesso: 0,
    total_falhas: 0
  }

  private intervalId: NodeJS.Timeout | null = null
  private executando: boolean = false

  /**
   * Inicia o monitoramento de aquisições
   * 
   * @param config - Configuração opcional do monitor
   */
  startMonitoring(config?: Partial<MonitorConfig>): void {
    if (this.executando) {
      console.log('⚠️  Monitor já está em execução')
      return
    }

    // Atualizar configuração se fornecida
    if (config) {
      this.config = { ...this.config, ...config }
    }

    if (!this.config.habilitado) {
      console.log('⚠️  Monitor está desabilitado')
      return
    }

    console.log('🚀 Iniciando monitor de aquisições...')
    console.log(`  📊 Intervalo de verificação: ${this.config.intervaloVerificacao / 1000} segundos`)
    console.log(`  📊 Max processamentos por ciclo: ${this.config.maxProcessamentosPorCiclo}`)

    this.stats.iniciado_em = new Date()
    this.executando = true

    // Executar verificação imediata
    this.checkNewAquisitions()

    // Configurar verificação periódica
    this.intervalId = setInterval(() => {
      this.checkNewAquisitions()
    }, this.config.intervaloVerificacao)

    console.log('✅ Monitor de aquisições iniciado com sucesso')
  }

  /**
   * Para o monitoramento de aquisições
   */
  stopMonitoring(): void {
    if (!this.executando) {
      console.log('⚠️  Monitor não está em execução')
      return
    }

    console.log('🛑 Parando monitor de aquisições...')

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.executando = false
    console.log('✅ Monitor de aquisições parado com sucesso')
  }

  /**
   * Verifica novas aquisições e processa aquelas sem contexto
   */
  private async checkNewAquisitions(): Promise<void> {
    this.executando = true
    const inicioCiclo = Date.now()

    console.log('\n' + '='.repeat(80))
    console.log(`🔄 Iniciando ciclo de verificação #${this.stats.total_ciclos + 1}`)
    console.log(`  🕐 Hora: ${new Date().toLocaleString('pt-BR')}`)
    console.log('='.repeat(80))

    try {
      // Buscar aquisições sem contexto
      const aquisicoesSemContexto = 
        await contextBuilderAquisicoes.buscarAquisicoesSemContexto()

      console.log(`  📦 Aquisições sem contexto: ${aquisicoesSemContexto.length}`)

      if (aquisicoesSemContexto.length === 0) {
        console.log('  ✅ Nenhuma aquisição pendente de processamento')
      } else {
        // Limitar número de processamentos por ciclo
        const paraProcessar = aquisicoesSemContexto.slice(
          0,
          this.config.maxProcessamentosPorCiclo
        )

        console.log(`  🔄 Processando ${paraProcessar.length} aquisições...`)

        // Processar cada aquisição
        for (let i = 0; i < paraProcessar.length; i++) {
          const aquisicaoId = paraProcessar[i]
          await this.processAquisition(aquisicaoId)
        }

        console.log(`  ⏳ Aquisições restantes: ${aquisicoesSemContexto.length - paraProcessar.length}`)
      }

      // Atualizar estatísticas
      this.stats.total_ciclos++
      this.stats.ultimo_ciclo = new Date()
      const tempoCiclo = Date.now() - inicioCiclo

      console.log(`\n✅ Ciclo #${this.stats.total_ciclos} concluído em ${tempoCiclo}ms`)
      console.log(`📊 Estatísticas: ${this.stats.total_sucesso} sucesso, ${this.stats.total_falhas} falhas`)
      console.log('='.repeat(80) + '\n')
    } catch (error) {
      console.error('❌ Erro no ciclo de verificação:', error)
    } finally {
      this.executando = false
    }
  }

  /**
   * Processa uma aquisição específica
   * 
   * @param aquisicaoId - ID da aquisição para processar
   */
  private async processAquisition(aquisicaoId: number): Promise<void> {
    console.log(`\n  [${this.stats.total_processados + 1}] Processando aquisição ${aquisicaoId}...`)

    try {
      // Gerar contexto usando o Context Builder
      const resultado = await contextBuilderAquisicoes.processarAquisicao(aquisicaoId)

      if (resultado.sucesso && resultado.contexto) {
        // Salvar contexto na Knowledge Base
        await knowledgeBase.salvarContexto(aquisicaoId, resultado.contexto)

        // Atualizar estatísticas
        this.stats.total_processados++
        this.stats.total_sucesso++

        console.log(`    ✅ Aquisição ${aquisicaoId} processada com sucesso (${resultado.tempo_processamento}ms)`)
      } else {
        // Atualizar estatísticas de falha
        this.stats.total_processados++
        this.stats.total_falhas++

        console.error(`    ❌ Erro ao processar aquisição ${aquisicaoId}: ${resultado.erro}`)
      }
    } catch (error) {
      // Atualizar estatísticas de falha
      this.stats.total_processados++
      this.stats.total_falhas++

      console.error(`    ❌ Exceção ao processar aquisição ${aquisicaoId}:`, error)
    }
  }

  /**
   * Processa uma aquisição específica manualmente
   * 
   * @param aquisicaoId - ID da aquisição para processar
   * @returns Resultado do processamento
   */
  async processarAquisitionManual(aquisicaoId: number): Promise<any> {
    console.log(`🔄 Processando manualmente aquisição ${aquisicaoId}...`)

    try {
      // Gerar contexto usando o Context Builder
      const resultado = await contextBuilderAquisicoes.processarAquisicao(aquisicaoId)

      if (resultado.sucesso && resultado.contexto) {
        // Salvar contexto na Knowledge Base
        await knowledgeBase.salvarContexto(aquisicaoId, resultado.contexto)

        console.log(`✅ Aquisição ${aquisicaoId} processada com sucesso`)
        return {
          sucesso: true,
          aquisicao_id: aquisicaoId,
          tempo_processamento: resultado.tempo_processamento
        }
      } else {
        console.error(`❌ Erro ao processar aquisição ${aquisicaoId}: ${resultado.erro}`)
        return {
          sucesso: false,
          aquisicao_id: aquisicaoId,
          erro: resultado.erro
        }
      }
    } catch (error) {
      console.error(`❌ Exceção ao processar aquisição ${aquisicaoId}:`, error)
      return {
        sucesso: false,
        aquisicao_id: aquisicaoId,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Retorna as estatísticas atuais do monitor
   * 
   * @returns Estatísticas do monitor
   */
  getStats(): MonitorStats {
    return { ...this.stats }
  }

  /**
   * Retorna a configuração atual do monitor
   * 
   * @returns Configuração do monitor
   */
  getConfig(): MonitorConfig {
    return { ...this.config }
  }

  /**
   * Atualiza a configuração do monitor
   * 
   * @param config - Nova configuração
   */
  updateConfig(config: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('⚙️  Configuração do monitor atualizada:', this.config)

    // Se o monitor estiver rodando e o intervalo mudou, reiniciar
    if (this.executando && config.intervaloVerificacao !== undefined) {
      this.stopMonitoring()
      this.startMonitoring()
    }
  }

  /**
   * Verifica se o monitor está em execução
   * 
   * @returns true se o monitor está em execução
   */
  isRunning(): boolean {
    return this.executando
  }
}

// Exportar instância única (singleton)
export const aquisitionMonitor = new AquisitionMonitor()

export default aquisitionMonitor
