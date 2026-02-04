'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  ShoppingCart,
  Eye,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Package,
  Store,
  Building2,
  ArrowRight,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { WindowManagerProvider, useWindowManager } from '@/components/windows/WindowManagerContext'
import { TabBar } from '@/components/windows/TabBar'
import { DraggableWindow } from '@/components/windows/DraggableWindow'
import { PedidoWindow } from '@/components/pedidos/PedidoWindow'

// Tipos
interface Produto {
  id: string | number
  codigo: string
  descricao: string
  unidade: { id: number; sigla: string }
  marca?: { id: number; nome: string } | null
  fornecedor?: { id: number; codigo: string; nome: string } | null
  saldo_atual: number
  saldo_minimo: number
  preco_unitario?: number
  prazo_entrega?: number | null
  aquisicao_id?: number
  produto_aquisicao_id?: number
}

interface Fornecedor {
  id: number
  codigo: string
  nome: string
  cnpj?: string | null
  contato?: string | null
  telefone?: string | null
  email?: string | null
}

interface Secretaria {
  id: number
  nome: string
  sigla: string
}

interface Setor {
  id: number
  nome: string
  secretaria_id: number
  secretaria: Secretaria
}

interface Pedido {
  id: number
  numero: string
  data_pedido: string
  secretaria: { id: number; nome: string; sigla: string }
  setor: { id: number; nome: string }
  _count?: {
    itens: number
  }
  observacoes: string | null
}

interface ItemCarrinho {
  produto: Produto
  quantidade: string // Alterado para string para aceitar valores quebrados
  observacao?: string
}

interface PedidoPreview {
  fornecedor: Fornecedor
  itens: ItemCarrinho[]
  totalItens: number
  valorTotal: number
}

// Componente interno que usa o contexto do WindowManager
function PedidosPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { windows, activeWindowId, openWindow, closeWindow, focusWindow, maximizeWindow, restoreWindow, minimizeWindow, updateWindowPosition, updateWindowSize } = useWindowManager()
  const [searchTerm, setSearchTerm] = useState('')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para listagem de pedidos (manter existentes)
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [aquisicoes, setAquisicoes] = useState<any[]>([])
  const [isLoadingSecretarias, setIsLoadingSecretarias] = useState(true)
  const [isLoadingSetores, setIsLoadingSetores] = useState(false)
  const [isLoadingAquisicoes, setIsLoadingAquisicoes] = useState(false)
  
  // Carregar pedidos ao montar
  useEffect(() => {
    loadPedidos()
    loadSecretarias()
    loadAquisicoes()
  }, [])

  const loadPedidos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pedidos')
      const data = await response.json()
      
      if (data.success) {
        setPedidos(data.data.pedidos)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar pedidos',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar pedidos',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSecretarias = async () => {
    try {
      setIsLoadingSecretarias(true)
      const response = await fetch('/api/secretarias')
      const data = await response.json()
      
      if (data.success) {
        setSecretarias(data.data.secretarias)
      }
    } catch (error) {
      console.error('Erro ao carregar secretarias:', error)
    } finally {
      setIsLoadingSecretarias(false)
    }
  }

  const loadSetores = async (secretariaId: number) => {
    try {
      setIsLoadingSetores(true)
      const response = await fetch(`/api/setores?secretaria_id=${secretariaId}`)
      const data = await response.json()
      
      if (data.success) {
        setSetores(data.data.setores)
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error)
    } finally {
      setIsLoadingSetores(false)
    }
  }

  const loadAquisicoes = async () => {
    try {
      setIsLoadingAquisicoes(true)
      const response = await fetch('/api/aquisicoes?limit=100')
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

  const handleViewPedido = (pedidoId: number) => {
    openWindow(`Pedido #${pedidoId}`, 'visualizar', { pedidoId })
  }

  const handleEditPedidoFromTable = async (pedidoId: number) => {
    openWindow(`Editar Pedido #${pedidoId}`, 'editar', { pedidoId })
  }

  const handleDeletePedidoFromTable = async (pedidoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Pedido excluído com sucesso',
          description: 'O pedido foi removido do sistema'
        })
        loadPedidos()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir pedido',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir pedido:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir pedido',
        description: 'Tente novamente mais tarde'
      })
    }
  }

  const handlePedidoCriado = (pedidos: any[]) => {
    // Recarregar lista de pedidos
    loadPedidos()
    
    // Se houver apenas um pedido criado, abrir visualização
    if (pedidos && pedidos.length === 1) {
      handleViewPedido(pedidos[0].id)
    }
  }

  const handleEdit = (pedidoId: number) => {
    // Fechar a janela de visualização e abrir a de edição
    closeWindow(activeWindowId || '')
    openWindow(`Editar Pedido #${pedidoId}`, 'editar', { pedidoId })
  }

  const handleSave = () => {
    // Recarregar lista de pedidos após salvar
    loadPedidos()
  }

  const filteredPedidos = pedidos.filter((pedido) =>
    pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.secretaria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.setor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Header
        title="Pedidos"
        subtitle="Gerencie os pedidos de materiais"
      />

      {/* Barra de Abas */}
      <TabBar
        windows={windows}
        activeWindowId={activeWindowId}
        onTabClick={focusWindow}
        onTabClose={closeWindow}
      />

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, secretaria ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
          <Button onClick={() => openWindow('Novo Pedido', 'criar')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Pedidos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Pedidos
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando...' : `Total de ${filteredPedidos.length} pedidos cadastrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Secretaria</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <p className="text-muted-foreground">Carregando...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-medium">
                        {pedido.numero}
                      </TableCell>
                      <TableCell>
                        {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div>
                          <p className="font-medium">{pedido.secretaria.nome}</p>
                          <p className="text-xs text-muted-foreground">{pedido.secretaria.sigla}</p>
                        </div>
                      </TableCell>
                      <TableCell>{pedido.setor.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pedido._count?.itens || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPedido(pedido.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPedidoFromTable(pedido.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePedidoFromTable(pedido.id)} className="text-destructive">
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

      {/* Renderização de Janelas */}
      {windows.map((window) => (
        <DraggableWindow
          key={window.id}
          id={window.id}
          title={window.title}
          isOpen={true}
          onClose={() => closeWindow(window.id)}
          initialPosition={window.position}
          zIndex={window.zIndex}
          isMaximized={window.isMaximized}
          isMinimized={window.isMinimized}
          onMaximize={() => maximizeWindow(window.id)}
          onRestore={() => restoreWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onFocus={() => focusWindow(window.id)}
        >
          <PedidoWindow
            id={window.id}
            type={window.type as 'criar' | 'visualizar' | 'editar'}
            data={window.data}
            onClose={() => closeWindow(window.id)}
            onPedidoCriado={handlePedidoCriado}
            onEdit={handleEdit}
            onSave={handleSave}
          />
        </DraggableWindow>
      ))}
    </div>
  )
}

// Componente principal que envolve com WindowManagerProvider
export default function PedidosPage() {
  return (
    <WindowManagerProvider>
      <PedidosPageContent />
    </WindowManagerProvider>
  )
}
