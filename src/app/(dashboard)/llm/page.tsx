'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFetch } from '@/hooks/use-fetch'
import {
  Bot,
  Send,
  User,
  Sparkles,
  Package,
  TrendingUp,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickActions = [
  {
    icon: Package,
    label: 'Consultar saldo de produto',
    prompt: 'Qual o saldo atual de canetas azuis?'
  },
  {
    icon: AlertTriangle,
    label: 'Verificar estoque crítico',
    prompt: 'Quais produtos estão com saldo crítico?'
  },
  {
    icon: TrendingUp,
    label: 'Analisar tendências',
    prompt: 'Analise o consumo de materiais este mês'
  },
  {
    icon: BarChart3,
    label: 'Gerar resumo executivo',
    prompt: 'Gere um resumo executivo do estoque atual'
  }
]

export default function LLMPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Olá! Sou o assistente de inteligência artificial do sistema de controle de estoque. Posso ajudar você a:\n\n• Consultar saldos de produtos\n• Analisar tendências de consumo\n• Identificar estoques críticos\n• Gerar relatórios textuais\n• Responder perguntas sobre o sistema\n\nComo posso ajudar você hoje?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { fetch: authenticatedFetch } = useFetch()

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await authenticatedFetch('/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pergunta: userMessage.content,
          contexto: 'Contexto do sistema de controle de estoque para processos de licitação pública.'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao processar pergunta')
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar resposta da LLM')
      }

      let assistantContent = ''

      if (data.data) {
        if (data.data.resposta) {
          assistantContent = data.data.resposta
        } else if (typeof data.data === 'string') {
          assistantContent = data.data
        } else {
          assistantContent = JSON.stringify(data.data, null, 2)
        }
      } else {
        assistantContent = 'Não foi possível obter uma resposta da LLM.'
      }

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      let errorContent = ''

      if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
        errorContent = '⚠️ **Erro de conexão com Ollama**\n\nNão foi possível conectar ao servidor Ollama. Verifique se:\n\n• O Ollama está rodando (execute: `ollama serve`)\n• O modelo `qwen3:1.7b` está instalado (execute: `ollama pull qwen3:1.7b`)\n• O servidor está acessível em `http://localhost:11434`\n\nSe o problema persistir, verifique os logs do Ollama para mais detalhes.'
      } else if (errorMessage.includes('model')) {
        errorContent = '⚠️ **Erro de modelo**\n\nO modelo configurado não foi encontrado. Verifique se:\n\n• O modelo `qwen3:1.7b` está instalado no Ollama\n• Execute: `ollama list` para ver os modelos disponíveis\n• Execute: `ollama pull qwen3:1.7b` para instalar o modelo'
      } else {
        errorContent = `⚠️ **Erro ao processar pergunta**\n\n${errorMessage}\n\nTente novamente ou entre em contato com o suporte técnico.`
      }

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="space-y-6">
      <Header
        title="Assistente IA"
        subtitle="Consulte o estoque usando inteligência artificial"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>Conversa com Assistente</CardTitle>
              </div>
              <CardDescription>
                Faça perguntas sobre o estoque e receba respostas inteligentes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua pergunta sobre o estoque..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Inteligência Artificial</AlertTitle>
            <AlertDescription>
              O assistente utiliza uma LLM local para processar suas perguntas e fornecer respostas inteligentes baseadas nos dados do sistema.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Clique para fazer perguntas comuns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
              <CardDescription>
                O que o assistente pode fazer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">Consulta</Badge>
                <p className="text-sm text-muted-foreground">
                  Consultar saldos, movimentações e histórico
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">Análise</Badge>
                <p className="text-sm text-muted-foreground">
                  Analisar tendências e padrões de consumo
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">Alertas</Badge>
                <p className="text-sm text-muted-foreground">
                  Identificar estoques críticos e problemas
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">Relatórios</Badge>
                <p className="text-sm text-muted-foreground">
                  Gerar relatórios textuais e resumos
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">Normalização</Badge>
                <p className="text-sm text-muted-foreground">
                  Normalizar descrições de produtos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
