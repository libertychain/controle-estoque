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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { WindowDialog } from '@/components/ui/window-dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export default function PedidosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewPedidoOpen, setIsNewPedidoOpen] = useState(false)
  
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
  const [selectedAquisicaoEdit, setSelectedAquisicaoEdit] = useState<string>('')
  
  // Estados para formulário
  const [formData, setFormData] = useState({
    secretaria_id: '',
    setor_id: '',
    observacoes: ''
  })
  
  const [activeTab, setActiveTab] = useState('carrinho')
  
  // Estados para visualização de pedido
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<any>(null)
  const [isLoadingPedido, setIsLoadingPedido] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isSavingPedido, setIsSavingPedido] = useState(false)
  const [editFormData, setEditFormData] = useState({
    secretaria_id: '',
    setor_id: '',
    data_pedido: '',
    observacoes: ''
  })
  const [editItens, setEditItens] = useState<any[]>([])
  const [isSearchProdutoEditOpen, setIsSearchProdutoEditOpen] = useState(false)
  const [fornecedorPermitidoEdit, setFornecedorPermitidoEdit] = useState<Fornecedor | null>(null)

  // Carregar pedidos ao montar
  useEffect(() => {
    loadPedidos()
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

  // Carregar setores quando secretaria de edição é alterada
  useEffect(() => {
    if (editFormData.secretaria_id) {
      loadSetores(parseInt(editFormData.secretaria_id))
    } else {
      setSetores([])
    }
  }, [editFormData.secretaria_id])

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

  const searchProdutos = async () => {
    try {
      setIsLoadingProdutos(true)
      let url = `/api/produtos-aquisicao?search=${encodeURIComponent(searchProduto)}&limit=50`
      
      // Se uma aquisição foi selecionada, filtrar por ela
      if (selectedAquisicao) {
        url += `&aquisicao_id=${selectedAquisicao}`
      }
      
      // Se estiver no modo de edição e uma aquisição foi selecionada, filtrar por ela
      if (selectedAquisicaoEdit) {
        url += `&aquisicao_id=${selectedAquisicaoEdit}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
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
      const aquisicaoId = isEditMode ? selectedAquisicaoEdit : selectedAquisicao
      
      if (!aquisicaoId) {
        toast({
          variant: 'destructive',
          title: 'Aquisição não selecionada',
          description: 'Selecione uma aquisição primeiro para ver os produtos.'
        })
        return
      }
      
      const url = `/api/produtos-aquisicao?aquisicao_id=${aquisicaoId}&limit=500`
      const response = await fetch(url)
      const data = await response.json()
      
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

  const adicionarAoCarrinho = (produto: Produto, quantidade: string = '1') => {
    // Usar forma funcional de setCarrinho para evitar problemas com estado stale
    setCarrinho(prevCarrinho => {
      // Verificar se já existe no carrinho
      const itemExistente = prevCarrinho.find(item => item.produto.id === produto.id)
      
      if (itemExistente) {
        // Converter para number, somar e converter de volta para string
        const qtdAtual = parseFloat(item.quantidade.toString().replace(',', '.'))
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
    // Converter vírgula para ponto para parsing correto
    const qtdNumerica = parseFloat(quantidade.toString().replace(',', '.'))
    
    if (qtdNumerica <= 0) {
      removerDoCarrinho(produtoId)
    } else {
      setCarrinho(carrinho.map(item =>
        item.produto.id === produtoId
          ? { ...item, quantidade } // MANTER COMO STRING para preservar precisão
          : item
      ))
    }
  }

  const agruparPorFornecedor = (): PedidoPreview[] => {
    const grupos: { [key: number]: PedidoPreview } = {}
    
    carrinho.forEach(item => {
      const fornecedor = item.produto.fornecedor
      
      if (!fornecedor) {
        // Produto sem fornecedor não pode ser adicionado a pedido
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
      // Nota: valorTotal seria calculado se tivéssemos preço no produto
    })
    
    return Object.values(grupos)
  }

  const handleCriarPedidos = async () => {
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
    const semFornecedor = carrinho.filter(item => !item.produto.fornecedor)
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
      
      const pedidosPorFornecedor = agruparPorFornecedor().map(grupo => ({
        fornecedor_id: grupo.fornecedor.id,
        itens: grupo.itens.map(item => ({
          produto_aquisicao_id: item.produto.produto_aquisicao_id,
          quantidade: item.quantidade,
          observacao: item.observacao
        }))
      }))
      
      const response = await fetch('/api/pedidos', {
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
      
      const data = await response.json()
      
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
        setIsNewPedidoOpen(false)
        setIsMaximized(false)
        
        // Recarregar lista de pedidos
        await loadPedidos()
        
        // Perguntar se deseja imprimir todos os pedidos criados
        if (data.data.pedidos && data.data.pedidos.length > 1) {
          console.log('Pedidos criados:', data.data.pedidos)
          console.log('Total de pedidos:', data.data.total)
          if (confirm(`Deseja imprimir todos os ${data.data.total} pedidos criados?`)) {
            console.log('Iniciando impressão de múltiplos pedidos...')
            handleImprimirMultiplosPedidos(data.data.pedidos)
          }
        } else if (data.data.pedidos && data.data.pedidos.length === 1) {
          // Abrir modal de visualização do primeiro pedido criado
          handleViewPedido(data.data.pedidos[0].id)
        }
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

  const handleImprimirMultiplosPedidos = (pedidos: any[]) => {
    console.log('handleImprimirMultiplosPedidos chamada com pedidos:', pedidos)
    console.log('Número de pedidos:', pedidos.length)
    
    try {
      // Validar se há pedidos
      if (!pedidos || pedidos.length === 0) {
        console.error('Nenhum pedido para imprimir')
        toast({
          variant: 'destructive',
          title: 'Erro ao imprimir pedidos',
          description: 'Nenhum pedido disponível para impressão'
        })
        return
      }
      
      // Criar conteúdo HTML para impressão de múltiplos pedidos
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedidos Múltiplos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .pedido-container {
              margin-bottom: 50px;
              page-break-after: always;
            }
            .pedido-container:last-child {
              page-break-after: auto;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-box {
              border: 1px solid #ccc;
              padding: 10px;
            }
            .info-box h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .info-box p {
              margin: 5px 0;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .table th, .table td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            .table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .table td.text-right {
              text-align: right;
            }
            .table th.text-right {
              text-align: right;
            }
            .table tfoot td {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .total-pedido {
              margin-top: 20px;
              text-align: right;
              font-weight: bold;
              font-size: 14px;
              page-break-inside: avoid;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #ccc;
              padding-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            .signature-section {
              margin-top: 60px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 300px;
              margin: 0 auto;
              padding-top: 5px;
            }
            .signature-label {
              margin-top: 10px;
              font-weight: bold;
            }
            @media print {
              .pedido-container {
                page-break-after: always;
              }
              .pedido-container:last-child {
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          ${pedidos.map((pedido, index) => {
            // Verificar se o pedido existe e tem itens
            if (!pedido) {
              return ''
            }
            
            // Identificar o fornecedor dos itens
            const fornecedor = pedido.itens && Array.isArray(pedido.itens) && pedido.itens.length > 0
              ? pedido.itens[0].produto?.fornecedor
              : null
            
            // Calcular o total do pedido
            const valorTotalPedido = pedido.itens && Array.isArray(pedido.itens) && pedido.itens.length > 0
              ? pedido.itens.reduce((total: number, item: any) => {
                  return total + ((item.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
                }, 0)
              : 0
            
            return `
              <div class="pedido-container">
                <div class="header">
                  <h1>PEDIDO DE MATERIAIS</h1>
                  <p>Número: ${pedido.numero || '-'}</p>
                </div>
                <div class="info-grid">
                  <div class="info-box">
                    <h3>Dados do Pedido</h3>
                    <p><strong>Data:</strong> ${pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleDateString('pt-BR') : '-'}</p>
                    <p><strong>Número:</strong> ${pedido.numero || '-'}</p>
                    <p><strong>Secretaria:</strong> ${pedido.secretaria?.nome || '-'}</p>
                    <p><strong>Setor:</strong> ${pedido.setor?.nome || '-'}</p>
                  </div>
                  <div class="info-box">
                    <h3>Dados do Fornecedor</h3>
                    ${fornecedor ? `
                      <p><strong>Nome:</strong> ${fornecedor.nome}</p>
                      <p><strong>CNPJ:</strong> ${fornecedor.cnpj || '-'}</p>
                      <p><strong>Endereço:</strong> ${fornecedor.contato || '-'}</p>
                      <p><strong>Telefone:</strong> ${fornecedor.telefone || '-'}</p>
                      <p><strong>Email:</strong> ${fornecedor.email || '-'}</p>
                    ` : '<p>Nenhum fornecedor informado</p>'}
                  </div>
                </div>
    
                ${pedido.observacoes ? `
                  <div class="info-box" style="margin-bottom: 30px;">
                    <h3>Observações</h3>
                    <p>${pedido.observacoes}</p>
                  </div>
                ` : ''}
    
                <h3>Itens do Pedido</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Código</th>
                      <th>Descrição</th>
                      <th>Unidade</th>
                      <th>Quantidade</th>
                      <th class="text-right">Valor Unitário</th>
                      <th class="text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pedido.itens && Array.isArray(pedido.itens) && pedido.itens.length > 0 ? pedido.itens.map((item: any, itemIndex: number) => {
                      const valorUnitario = item.preco_unitario || 0
                      const valorTotalItem = valorUnitario * parseFloat(item.quantidade.toString().replace(',', '.'))
                      return `
                        <tr>
                          <td>${itemIndex + 1}</td>
                          <td>${item.produto?.codigo || '-'}</td>
                          <td>${item.produto?.descricao || '-'}</td>
                          <td>${item.produto?.unidade?.sigla || '-'}</td>
                          <td>${item.quantidade}</td>
                          <td class="text-right">${valorUnitario > 0 ? 'R$ ' + valorUnitario.toFixed(2) : '-'}</td>
                          <td class="text-right">${valorTotalItem > 0 ? 'R$ ' + valorTotalItem.toFixed(2) : '-'}</td>
                        </tr>
                      `
                    }).join('') : '<tr><td colspan="7" style="text-align: center;">Nenhum item no pedido</td></tr>'}
                  </tbody>
                </table>
    
                <div class="total-pedido">
                  TOTAL DO PEDIDO: R$ ${valorTotalPedido.toFixed(2)}
                </div>
    
                <div class="signature-section">
                  <div class="signature-line"></div>
                  <p class="signature-label">Secretário(a) de Compras</p>
                </div>
    
                <div class="footer">
                  <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
                  <p>Sistema de Controle de Estoque para Licitações Públicas</p>
                </div>
              </div>
            `
          }).join('')}
        </body>
        </html>
      `
      
      console.log('Conteúdo HTML gerado, tamanho:', printContent.length)
      
      // Abrir janela de impressão
      console.log('Tentando abrir janela de impressão...')
      const printWindow = window.open('', '_blank')
      console.log('Janela de impressão:', printWindow)
      
      if (printWindow) {
        console.log('Escrevendo conteúdo na janela...')
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        console.log('Chamando print()...')
        printWindow.print()
        console.log('Print chamado com sucesso')
      } else {
        console.error('Não foi possível abrir a janela de impressão')
        toast({
          variant: 'destructive',
          title: 'Erro ao abrir janela de impressão',
          description: 'Verifique se o bloqueador de pop-ups está ativado'
        })
      }
    } catch (error) {
      console.error('Erro ao imprimir múltiplos pedidos:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao imprimir pedidos',
        description: 'Ocorreu um erro ao tentar abrir a janela de impressão'
      })
    }
  }

  const handleFinalizarPedido = async (pedidoId: number) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/finalizar`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Pedido finalizado com sucesso',
          description: 'O estoque foi atualizado automaticamente'
        })
        loadPedidos()
        // Se o pedido visualizado for o mesmo que foi finalizado, atualizar
        if (selectedPedido && selectedPedido.id === pedidoId) {
          loadPedido(pedidoId)
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao finalizar pedido',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar pedido',
        description: 'Tente novamente mais tarde'
      })
    }
  }

  const loadPedido = async (pedidoId: number) => {
    try {
      setIsLoadingPedido(true)
      const response = await fetch(`/api/pedidos/${pedidoId}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedPedido(data.data.pedido)
        setEditFormData({
          secretaria_id: data.data.pedido.secretaria_id?.toString() || '',
          setor_id: data.data.pedido.setor_id?.toString() || '',
          data_pedido: data.data.pedido.data_pedido ? data.data.pedido.data_pedido.split('T')[0] : '',
          observacoes: data.data.pedido.observacoes || ''
        })
        // Carregar itens para edição
        if (data.data.pedido.itens) {
          setEditItens(data.data.pedido.itens.map((item: any) => ({
            id: item.id,
            produto_id: item.produto.id,
            produto: item.produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            observacao: item.observacao
          })))
          
          // Identificar o fornecedor dos itens existentes para edição
          const primeiroItemComFornecedor = data.data.pedido.itens.find((item: any) => item.produto?.fornecedor)
          if (primeiroItemComFornecedor?.produto?.fornecedor) {
            setFornecedorPermitidoEdit(primeiroItemComFornecedor.produto.fornecedor)
          } else {
            setFornecedorPermitidoEdit(null)
          }
        } else {
          setFornecedorPermitidoEdit(null)
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar pedido',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
        setIsViewDialogOpen(false)
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar pedido',
        description: 'Tente novamente mais tarde'
      })
      setIsViewDialogOpen(false)
    } finally {
      setIsLoadingPedido(false)
    }
  }

  const handleViewPedido = (pedidoId: number) => {
    setIsViewDialogOpen(true)
    setIsEditMode(false)
    setIsMaximized(false)
    loadPedido(pedidoId)
  }

  const handleEditPedidoFromTable = async (pedidoId: number) => {
    // Carregar o pedido primeiro
    await loadPedido(pedidoId)
    // Depois abrir o modal e ativar o modo de edição
    setIsViewDialogOpen(true)
    setIsEditMode(true)
    setIsMaximized(false)
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

  const handleEditPedido = () => {
    setIsEditMode(true)
    setIsMaximized(false)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setIsMaximized(false)
    if (selectedPedido) {
      setEditFormData({
        secretaria_id: selectedPedido.secretaria_id?.toString() || '',
        setor_id: selectedPedido.setor_id?.toString() || '',
        data_pedido: selectedPedido.data_pedido ? selectedPedido.data_pedido.split('T')[0] : '',
        observacoes: selectedPedido.observacoes || ''
      })
      // Restaurar itens originais
      if (selectedPedido.itens) {
        setEditItens(selectedPedido.itens.map((item: any) => ({
          id: item.id,
          produto_id: item.produto.id,
          produto: item.produto,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          observacao: item.observacao
        })))
      }
    }
  }

  const adicionarItemEditavel = (produto: Produto, quantidade: string = '1') => {
    // Validar se o produto pertence ao fornecedor permitido durante a edição
    if (fornecedorPermitidoEdit && produto.fornecedor) {
      if (produto.fornecedor.id !== fornecedorPermitidoEdit.id) {
        toast({
          variant: 'destructive',
          title: 'Fornecedor não permitido',
          description: `Este pedido só pode conter itens do fornecedor "${fornecedorPermitidoEdit.nome}". O produto "${produto.descricao}" pertence ao fornecedor "${produto.fornecedor.nome}".`
        })
        return
      }
    }
    
    // Usar forma funcional de setEditItens para evitar problemas com estado stale
    setEditItens(prevEditItens => {
      // Verificar se já existe nos itens editáveis usando produto_aquisicao_id
      const itemExistente = prevEditItens.find(item =>
        item.produto?.produto_aquisicao_id === produto.produto_aquisicao_id ||
        item.produto_id === produto.produto_aquisicao_id
      )
      
      if (itemExistente) {
        // Converter para number, somar e converter de volta para string
        const qtdAtual = parseFloat(itemExistente.quantidade.toString().replace(',', '.'))
        const qtdAdicionar = parseFloat(quantidade.toString().replace(',', '.'))
        const novaQtd = (qtdAtual + qtdAdicionar).toString()
        return prevEditItens.map(item =>
          item.produto?.produto_aquisicao_id === produto.produto_aquisicao_id ||
          item.produto_id === produto.produto_aquisicao_id
            ? { ...item, quantidade: novaQtd }
            : item
        )
      } else {
        return [...prevEditItens, {
          id: `temp-${Date.now()}`,
          produto_id: produto.produto_aquisicao_id?.toString() || produto.id,
          produto: produto,
          quantidade,
          preco_unitario: produto.preco_unitario,
          observacao: ''
        }]
      }
    })
    
    toast({
      title: 'Produto adicionado',
      description: `${produto.descricao} foi adicionado ao pedido`
    })
  }

  const removerItemEditavel = (produtoId: number | string) => {
    setEditItens(editItens.filter(item => 
      item.produto?.produto_aquisicao_id !== produtoId &&
      item.produto_id !== produtoId
    ))
  }

  const atualizarQuantidadeEditavel = (produtoId: number | string, quantidade: string) => {
    // Converter vírgula para ponto para parsing correto
    const qtdNumerica = parseFloat(quantidade.toString().replace(',', '.'))
    
    if (qtdNumerica <= 0) {
      removerItemEditavel(produtoId)
    } else {
      setEditItens(editItens.map(item =>
        item.produto?.produto_aquisicao_id === produtoId ||
        item.produto_id === produtoId
          ? { ...item, quantidade } // MANTER COMO STRING para preservar precisão
          : item
      ))
    }
  }

  const handleSavePedido = async () => {
    if (!selectedPedido) return
    
    // Validação
    if (!editFormData.secretaria_id || !editFormData.setor_id) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Selecione a secretaria e o setor'
      })
      return
    }

    if (editItens.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Itens vazios',
        description: 'O pedido deve ter pelo menos um item'
      })
      return
    }

    try {
      setIsSavingPedido(true)
      const response = await fetch(`/api/pedidos/${selectedPedido.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secretaria_id: editFormData.secretaria_id,
          setor_id: editFormData.setor_id,
          data_pedido: editFormData.data_pedido,
          observacoes: editFormData.observacoes,
          itens: editItens.map(item => {
            // Se o produto tem produto_aquisicao_id, usar ele
            // Caso contrário, usar o produto_id existente (para itens já no pedido)
            if (item.produto && item.produto.produto_aquisicao_id) {
              return {
                produto_aquisicao_id: item.produto.produto_aquisicao_id,
                quantidade: item.quantidade,
                observacao: item.observacao
              }
            } else {
              // Item existente no pedido, usar produto_id numérico
              const produtoId = typeof item.produto_id === 'string' ? parseInt(item.produto_id) : item.produto_id
              if (isNaN(produtoId)) {
                console.error('produto_id inválido:', item.produto_id, item)
                throw new Error(`produto_id inválido: ${item.produto_id}`)
              }
              return {
                produto_id: produtoId,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                observacao: item.observacao
              }
            }
          })
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Pedido atualizado com sucesso',
          description: 'As alterações foram salvas'
        })
        setSelectedPedido(data.data.pedido)
        setIsEditMode(false)
        setIsMaximized(false)
        loadPedidos()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar pedido',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar pedido',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsSavingPedido(false)
    }
  }

  const handleDeletePedido = async () => {
    if (!selectedPedido) return

    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/pedidos/${selectedPedido.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Pedido excluído com sucesso',
          description: 'O pedido foi removido do sistema'
        })
        setIsViewDialogOpen(false)
        setIsMaximized(false)
        setSelectedPedido(null)
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

  const handlePrintPedido = () => {
    if (!selectedPedido) return
    
    // Identificar o fornecedor dos itens
    const fornecedor = selectedPedido.itens && selectedPedido.itens.length > 0
      ? selectedPedido.itens[0].produto?.fornecedor
      : null
    
    // Calcular o total do pedido
    const valorTotalPedido = selectedPedido.itens?.reduce((total: number, item: any) => {
      return total + ((item.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
    }, 0) || 0
    
    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${selectedPedido.numero}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            border: 1px solid #ccc;
            padding: 10px;
          }
          .info-box h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .info-box p {
            margin: 5px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .table th, .table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .table td.text-right {
            text-align: right;
          }
          .table th.text-right {
            text-align: right;
          }
          .table tfoot td {
            font-weight: bold;
            background-color: #f9f9f9;
          }
          .total-pedido {
            margin-top: 20px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
            page-break-inside: avoid;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          .signature-section {
            margin-top: 60px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            width: 300px;
            margin: 0 auto;
            padding-top: 5px;
          }
          .signature-label {
            margin-top: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PEDIDO DE MATERIAIS</h1>
          <p>Número: ${selectedPedido.numero}</p>
        </div>
 
        <div class="info-grid">
          <div class="info-box">
            <h3>Dados do Pedido</h3>
            <p><strong>Data:</strong> ${new Date(selectedPedido.data_pedido).toLocaleDateString('pt-BR')}</p>
            <p><strong>Número:</strong> ${selectedPedido.numero}</p>
            <p><strong>Secretaria:</strong> ${selectedPedido.secretaria.nome}</p>
            <p><strong>Setor:</strong> ${selectedPedido.setor.nome}</p>
          </div>
          <div class="info-box">
            <h3>Dados do Fornecedor</h3>
            ${fornecedor ? `
              <p><strong>Nome:</strong> ${fornecedor.nome}</p>
              <p><strong>CNPJ:</strong> ${fornecedor.cnpj || '-'}</p>
              <p><strong>Endereço:</strong> ${fornecedor.contato || '-'}</p>
              <p><strong>Telefone:</strong> ${fornecedor.telefone || '-'}</p>
              <p><strong>Email:</strong> ${fornecedor.email || '-'}</p>
            ` : '<p>Nenhum fornecedor informado</p>'}
          </div>
        </div>
 
        ${selectedPedido.observacoes ? `
          <div class="info-box" style="margin-bottom: 30px;">
            <h3>Observações</h3>
            <p>${selectedPedido.observacoes}</p>
          </div>
        ` : ''}
 
        <h3>Itens do Pedido</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Código</th>
              <th>Descrição</th>
              <th>Unidade</th>
              <th>Quantidade</th>
              <th class="text-right">Valor Unitário</th>
              <th class="text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${selectedPedido.itens && selectedPedido.itens.length > 0 ? selectedPedido.itens.map((item: any, index: number) => {
              const valorUnitario = item.preco_unitario || 0
              const valorTotalItem = valorUnitario * parseFloat(item.quantidade.toString().replace(',', '.'))
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.produto.codigo}</td>
                  <td>${item.produto.descricao}</td>
                  <td>${item.produto.unidade.sigla}</td>
                  <td>${item.quantidade}</td>
                  <td class="text-right">${valorUnitario > 0 ? 'R$ ' + valorUnitario.toFixed(2) : '-'}</td>
                  <td class="text-right">${valorTotalItem > 0 ? 'R$ ' + valorTotalItem.toFixed(2) : '-'}</td>
                </tr>
              `
            }).join('') : '<tr><td colspan="7" style="text-align: center;">Nenhum item no pedido</td></tr>'}
          </tbody>
        </table>
  
        <div class="total-pedido">
          TOTAL DO PEDIDO: R$ ${valorTotalPedido.toFixed(2)}
        </div>
  
        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="signature-label">Secretário(a) de Compras</p>
        </div>
 
        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          <p>Sistema de Controle de Estoque para Licitações Públicas</p>
        </div>
      </body>
      </html>
    `

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const filteredPedidos = pedidos.filter((pedido) =>
    pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.secretaria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.setor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pedidosPreview = agruparPorFornecedor()
  const totalItens = carrinho.reduce((sum, item) => sum + parseFloat(item.quantidade.toString().replace(',', '.')), 0)

  return (
    <div className="space-y-6">
      <Header
        title="Pedidos"
        subtitle="Gerencie os pedidos de materiais"
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
          <Dialog open={isNewPedidoOpen} onOpenChange={(open) => {
            setIsNewPedidoOpen(open)
            if (!open) setIsMaximized(false)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isMaximized ? 'fixed inset-0 w-full h-full max-w-full max-h-full' : 'sm:max-w-[900px] max-h-[90vh]'} overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Criar Múltiplos Pedidos</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="h-8 w-8"
                  >
                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </DialogTitle>
                <DialogDescription>
                  Adicione itens ao carrinho. O sistema gerará automaticamente pedidos separados para cada fornecedor.
                </DialogDescription>
              </DialogHeader>
              
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
                        // Limpar carrinho ao mudar a aquisição
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
                                            // Se selecionar, selecionar todos
                                            setSelectedProdutos(new Set(produtos.map(p => String(p.id))))
                                          } else {
                                            // Se desselecionar, desselecionar todos
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
                                              // Se selecionar, adicionar ao conjunto
                                              setSelectedProdutos(prev => new Set([...prev, String(produto.id)]))
                                            } else {
                                              // Se desselecionar, remover do conjunto
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
                                      // Adicionar todos os produtos selecionados ao carrinho
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
                    
                    <Dialog open={isViewAquisicaoDialogOpen} onOpenChange={setIsViewAquisicaoDialogOpen}>
                      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Produtos da Aquisição</DialogTitle>
                          <DialogDescription>
                            {isEditMode
                              ? `Todos os produtos da aquisição selecionada. Selecione múltiplos produtos para adicionar ao pedido de edição.`
                              : 'Todos os produtos da aquisição selecionada. Selecione múltiplos produtos para adicionar ao carrinho.'
                            }
                          </DialogDescription>
                        </DialogHeader>
                        
                        {isLoadingProdutosAquisicao ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <p className="text-muted-foreground">Carregando produtos...</p>
                          </div>
                        ) : produtosAquisicao.length > 0 ? (
                          <div className="space-y-4">
                            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-10">
                                      <input
                                        type="checkbox"
                                        checked={produtosAquisicao.length > 0 && produtosAquisicao.every(p => selectedAquisicaoProdutos.has(String(p.id)))}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            // Se selecionar, selecionar todos
                                            setSelectedAquisicaoProdutos(new Set(produtosAquisicao.map(p => String(p.id))))
                                          } else {
                                            // Se desselecionar, desselecionar todos
                                            setSelectedAquisicaoProdutos(new Set())
                                          }
                                        }}
                                      />
                                    </TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Unidade</TableHead>
                                    <TableHead>Preço Unit.</TableHead>
                                    <TableHead>Saldo</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {produtosAquisicao.map((produto) => (
                                    <TableRow key={produto.id}>
                                      <TableCell className="w-10">
                                        <input
                                          type="checkbox"
                                          checked={selectedAquisicaoProdutos.has(String(produto.id))}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              // Se selecionar, adicionar ao conjunto
                                              setSelectedAquisicaoProdutos(prev => new Set([...prev, String(produto.id)]))
                                            } else {
                                              // Se desselecionar, remover do conjunto
                                              setSelectedAquisicaoProdutos(prev => {
                                                const newSet = new Set(prev)
                                                newSet.delete(String(produto.id))
                                                return newSet
                                              })
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{produto.codigo}</TableCell>
                                      <TableCell className="min-w-[300px] max-w-[500px]">
                                        <div>
                                          <p className="font-medium break-all">{produto.descricao}</p>
                                          {produto.marca && (
                                            <p className="text-xs text-muted-foreground">{produto.marca.nome}</p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>{produto.unidade.sigla}</TableCell>
                                      <TableCell>
                                        {produto.preco_unitario ? (
                                          <Badge variant="outline">
                                            R$ {produto.preco_unitario.toFixed(2)}
                                          </Badge>
                                        ) : (
                                          <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={produto.saldo_atual > 0 ? "outline" : "destructive"}>
                                          {produto.saldo_atual} {produto.unidade?.sigla}
                                        </Badge>
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
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            
                            <div className="flex justify-between items-center gap-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (selectedAquisicaoProdutos.size > 0) {
                                    // Adicionar todos os produtos selecionados
                                    produtosAquisicao.forEach(produto => {
                                      if (selectedAquisicaoProdutos.has(String(produto.id))) {
                                        if (isEditMode) {
                                          adicionarItemEditavel(produto)
                                        } else {
                                          adicionarAoCarrinho(produto)
                                        }
                                      }
                                    })
                                    setIsViewAquisicaoDialogOpen(false)
                                    setSelectedAquisicaoProdutos(new Set())
                                  }
                                }}
                                disabled={selectedAquisicaoProdutos.size === 0}
                              >
                                Adicionar {selectedAquisicaoProdutos.size} Selecionado(s) {isEditMode ? 'ao Pedido' : 'ao Carrinho'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedAquisicaoProdutos(new Set())
                                }}
                              >
                                Limpar Seleção
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">Nenhum produto encontrado na aquisição</p>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsViewAquisicaoDialogOpen(false)}>
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
                      
                      {pedidosPreview.map((preview, index) => {
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
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewPedidoOpen(false)
                    setIsMaximized(false)
                    setFormData({
                      secretaria_id: '',
                      setor_id: '',
                      observacoes: ''
                    })
                    setCarrinho([])
                    setActiveTab('carrinho')
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
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      {/* Modal de Visualização de Pedido */}
      <WindowDialog
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false)
          setIsMaximized(false)
        }}
        title={`Detalhes do Pedido ${selectedPedido?.numero || ''}`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false)
                setIsMaximized(false)
              }}
            >
              Fechar
            </Button>
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSavingPedido}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintPedido}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button
                  onClick={handleSavePedido}
                  disabled={isSavingPedido}
                >
                  {isSavingPedido ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePedido}
                  disabled={isSavingPedido}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleEditPedido}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrintPedido}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePedido}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </>
            )}
          </>
        }
      >
        {isLoadingPedido ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p className="text-muted-foreground">Carregando pedido...</p>
          </div>
        ) : selectedPedido ? (
          <div className="space-y-4">

            {/* Informações do Pedido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número do Pedido</Label>
                <p className="text-sm font-semibold">{selectedPedido.numero}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data do Pedido</Label>
                {isEditMode ? (
                  <Input
                    type="date"
                    className="w-full"
                    value={editFormData.data_pedido}
                    onChange={(e) => setEditFormData({ ...editFormData, data_pedido: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{new Date(selectedPedido.data_pedido).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aquisição (opcional)</Label>
                {isEditMode ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedAquisicaoEdit}
                    onChange={(e) => {
                      setSelectedAquisicaoEdit(e.target.value)
                      // Limpar produtos ao mudar a aquisição
                      setProdutos([])
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
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data do Pedido</Label>
                {isEditMode ? (
                  <Input
                    type="date"
                    className="w-full"
                    value={editFormData.data_pedido}
                    onChange={(e) => setEditFormData({ ...editFormData, data_pedido: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{new Date(selectedPedido.data_pedido).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Secretaria</Label>
                {isEditMode ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editFormData.secretaria_id}
                    onChange={(e) => setEditFormData({ ...editFormData, secretaria_id: e.target.value, setor_id: '' })}
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
                ) : (
                  <>
                    <p className="text-sm">{selectedPedido.secretaria.nome}</p>
                    <p className="text-xs text-muted-foreground">{selectedPedido.secretaria.sigla}</p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setor</Label>
                {isEditMode ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editFormData.setor_id}
                    onChange={(e) => setEditFormData({ ...editFormData, setor_id: e.target.value })}
                    disabled={!editFormData.secretaria_id || isLoadingSetores}
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
                ) : (
                  <p className="text-sm">{selectedPedido.setor.nome}</p>
                )}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              {isEditMode ? (
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editFormData.observacoes}
                  onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                  placeholder="Observações sobre o pedido..."
                />
              ) : (
                <p className="text-sm">{selectedPedido.observacoes || 'Nenhuma observação'}</p>
              )}
            </div>

            {/* Itens do Pedido */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Itens do Pedido ({isEditMode ? editItens.length : (selectedPedido.itens?.length || 0)})</Label>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadProdutosAquisicao}
                    disabled={!selectedAquisicaoEdit || isLoadingProdutosAquisicao}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Ver Produtos da Aquisição
                  </Button>
                )}
              </div>
              
              <div className="rounded-md border overflow-x-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="min-w-[300px]">Descrição</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      {isEditMode && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isEditMode ? (
                      <>
                        {editItens.length > 0 && editItens.map((item: any, index: number) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.produto.codigo}</TableCell>
                            <TableCell className="min-w-[300px] max-w-[500px]">
                              <div>
                                <p className="font-medium break-all">{item.produto.descricao}</p>
                                {item.produto.marca && (
                                  <p className="text-xs text-muted-foreground">{item.produto.marca.nome}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.produto.unidade.sigla}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const qtdAtual = parseFloat(item.quantidade.toString().replace(',', '.'))
                                    atualizarQuantidadeEditavel(item.produto?.produto_aquisicao_id || item.produto_id, (qtdAtual - 1).toString())
                                  }}
                                >
                                  -
                                </Button>
                                <Input
                                  type="text"
                                  value={item.quantidade}
                                  onChange={(e) => atualizarQuantidadeEditavel(item.produto?.produto_aquisicao_id || item.produto_id, e.target.value)}
                                  className="w-20 text-center"
                                  placeholder="Ex: 5,5796871565655"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const qtdAtual = parseFloat(item.quantidade.toString().replace(',', '.'))
                                    atualizarQuantidadeEditavel(item.produto?.produto_aquisicao_id || item.produto_id, (qtdAtual + 1).toString())
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.preco_unitario ? (
                                <Badge variant="outline">
                                  R$ {item.preco_unitario.toFixed(2)}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.preco_unitario ? (
                                <span>R$ {(item.preco_unitario * parseFloat(item.quantidade.toString().replace(',', '.'))).toFixed(2)}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.produto.fornecedor ? (
                                <div>
                                  <p className="text-sm">{item.produto.fornecedor.nome}</p>
                                  <p className="text-xs text-muted-foreground">{item.produto.fornecedor.codigo}</p>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerItemEditavel(item.produto_id)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Barra de busca dentro da tabela */}
                        <TableRow>
                          <TableCell colSpan={8} className="p-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder={fornecedorPermitidoEdit
                                  ? `Buscar produto do fornecedor "${fornecedorPermitidoEdit.nome}"...`
                                  : "Buscar produto para adicionar..."
                                }
                                value={searchProduto}
                                onChange={(e) => setSearchProduto(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Resultados da busca dentro da tabela */}
                        {produtos.length > 0 && produtos.map((produto) => {
                          // Filtrar produtos para mostrar apenas do fornecedor permitido durante edição
                          const isFornecedorPermitido = !fornecedorPermitidoEdit ||
                            (produto.fornecedor && produto.fornecedor.id === fornecedorPermitidoEdit.id)
                          
                          // Se não for o fornecedor permitido, não mostrar o produto
                          if (!isFornecedorPermitido) {
                            return null
                          }
                          
                          return (
                            <TableRow key={produto.id}>
                              <TableCell className="text-center text-muted-foreground">+</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{produto.codigo}</TableCell>
                              <TableCell className="min-w-[300px] max-w-[500px]">
                                <div>
                                  <p className="font-medium break-all">{produto.descricao}</p>
                                  {produto.marca && (
                                    <p className="text-xs text-muted-foreground">{produto.marca.nome}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{produto.unidade.sigla}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    value="1"
                                    onChange={() => {}}
                                    className="w-20 text-center"
                                    disabled
                                  />
                                  <span className="text-sm text-muted-foreground">{produto.unidade.sigla}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {produto.preco_unitario ? (
                                  <Badge variant="outline">
                                    R$ {produto.preco_unitario.toFixed(2)}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {produto.preco_unitario ? (
                                  <span>R$ {(produto.preco_unitario * 1).toFixed(2)}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
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
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    adicionarItemEditavel(produto)
                                    setSearchProduto('')
                                    setProdutos([])
                                  }}
                                  disabled={!produto.fornecedor}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        
                        {editItens.length === 0 && produtos.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              <p className="text-sm text-muted-foreground">Nenhum item no pedido. Digite acima para buscar produtos.</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ) : (
                      selectedPedido.itens && selectedPedido.itens.length > 0 ? (
                        selectedPedido.itens.map((item: any, index: number) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.produto.codigo}</TableCell>
                            <TableCell className="min-w-[300px] max-w-[500px]">
                              <div>
                                <p className="font-medium break-all">{item.produto.descricao}</p>
                                {item.produto.marca && (
                                  <p className="text-xs text-muted-foreground">{item.produto.marca.nome}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.produto.unidade.sigla}</TableCell>
                            <TableCell className="font-medium">{item.quantidade}</TableCell>
                            <TableCell>
                              {item.preco_unitario ? (
                                <Badge variant="outline">
                                  R$ {item.preco_unitario.toFixed(2)}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.preco_unitario ? (
                                <span>R$ {(item.preco_unitario * parseFloat(item.quantidade.toString().replace(',', '.'))).toFixed(2)}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.produto.fornecedor ? (
                                <div>
                                  <p className="text-sm">{item.produto.fornecedor.nome}</p>
                                  <p className="text-xs text-muted-foreground">{item.produto.fornecedor.codigo}</p>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Nenhum item no pedido</p>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                  {/* Linha de total do pedido */}
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7} className="text-right font-semibold">
                        TOTAL DO PEDIDO:
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {(isEditMode ? editItens : (selectedPedido.itens || [])).reduce((total, item) => {
                          return total + ((item.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
                        }, 0).toFixed(2)}
                      </TableCell>
                      {isEditMode && <TableCell colSpan={1}></TableCell>}
                    </TableRow>
                  </TableFooter>
                </Table>
            </div>
          </div>
        </div>
        ) : null}
      </WindowDialog>
    </div>
  )
}
