'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  BarChart3,
  Users,
  Building2,
  Settings,
  Bot,
  Zap,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const navigation = [
  {
    title: 'Principal',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: 'Gestão',
    items: [
      {
        name: 'Estoque',
        href: '/estoque',
        icon: Package
      },
      {
        name: 'Aquisições',
        href: '/aquisicoes',
        icon: FileText
      },
      {
        name: 'Pedidos',
        href: '/pedidos',
        icon: ShoppingCart
      },
      {
        name: 'Relatórios',
        href: '/relatorios',
        icon: BarChart3
      }
    ]
  },
  {
    title: 'Cadastros',
    items: [
      {
        name: 'Usuários',
        href: '/cadastros/usuarios',
        icon: Users
      },
      {
        name: 'Fornecedores',
        href: '/cadastros/fornecedores',
        icon: Building2
      },
      {
        name: 'Secretarias',
        href: '/cadastros/secretarias',
        icon: Settings
      },
      {
        name: 'Setores',
        href: '/cadastros/setores',
        icon: Settings
      },
      {
        name: 'Categorias',
        href: '/cadastros/categorias',
        icon: Settings
      },
      {
        name: 'Unidades',
        href: '/cadastros/unidades',
        icon: Settings
      },
      {
        name: 'Marcas',
        href: '/cadastros/marcas',
        icon: Settings
      }
    ]
  },
  {
    title: 'Inteligência',
    items: [
      {
        name: 'Assistente IA',
        href: '/llm',
        icon: Bot
      },
      {
        name: 'Automação',
        href: '/automacao',
        icon: Zap
      }
    ]
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Sistema de</h1>
                <p className="text-xs text-muted-foreground">Controle de Estoque</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            {navigation.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium">Versão do Sistema</p>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
