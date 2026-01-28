'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Package,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function RelatoriosPage() {
  const relatorios = [
    {
      id: 1,
      titulo: 'Relatório de Estoque Atual',
      descricao: 'Visão geral completa do estoque, incluindo todos os produtos, saldos e status.',
      icone: Package,
      tipo: 'ESTOQUE',
      formatos: ['PDF', 'Excel']
    },
    {
      id: 2,
      titulo: 'Relatório de Consumo por Secretaria',
      descricao: 'Análise de consumo de materiais agrupado por cada secretaria.',
      icone: Building2,
      tipo: 'CONSUMO_SECRETARIA',
      formatos: ['PDF', 'Excel']
    },
    {
      id: 3,
      titulo: 'Relatório de Consumo por Setor',
      descricao: 'Análise detalhada do consumo de materiais por setor de destino.',
      icone: Users,
      tipo: 'CONSUMO_SETOR',
      formatos: ['PDF', 'Excel']
    },
    {
      id: 4,
      titulo: 'Relatório por Fornecedor',
      descricao: 'Estatísticas de pedidos e entregas por fornecedor.',
      icone: Building2,
      tipo: 'FORNECEDOR',
      formatos: ['PDF', 'Excel']
    },
    {
      id: 5,
      titulo: 'Relatório de Pedidos por Período',
      descricao: 'Histórico de pedidos em um período determinado.',
      icone: FileText,
      tipo: 'PEDIDOS_PERIODO',
      formatos: ['PDF', 'Excel']
    },
    {
      id: 6,
      titulo: 'Relatório de Atrasos',
      descricao: 'Análise de atrasos nas entregas e seus impactos.',
      icone: AlertTriangle,
      tipo: 'ATRASOS',
      formatos: ['PDF']
    },
    {
      id: 7,
      titulo: 'Relatório de Saldo Crítico',
      descricao: 'Produtos com saldo abaixo do mínimo que necessitam atenção urgente.',
      icone: TrendingUp,
      tipo: 'SALDO_CRITICO',
      formatos: ['PDF', 'Excel']
    }
  ]

  return (
    <div className="space-y-6">
      <Header
        title="Relatórios"
        subtitle="Gere relatórios detalhados do sistema"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatórios Disponíveis
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos em Estoque
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos este Mês
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {relatorios.map((relatorio) => {
          const Icon = relatorio.icone
          return (
            <Card key={relatorio.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{relatorio.titulo}</CardTitle>
                      <CardDescription className="mt-1">
                        {relatorio.descricao}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {relatorio.formatos.map((formato) => (
                    <Badge key={formato} variant="secondary">
                      {formato}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF
                  </Button>
                  {relatorio.formatos.includes('Excel') && (
                    <Button variant="outline" className="flex-1" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Assistente IA */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Assistente IA para Relatórios
          </CardTitle>
          <CardDescription>
            Use a inteligência artificial para gerar relatórios textuais e análises personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            Conversar com Assistente IA
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
