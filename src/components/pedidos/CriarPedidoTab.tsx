'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useFetch } from '@/hooks/use-fetch'
import { ProdutosAquisicaoDialog } from './ProdutosAquisicaoDialog'
import {
  Search,
  Plus,
  ShoppingCart,
  Package,
  Store,
  ArrowRight,
  X,
  Loader2,
  Building2,
  Printer,
} from 'lucide-react'

// Tipos
export interface Produto {
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

export interface Fornecedor {
  id: number
  codigo: string
  nome: string
  cnpj?: string | null
  contato?: string | null
  telefone?: string | null
  email?: string | null
}

export interface Secretaria {
  id: number
  nome: string
  sigla: string
}

export interface Setor {
  id: number
  nome: string
  secretaria_id: number
  secretaria: Secretaria
}

export interface ItemCarrinho {
  produto: Produto
  quantidade: string
  observacao?: string
}

export interface PedidoPreview {
  fornecedor: Fornecedor
  itens: ItemCarrinho[]
  totalItens: number
  valorTotal: number
}

export interface CriarPedidoTabProps {
  onClose: () => void
  onPedidoCriado: (pedidos: any[]) => void
}

export function CriarPedidoTab({ onClose, onPedidoCriado }: CriarPedidoTabProps) {
  const { toast } = useToast()
  const { fetch: authenticatedFetch } = useFetch()
  
  // Estados para criação de pedidos
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [aquisicoes, setAquisicoes] = useState<any[]>([])
  const [isLoadingSecretarias, setIsLoadingSecretarias] = useState(true)
  const [isLoadingSetores, setIsLoadingSetores] = useState(false)
  const [isLoadingAquisicoes, setIsLoadingAquisicoes] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Estados para carrinho de compras
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  
  // Estados para busca de produtos
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false)
  const [searchProduto, setSearchProduto] = useState('')
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isViewAquisicaoDialogOpen, setIsViewAquisicaoDialogOpen] = useState(false)
  
  // Estados para seleção de produtos
  const [selectedProdutos, setSelectedProdutos] = useState<Set<string>>(new Set())
  const [selectedAquisicaoProdutos, setSelectedAquisicaoProdutos] = useState<Set<string>>(new Set())
  const [produtosAquisicao, setProdutosAquisicao] = useState<Produto[]>([])
  const [isLoadingProdutosAquisicao, setIsLoadingProdutosAquisicao] = useState(false)
  
  // Estados para seleção de aquisição
  const [selectedAquisicao, setSelectedAquisicao] = useState<string>('')
  
  // Estados para formulário
  const [formData, setFormData] = useState({
    secretaria_id: '',
    setor_id: '',
    observacoes: ''
  })
  
  const [activeTab, setActiveTab] = useState('carrinho')
  
  // Carregar dados iniciais
  useEffect(() => {
    loadSecretarias()
    loadAquisicoes()
  }, [])
  
  // Carregar setores quando secretaria é selecionada
  useEffect(() => {
    if (formData.secretaria_id) {
      loadSetores(parseInt(formData.secretaria_id))
    } else {
      setSetores([])
    }
  }, [formData.secretaria_id])
  
  // Buscar produtos quando searchProduto muda
  useEffect(() => {
    if (searchProduto.length >= 2) {
      searchProdutos()
    } else if (searchProduto.length === 0) {
      setProdutos([])
    }
  }, [searchProduto])
  
  const loadSecretarias = async () => {
    try {
      setIsLoadingSecretarias(true)
      const response = await authenticatedFetch('/api/secretarias')
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
      const response = await authenticatedFetch(`/api/setores?secretaria_id=${secretariaId}`)
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
      const response = await authenticatedFetch('/api/aquisicoes?limit=100')
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
  
  const searchProdutos = async () => {
    try {
      setIsLoadingProdutos(true)
      let url = `/api/produtos-aquisicao?search=${encodeURIComponent(searchProduto)}&limit=50`
      
      // Se uma aquisição foi selecionada, filtrar por ela
      if (selectedAquisicao) {
        url += `&aquisicao_id=${selectedAquisicao}`
      }
      
      console.log('🔍 Buscando produtos:', url)
      
      const response = await authenticatedFetch(url)
      const data = await response.json()
      
      console.log('📦 Produtos encontrados:', JSON.stringify(data.data.produtos, null, 2))
      
      if (data.success) {
        setProdutos(data.data.produtos)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setIsLoadingProdutos(false)
    }
  }
  
  const loadProdutosAquisicao = async () => {
    try {
      setIsLoadingProdutosAquisicao(true)
      
      if (!selectedAquisicao) {
        toast({
          variant: 'destructive',
          title: 'Aquisição não selecionada',
          description: 'Selecione uma aquisição primeiro para ver os produtos.'
        })
        return
      }
      
      console.log('🔍 Carregando produtos da aquisição:', selectedAquisicao)
      
      const url = `/api/produtos-aquisicao?aquisicao_id=${selectedAquisicao}&limit=500`
      const response = await authenticatedFetch(url)
      const data = await response.json()
      
      console.log('📦 Produtos carregados:', JSON.stringify(data.data.produtos, null, 2))
      
      if (data.success) {
        setProdutosAquisicao(data.data.produtos)
        setIsViewAquisicaoDialogOpen(true)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar produtos',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar produtos da aquisição:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar produtos',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoadingProdutosAquisicao(false)
    }
  }
  
  const onSelectProducts = (produtosSelecionados: Produto[]) => {
    produtosSelecionados.forEach(produto => {
      adicionarAoCarrinho(produto, '1')
    })
    setIsViewAquisicaoDialogOpen(false)
  }
  
  const adicionarAoCarrinho = (produto: Produto, quantidade: string = '1') => {
    console.log('➕ Adicionando produto ao carrinho:', JSON.stringify({
      id: produto.id,
      descricao: produto.descricao,
      fornecedor: produto.fornecedor,
      fornecedor_id: produto.fornecedor?.id,
      produto_aquisicao_id: produto.produto_aquisicao_id,
      quantidade
    }, null, 2))
    
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho.find(item => item.produto.id === produto.id)
      
      if (itemExistente) {
        const qtdAtual = parseFloat(itemExistente.quantidade.toString().replace(',', '.'))
        const qtdAdicionar = parseFloat(quantidade.toString().replace(',', '.'))
        const novaQtd = (qtdAtual + qtdAdicionar).toString()
        return prevCarrinho.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: novaQtd }
            : item
        )
      } else {
        return [...prevCarrinho, { produto, quantidade }]
      }
    })
    
    toast({
      title: 'Produto adicionado',
      description: `${produto.descricao} foi adicionado ao carrinho`
    })
  }
  
  const removerDoCarrinho = (produtoId: number | string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId))
  }
  
  const atualizarQuantidade = (produtoId: number | string, quantidade: string) => {
    const qtdNumerica = parseFloat(quantidade.toString().replace(',', '.'))
    
    if (qtdNumerica <= 0) {
      removerDoCarrinho(produtoId)
    } else {
      setCarrinho(carrinho.map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade }
          : item
      ))
    }
  }
  
  const agruparPorFornecedor = (): PedidoPreview[] => {
    const grupos: { [key: number]: PedidoPreview } = {}
    
    console.log('🛒 Carrinho completo:', JSON.stringify(carrinho, null, 2))
    
    carrinho.forEach((item, index) => {
      const fornecedor = item.produto.fornecedor
      
      console.log(`🛒 Item ${index}:`, JSON.stringify({
        produto_id: item.produto.id,
        produto_aquisicao_id: item.produto.produto_aquisicao_id,
        fornecedor: fornecedor,
        fornecedor_id: fornecedor?.id,
        quantidade: item.quantidade
      }, null, 2))
      
      if (!fornecedor || !fornecedor.id) {
        console.log(`⚠️ Item ${index} não tem fornecedor válido, pulando...`)
        return
      }
      
      if (!grupos[fornecedor.id]) {
        grupos[fornecedor.id] = {
          fornecedor,
          itens: [],
          totalItens: 0,
          valorTotal: 0
        }
      }
      
      grupos[fornecedor.id].itens.push(item)
      grupos[fornecedor.id].totalItens += parseFloat(item.quantidade.toString().replace(',', '.'))
    })
    
    console.log('📦 Grupos criados:', JSON.stringify(Object.values(grupos), null, 2))
    
    return Object.values(grupos)
  }
  
  const handleCriarPedidos = async () => {
    console.log('🚀 Iniciando criação de pedidos...')
    console.log('📋 Formulário:', JSON.stringify(formData, null, 2))
    console.log('🛒 Carrinho:', JSON.stringify(carrinho, null, 2))
    
    // Validação
    if (!formData.secretaria_id || !formData.setor_id) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Selecione a secretaria e o setor'
      })
      return
    }
    
    if (carrinho.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de criar os pedidos'
      })
      return
    }
    
    // Verificar se há produtos sem fornecedor
    const semFornecedor = carrinho.filter(item => !item.produto.fornecedor || !item.produto.fornecedor.id)
    if (semFornecedor.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Produtos sem fornecedor',
        description: `${semFornecedor.length} produto(s) não possuem fornecedor vinculado`
      })
      return
    }
    
    try {
      setIsCreating(true)
      
      const pedidosPreview = agruparPorFornecedor()
      console.log('📦 Pedidos preview:', JSON.stringify(pedidosPreview, null, 2))
      
      const pedidosPorFornecedor = pedidosPreview.map(grupo => ({
        fornecedor_id: grupo.fornecedor.id,
        itens: grupo.itens.map(item => ({
          produto_aquisicao_id: item.produto.produto_aquisicao_id,
          quantidade: item.quantidade,
          observacao: item.observacao
        }))
      }))
      
      console.log('📦 pedidosPorFornecedor:', JSON.stringify(pedidosPorFornecedor, null, 2))
      
      const requestBody = {
        secretaria_id: formData.secretaria_id,
        setor_id: formData.setor_id,
        observacoes: formData.observacoes,
        pedidos_por_fornecedor: pedidosPorFornecedor
      }
      
      console.log('📤 Enviando requisição para /api/pedidos:', JSON.stringify(requestBody, null, 2))
      
      const response = await authenticatedFetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secretaria_id: formData.secretaria_id,
          setor_id: formData.setor_id,
          observacoes: formData.observacoes,
          pedidos_por_fornecedor: pedidosPorFornecedor
        })
      })
      
      console.log('📥 Resposta da API:', {
        status: response.status,
        ok: response.ok
      })
      
      const data = await response.json()
      
      console.log('📦 Dados da resposta:', JSON.stringify(data, null, 2))
      
      if (data.success) {
        toast({
          title: 'Pedidos criados com sucesso',
          description: `${data.data.total} pedido(s) gerado(s) automaticamente`
        })
        
        // Limpar formulário e carrinho
        setFormData({
          secretaria_id: '',
          setor_id: '',
          observacoes: ''
        })
        setCarrinho([])
        setActiveTab('carrinho')
        
        // Notificar componente pai
        onPedidoCriado(data.data.pedidos || [])
        
        // Fechar modal
        onClose()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar pedidos',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao criar pedidos:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar pedidos',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  const pedidosPreview = agruparPorFornecedor()
  const totalItens = carrinho.reduce((sum, item) => sum + parseFloat(item.quantidade.toString().replace(',', '.')), 0)
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados-gerais">
            <Building2 className="mr-2 h-4 w-4" />
            Dados Gerais
          </TabsTrigger>
          <TabsTrigger value="carrinho">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Carrinho ({carrinho.length})
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Package className="mr-2 h-4 w-4" />
            Preview ({pedidosPreview.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dados-gerais" className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="aquisicao" className="text-right">
              Aquisição (opcional)
            </Label>
            <select
              id="aquisicao"
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedAquisicao}
              onChange={(e) => {
                setSelectedAquisicao(e.target.value)
                setCarrinho([])
              }}
              disabled={isLoadingAquisicoes}
            >
              <option value="">Todas as aquisições</option>
              {isLoadingAquisicoes ? (
                <option value="" disabled>Carregando...</option>
              ) : aquisicoes.length === 0 ? (
                <option value="" disabled>Nenhuma aquisição cadastrada</option>
              ) : (
                aquisicoes.map((aquisicao: any) => (
                  <option key={aquisicao.id} value={aquisicao.id.toString()}>
                    {aquisicao.numero_proc} - {aquisicao.fornecedor?.nome || 'Sem fornecedor'}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="secretaria" className="text-right">
              Secretaria *
            </Label>
            <select
              id="secretaria"
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.secretaria_id}
              onChange={(e) => setFormData({ ...formData, secretaria_id: e.target.value, setor_id: '' })}
              disabled={isLoadingSecretarias}
            >
              <option value="">Selecione...</option>
              {isLoadingSecretarias ? (
                <option value="" disabled>Carregando...</option>
              ) : secretarias.length === 0 ? (
                <option value="" disabled>Nenhuma secretaria cadastrada</option>
              ) : (
                secretarias.map((secretaria) => (
                  <option key={secretaria.id} value={secretaria.id.toString()}>
                    {secretaria.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="setor" className="text-right">
              Setor *
            </Label>
            <select
              id="setor"
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.setor_id}
              onChange={(e) => setFormData({ ...formData, setor_id: e.target.value })}
              disabled={!formData.secretaria_id || isLoadingSetores}
            >
              <option value="">Selecione...</option>
              {isLoadingSetores ? (
                <option value="" disabled>Carregando...</option>
              ) : setores.length === 0 ? (
                <option value="" disabled>Selecione uma secretaria primeiro</option>
              ) : (
                setores.map((setor) => (
                  <option key={setor.id} value={setor.id.toString()}>
                    {setor.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="observacoes" className="text-right">
              Observações
            </Label>
            <textarea
              id="observacoes"
              className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Observações sobre o pedido..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="carrinho" className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Adicione produtos ao carrinho. O sistema agrupará automaticamente por fornecedor.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadProdutosAquisicao}
                disabled={!selectedAquisicao || isLoadingProdutosAquisicao}
              >
                <Package className="mr-2 h-4 w-4" />
                Ver Produtos da Aquisição
              </Button>
              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Buscar Produto no Estoque</DialogTitle>
                    <DialogDescription>
                      Pesquise produtos de todos os fornecedores. Selecione múltiplos produtos para adicionar ao carrinho de uma vez.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome ou código do produto..."
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {isLoadingProdutos ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <p className="text-muted-foreground">Buscando produtos...</p>
                      </div>
                    ) : produtos.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">
                                <input
                                  type="checkbox"
                                  checked={produtos.length > 0 && produtos.every(p => selectedProdutos.has(String(p.id)))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProdutos(new Set(produtos.map(p => String(p.id))))
                                    } else {
                                      setSelectedProdutos(new Set())
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead>Fornecedor</TableHead>
                              <TableHead>Preço Unit.</TableHead>
                              <TableHead>Saldo</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {produtos.map((produto) => (
                              <TableRow key={produto.id}>
                                <TableCell className="w-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedProdutos.has(String(produto.id))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedProdutos(prev => new Set([...prev, String(produto.id)]))
                                      } else {
                                        setSelectedProdutos(prev => {
                                          const newSet = new Set(prev)
                                          newSet.delete(String(produto.id))
                                          return newSet
                                        })
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="min-w-[300px] max-w-[500px]">
                                  <div>
                                    <p className="font-medium break-words">{produto.descricao}</p>
                                    <p className="text-xs text-muted-foreground">{produto.codigo}</p>
                                    {produto.marca && (
                                      <p className="text-xs text-muted-foreground">{produto.marca.nome}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {produto.fornecedor ? (
                                    <div>
                                      <p className="text-sm">{produto.fornecedor.nome}</p>
                                      <p className="text-xs text-muted-foreground">{produto.fornecedor.codigo}</p>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Sem fornecedor</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {produto.preco_unitario && (
                                    <Badge variant="outline">
                                      R$ {produto.preco_unitario.toFixed(2)}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={produto.saldo_atual > 0 ? "outline" : "destructive"}>
                                    {produto.saldo_atual} {produto.unidade?.sigla}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      adicionarAoCarrinho(produto)
                                      setIsSearchDialogOpen(false)
                                      setSearchProduto('')
                                      setProdutos([])
                                      setSelectedProdutos(new Set())
                                    }}
                                    disabled={!produto.fornecedor}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        <div className="flex justify-between items-center gap-4 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (selectedProdutos.size > 0) {
                                produtos.forEach(produto => {
                                  if (selectedProdutos.has(String(produto.id))) {
                                    adicionarAoCarrinho(produto)
                                  }
                                })
                                setIsSearchDialogOpen(false)
                                setSearchProduto('')
                                setProdutos([])
                                setSelectedProdutos(new Set())
                              }
                            }}
                            disabled={selectedProdutos.size === 0}
                          >
                            Adicionar {selectedProdutos.size} Selecionado(s) ao Carrinho
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedProdutos(new Set())
                            }}
                          >
                            Limpar Seleção
                          </Button>
                        </div>
                      </div>
                    ) : searchProduto.length >= 2 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Nenhum produto encontrado</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Digite pelo menos 2 caracteres para buscar</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
                      Fechar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {carrinho.length > 0 ? (
            <div className="rounded-md border overflow-x-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrinho.map((item) => {
                    const valorUnitario = item.produto.preco_unitario || 0
                    const valorTotalItem = valorUnitario * parseFloat(item.quantidade.toString().replace(',', '.'))
                    return (
                      <TableRow key={item.produto.id}>
                        <TableCell className="min-w-[300px] max-w-[500px]">
                          <div>
                            <p className="font-medium break-all">{item.produto.descricao}</p>
                            <p className="text-xs text-muted-foreground">{item.produto.codigo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{item.produto.fornecedor?.nome || 'Sem fornecedor'}</p>
                            <p className="text-xs text-muted-foreground">{item.produto.fornecedor?.codigo || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const qtdAtual = parseFloat(item.quantidade.toString().replace(',', '.'))
                                atualizarQuantidade(item.produto.id, (qtdAtual - 1).toString())
                              }}
                            >
                              -
                            </Button>
                            <Input
                              type="text"
                              value={item.quantidade}
                              onChange={(e) => atualizarQuantidade(item.produto.id, e.target.value)}
                              className="w-20 text-center"
                              placeholder="Ex: 5,5796871565655"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const qtdAtual = parseFloat(item.quantidade.toString().replace(',', '.'))
                                atualizarQuantidade(item.produto.id, (qtdAtual + 1).toString())
                              }}
                            >
                              +
                            </Button>
                            <span className="text-sm text-muted-foreground">{item.produto.unidade.sigla}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {valorUnitario > 0 ? (
                            <Badge variant="outline">
                              R$ {valorUnitario.toFixed(2)}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {valorTotalItem > 0 ? (
                            <span>R$ {valorTotalItem.toFixed(2)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      TOTAL DO CARRINHO:
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {carrinho.reduce((total, item) => {
                        return total + ((item.produto.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
                      }, 0).toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum item adicionado ao carrinho
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4 py-4">
          {pedidosPreview.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                <span>Total de itens: {totalItens}</span>
                <ArrowRight className="h-4 w-4" />
                <Package className="h-4 w-4" />
                <span>Gerará {pedidosPreview.length} pedido(s) separado(s)</span>
              </div>
              
              {pedidosPreview.map((preview) => {
                const valorTotalPedido = preview.itens.reduce((total, item) => {
                  return total + ((item.produto.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
                }, 0)
                
                return (
                  <Card key={preview.fornecedor.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-base">{preview.fornecedor.nome}</CardTitle>
                            <CardDescription className="text-xs">{preview.fornecedor.codigo}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{preview.itens.length} item(ns)</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-x-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Unidade</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead className="text-right">Valor Unitário</TableHead>
                              <TableHead className="text-right">Valor Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.itens.map((item) => {
                              const valorUnitario = item.produto.preco_unitario || 0
                              const valorTotalItem = valorUnitario * parseFloat(item.quantidade.toString().replace(',', '.'))
                              return (
                                <TableRow key={item.produto.id}>
                                  <TableCell className="text-sm min-w-[300px] max-w-[500px] break-all">{item.produto.descricao}</TableCell>
                                  <TableCell className="text-sm">{item.produto.unidade.sigla}</TableCell>
                                  <TableCell className="text-sm font-medium">{item.quantidade}</TableCell>
                                  <TableCell className="text-right">
                                    {valorUnitario > 0 ? (
                                      <Badge variant="outline">
                                        R$ {valorUnitario.toFixed(2)}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {valorTotalItem > 0 ? (
                                      <span>R$ {valorTotalItem.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={4} className="text-right font-semibold">
                                TOTAL DO PEDIDO:
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                R$ {valorTotalPedido.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Adicione itens ao carrinho para ver o preview dos pedidos
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              secretaria_id: '',
              setor_id: '',
              observacoes: ''
            })
            setCarrinho([])
            setActiveTab('carrinho')
            onClose()
          }}
        >
          Cancelar
        </Button>
        <Button onClick={handleCriarPedidos} disabled={isCreating || carrinho.length === 0}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Criar {pedidosPreview.length} Pedido(s)
            </>
          )}
        </Button>
      </div>
      
      <ProdutosAquisicaoDialog
        open={isViewAquisicaoDialogOpen}
        onClose={() => setIsViewAquisicaoDialogOpen(false)}
        produtos={produtosAquisicao}
        isLoading={isLoadingProdutosAquisicao}
        onSelectProducts={onSelectProducts}
      />
    </div>
  )
}
