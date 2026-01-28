'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Loader2,
  Filter,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// Tipos
interface Produto {
  id: number
  codigo: string
  descricao: string
  categoria: { id: number; nome: string }
  unidade: { id: number; sigla: string }
  marca?: { id: number; nome: string } | null
  fornecedor?: {
    id: number
    codigo: string
    nome: string
  } | null
  aquisicao?: {
    id: number
    numero_proc: string
    modalidade: string
  } | null
  saldo_atual: number
  saldo_minimo: number
  localizacao?: string | null
  ativo: boolean
  tipo?: 'estoque' | 'aquisicao'
}

interface Aquisicao {
  id: number
  numero_proc: string
  modalidade: string
  fornecedor: {
    id: number
    codigo: string
    nome: string
  }
}

export default function EstoquePage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  
  // Estados para filtro por aquisição
  const [aquisicoes, setAquisicoes] = useState<Aquisicao[]>([])
  const [isLoadingAquisicoes, setIsLoadingAquisicoes] = useState(false)
  const [selectedAquisicao, setSelectedAquisicao] = useState<string>('')
  
  const filteredProdutos = produtos.filter((produto) =>
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.marca?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.fornecedor?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isSaldoCritico = (saldoAtual: number, saldoMinimo: number) => {
    return saldoAtual <= saldoMinimo
  }

  const loadProdutos = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedAquisicao) {
        params.append('aquisicao_id', selectedAquisicao)
      }
      const response = await fetch(`/api/estoque/produtos?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setProdutos(data.data.produtos)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar produtos',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar produtos',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAquisicoes = async () => {
    try {
      setIsLoadingAquisicoes(true)
      const response = await fetch('/api/aquisicoes/listar')
      const data = await response.json()
      
      if (data.success) {
        setAquisicoes(data.data.aquisicoes)
      }
    } catch (error) {
      console.error('Erro ao carregar aquisições:', error)
    } finally {
      setIsLoadingAquisicoes(false)
    }
  }

  useEffect(() => {
    loadAquisicoes()
    loadProdutos()
  }, [selectedAquisicao])

  return (
    <div className="space-y-6">
      <Header
        title="Controle de Estoque"
        subtitle="Gerencie os produtos do sistema"
      />

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, descrição, categoria, marca ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={selectedAquisicao}
              onChange={(e) => setSelectedAquisicao(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm pr-8"
              disabled={isLoadingAquisicoes}
            >
              <option value="">Todas as Aquisições</option>
              {isLoadingAquisicoes ? (
                <option value="" disabled>Carregando...</option>
              ) : aquisicoes.length === 0 ? (
                <option value="" disabled>Nenhuma aquisição encontrada</option>
              ) : (
                aquisicoes.map((aquisicao) => (
                  <option key={aquisicao.id} value={aquisicao.id.toString()}>
                    {aquisicao.numero_proc} - {aquisicao.fornecedor.nome}
                  </option>
                ))
              )}
            </select>
            {selectedAquisicao && (
              <button
                onClick={() => setSelectedAquisicao('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
              <DialogDescription>
                Preencha os dados do produto. O código será gerado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right">
                  Descrição *
                </Label>
                <Input id="descricao" className="col-span-3" placeholder="Ex: Caneta esferográfica azul" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right">
                  Categoria *
                </Label>
                <Input id="categoria" className="col-span-3" placeholder="Ex: Papelaria" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unidade" className="text-right">
                  Unidade *
                </Label>
                <Input id="unidade" className="col-span-3" placeholder="Ex: UN" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="marca" className="text-right">
                  Marca
                </Label>
                <Input id="marca" className="col-span-3" placeholder="Ex: Faber-Castell" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fornecedor" className="text-right">
                  Fornecedor
                </Label>
                <Input id="fornecedor" className="col-span-3" placeholder="Ex: Papelaria Central" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="saldo_minimo" className="text-right">
                  Saldo Mínimo *
                </Label>
                <Input id="saldo_minimo" type="number" className="col-span-3" placeholder="Ex: 100" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="localizacao" className="text-right">
                  Localização
                </Label>
                <Input id="localizacao" className="col-span-3" placeholder="Ex: A1-P02" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewProductOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsNewProductOpen(false)}>
                Salvar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos em Estoque
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando...' : `Total de ${filteredProdutos.length} produtos cadastrados`}
            {selectedAquisicao && (
              <span className="ml-2 text-sm text-muted-foreground">
                (Filtrado por aquisição)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Aquisição</TableHead>
                  <TableHead className="text-right">Saldo Atual</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <p className="text-muted-foreground">Carregando...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum produto encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos.map((produto) => (
                    <TableRow key={produto.codigo}>
                      <TableCell className="font-medium">
                        {produto.codigo}
                      </TableCell>
                      <TableCell>{produto.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{produto.categoria.nome}</Badge>
                      </TableCell>
                      <TableCell>{produto.unidade.sigla}</TableCell>
                      <TableCell>{produto.marca?.nome || '-'}</TableCell>
                      <TableCell>
                        {produto.fornecedor ? (
                          <div>
                            <p className="text-sm">{produto.fornecedor.nome}</p>
                            <p className="text-xs text-muted-foreground">{produto.fornecedor.codigo}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {produto.aquisicao ? (
                          <Badge variant="secondary" className="text-xs">
                            {produto.aquisicao.numero_proc}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{produto.saldo_atual}</span>
                          <span className="text-xs text-muted-foreground">
                            Mín: {produto.saldo_minimo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isSaldoCritico(produto.saldo_atual, produto.saldo_minimo) ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Crítico
                          </Badge>
                        ) : (
                          <Badge variant="default">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="mr-2 h-4 w-4" />
                              Movimentações
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
