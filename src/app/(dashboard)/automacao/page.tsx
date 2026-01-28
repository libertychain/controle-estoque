'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Play,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Automacao {
  id: number
  descricao: string
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'FALHOU'
  data_criacao: string
  duracao?: number
  logs: string[]
}

const statusConfig = {
  'EM_ANDAMENTO': {
    label: 'Em Andamento',
    variant: 'default' as const,
    icon: Loader2,
    color: 'text-blue-600'
  },
  'CONCLUIDO': {
    label: 'Concluído',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-600'
  },
  'FALHOU': {
    label: 'Falhou',
    variant: 'destructive' as const,
    icon: AlertCircle,
    color: 'text-red-600'
  }
}

export default function AutomacaoPage() {
  const [novaAutomacao, setNovaAutomacao] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [automacoes, setAutomacoes] = useState<Automacao[]>([
    {
      id: 1,
      descricao: 'Consultar preços de canetas no site da Papelaria Central',
      status: 'CONCLUIDO',
      data_criacao: '2024-01-20T10:00:00',
      duracao: 45,
      logs: [
        '[10:00:00] Iniciando automação',
        '[10:00:05] Navegando para https://www.papelariacentral.com',
        '[10:00:10] Página carregada com sucesso',
        '[10:00:15] Localizando campo de busca',
        '[10:00:20] Preenchendo busca com "caneta"',
        '[10:00:25] Clicando no botão buscar',
        '[10:00:30] Extraindo resultados...',
        '[10:00:40] 15 produtos encontrados',
        '[10:00:45] Automação concluída com sucesso'
      ]
    },
    {
      id: 2,
      descricao: 'Verificar estoque disponível em 3 fornecedores',
      status: 'EM_ANDAMENTO',
      data_criacao: '2024-01-20T14:30:00',
      logs: [
        '[14:30:00] Iniciando automação',
        '[14:30:05] Conectando ao fornecedor 1...',
        '[14:30:10] Processando...'
      ]
    }
  ])

  const handleCriarAutomacao = async () => {
    if (!novaAutomacao.trim()) return

    setIsCreating(true)

    // Simulate creating automation (will be replaced with actual API call)
    setTimeout(() => {
      const nova: Automacao = {
        id: automacoes.length + 1,
        descricao: novaAutomacao,
        status: 'EM_ANDAMENTO',
        data_criacao: new Date().toISOString(),
        logs: [
          `[${new Date().toLocaleTimeString('pt-BR')}] Iniciando automação`,
          `[${new Date().toLocaleTimeString('pt-BR')}] Analisando tarefa com IA...`
        ]
      }

      setAutomacoes((prev) => [nova, ...prev])
      setNovaAutomacao('')
      setIsCreating(false)

      // Simulate completion after 5 seconds
      setTimeout(() => {
        setAutomacoes((prev) =>
          prev.map((a) =>
            a.id === nova.id
              ? {
                  ...a,
                  status: 'CONCLUIDO',
                  duracao: 5,
                  logs: [
                    ...a.logs,
                    `[${new Date().toLocaleTimeString('pt-BR')}] Plano de execução gerado`,
                    `[${new Date().toLocaleTimeString('pt-BR')}] Executando etapas...`,
                    `[${new Date().toLocaleTimeString('pt-BR')}] Automação concluída com sucesso`
                  ]
                }
              : a
          )
        )
      }, 5000)
    }, 1500)
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === 'EM_ANDAMENTO' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Header
        title="Automação Inteligente"
        subtitle="Automatize tarefas web com IA e Selenium"
      />

      <Alert className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <Zap className="h-4 w-4" />
        <AlertTitle>Automação com Inteligência Artificial</AlertTitle>
        <AlertDescription>
          Descreva a tarefa que deseja automatizar em linguagem natural. A LLM irá converter em um plano estruturado e o Selenoid executará as ações automaticamente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Automation */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Automação</CardTitle>
              <CardDescription>
                Descreva a tarefa que deseja automatizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Ex: Consultar o site da Papelaria Central e verificar os preços de canetas esferográficas..."
                  value={novaAutomacao}
                  onChange={(e) => setNovaAutomacao(e.target.value)}
                  className="min-h-[120px]"
                  disabled={isCreating}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleCriarAutomacao}
                  disabled={!novaAutomacao.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Criar e Executar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Automation History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Automações</CardTitle>
              <CardDescription>
                Visualize o status e resultados das automações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automacoes.map((automacao) => (
                  <Card key={automacao.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-2">
                            {automacao.descricao}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(automacao.data_criacao).toLocaleString('pt-BR')}
                            </div>
                            {automacao.duracao && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {automacao.duracao}s
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(automacao.status)}
                          {automacao.status === 'CONCLUIDO' && (
                            <Button variant="outline" size="sm">
                              <Video className="mr-2 h-4 w-4" />
                              Ver Vídeo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Logs de Execução:</p>
                        <div className="rounded-md bg-muted p-3 max-h-32 overflow-y-auto">
                          <div className="space-y-1">
                            {automacao.logs.map((log, index) => (
                              <p key={index} className="text-xs font-mono">
                                {log}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Descreva a Tarefa</p>
                  <p className="text-xs text-muted-foreground">
                    Use linguagem natural para explicar o que deseja
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">IA Planeja</p>
                  <p className="text-xs text-muted-foreground">
                    A LLM converte em um plano estruturado
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Selenoid Executa</p>
                  <p className="text-xs text-muted-foreground">
                    Selenium + Selenoid realiza as ações
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium">Visualize o Resultado</p>
                  <p className="text-xs text-muted-foreground">
                    Logs, status e vídeo da execução
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exemplos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => setNovaAutomacao('Consultar o site da Papelaria Central e verificar os preços de canetas')}
              >
                <FileText className="mr-2 h-3 w-3" />
                Consultar preços de produtos
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => setNovaAutomacao('Verificar disponibilidade de estoque em 3 fornecedores')}
              >
                <FileText className="mr-2 h-3 w-3" />
                Verificar disponibilidade
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => setNovaAutomacao('Preencher formulário de pedido no sistema do fornecedor')}
              >
                <FileText className="mr-2 h-3 w-3" />
                Preencher formulário
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs"
                size="sm"
                onClick={() => setNovaAutomacao('Extrair dados de licitações do site oficial')}
              >
                <FileText className="mr-2 h-3 w-3" />
                Extrair dados
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Tecnologias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge>Ollama</Badge>
                <span className="text-muted-foreground">LLM Local</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge>Selenium</Badge>
                <span className="text-muted-foreground">Automação Web</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge>Selenoid</Badge>
                <span className="text-muted-foreground">Container Grid</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
