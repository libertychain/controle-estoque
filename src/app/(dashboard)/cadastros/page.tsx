'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  Users,
  Building2,
  Briefcase,
  MapPin,
  FolderTree,
  Ruler,
  Tag,
  PenTool
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function CadastrosPage() {
  const cadastros = [
    {
      id: 1,
      titulo: 'Usuários',
      descricao: 'Cadastre os usuários do sistema e defina seus perfis e permissões.',
      icone: Users,
      href: '/cadastros/usuarios',
      quantidade: 15
    },
    {
      id: 2,
      titulo: 'Fornecedores',
      descricao: 'Gerencie os fornecedores e seus dados de contato.',
      icone: Building2,
      href: '/cadastros/fornecedores',
      quantidade: 12
    },
    {
      id: 3,
      titulo: 'Secretarias',
      descricao: 'Cadastre as secretarias do governo.',
      icone: Briefcase,
      href: '/cadastros/secretarias',
      quantidade: 8
    },
    {
      id: 4,
      titulo: 'Setores',
      descricao: 'Defina os setores dentro de cada secretaria.',
      icone: MapPin,
      href: '/cadastros/setores',
      quantidade: 32
    },
    {
      id: 5,
      titulo: 'Categorias',
      descricao: 'Organize os produtos em categorias.',
      icone: FolderTree,
      href: '/cadastros/categorias',
      quantidade: 10
    },
    {
      id: 6,
      titulo: 'Unidades de Medida',
      descricao: 'Defina as unidades de medida utilizadas.',
      icone: Ruler,
      href: '/cadastros/unidades',
      quantidade: 8
    },
    {
      id: 7,
      titulo: 'Marcas',
      descricao: 'Cadastre as marcas dos produtos.',
      icone: Tag,
      href: '/cadastros/marcas',
      quantidade: 25
    },
    {
      id: 8,
      titulo: 'Secretários de Compras',
      descricao: 'Cadastre os secretários de compras para assinatura dos pedidos.',
      icone: PenTool,
      href: '/cadastros/secretarios-compras',
      quantidade: 0
    }
  ]

  return (
    <div className="space-y-6">
      <Header
        title="Cadastros"
        subtitle="Gerencie os registros básicos do sistema"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cadastros.map((cadastro) => {
          const Icon = cadastro.icone
          return (
            <Link key={cadastro.id} href={cadastro.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cadastro.titulo}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {cadastro.quantidade} cadastrados
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {cadastro.descricao}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
