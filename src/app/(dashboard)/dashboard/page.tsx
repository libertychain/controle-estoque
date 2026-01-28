'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  ShoppingCart,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react'
import { Header } from '@/components/layout/header'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total de Produtos',
      value: '1,234',
      icon: Package,
      change: '+12% este mês',
      color: 'text-blue-600'
    },
    {
      title: 'Pedidos este Mês',
      value: '45',
      icon: ShoppingCart,
      change: '+8% vs mês anterior',
      color: 'text-green-600'
    },
    {
      title: 'Aquisições Ativas',
      value: '23',
      icon: FileText,
      change: '3 vencem este mês',
      color: 'text-purple-600'
    },
    {
      title: 'Saldo Crítico',
      value: '12',
      icon: AlertTriangle,
      change: 'Atenção necessária',
      color: 'text-red-600'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      action: 'Pedido criado',
      description: 'PED-2024-0045 - Secretaria de Educação',
      time: 'Há 5 minutos',
      type: 'success'
    },
    {
      id: 2,
      action: 'Movimentação de estoque',
      description: 'Entrada de 100 unidades de Caneta Azul',
      time: 'Há 15 minutos',
      type: 'info'
    },
    {
      id: 3,
      action: 'Aviso de estoque baixo',
      description: 'Lápis HB - Saldo abaixo do mínimo',
      time: 'Há 1 hora',
      type: 'warning'
    },
    {
      id: 4,
      action: 'Aquisição finalizada',
      description: 'LIC-2024-0010 - Papelaria Central',
      time: 'Há 2 horas',
      type: 'success'
    },
    {
      id: 5,
      action: 'Automatização executada',
      description: 'Consulta de preços - 3 fornecedores',
      time: 'Há 3 horas',
      type: 'info'
    }
  ]

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        subtitle="Visão geral do sistema de controle de estoque"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full ${
                      activity.type === 'success'
                        ? 'bg-green-500'
                        : activity.type === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/estoque/produtos"
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Cadastrar Produto</p>
                  <p className="text-xs text-muted-foreground">
                    Adicionar novo item ao estoque
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/pedidos/novo"
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Criar Pedido</p>
                  <p className="text-xs text-muted-foreground">
                    Gerar novo pedido de material
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/aquisicoes"
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Nova Aquisição</p>
                  <p className="text-xs text-muted-foreground">
                    Registrar processo de licitação
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/llm"
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Consultar Assistente IA</p>
                  <p className="text-xs text-muted-foreground">
                    Fazer perguntas sobre o estoque
                  </p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock Warning */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
            <AlertTriangle className="h-5 w-5" />
            Atenção: Estoque Crítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-orange-200 bg-white p-3 dark:border-orange-800 dark:bg-orange-950">
              <p className="font-medium text-orange-900 dark:text-orange-100">Lápis HB</p>
              <p className="text-sm text-muted-foreground">
                Saldo: 10 un (Mínimo: 50)
              </p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-white p-3 dark:border-orange-800 dark:bg-orange-950">
              <p className="font-medium text-orange-900 dark:text-orange-100">Borracha Branca</p>
              <p className="text-sm text-muted-foreground">
                Saldo: 15 un (Mínimo: 100)
              </p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-white p-3 dark:border-orange-800 dark:bg-orange-950">
              <p className="font-medium text-orange-900 dark:text-orange-100">Caderno Capa Dura</p>
              <p className="text-sm text-muted-foreground">
                Saldo: 5 un (Mínimo: 30)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
