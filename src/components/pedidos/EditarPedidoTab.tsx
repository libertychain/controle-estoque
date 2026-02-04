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
import { useToast } from '@/hooks/use-toast'
import { ProdutosAquisicaoDialog } from './ProdutosAquisicaoDialog'
import {
  Search,
  Plus,
  Package,
  Loader2,
  X,
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

export interface EditarPedidoTabProps {
  pedidoId: number
  onClose: () => void
  onSave: () => void
}

export function EditarPedidoTab({ pedidoId, onClose, onSave }: EditarPedidoTabProps) {
  const { toast } = useToast()
  
  // Estados para edição
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [aquisicoes, setAquisicoes] = useState<any[]>([])
  const [isLoadingSecretarias, setIsLoadingSecretarias] = useState(true)
  const [isLoadingSetores, setIsLoadingSetores] = useState(false)
  const [isLoadingAquisicoes, setIsLoadingAquisicoes] = useState(false)
  const [isLoadingPedido, setIsLoadingPedido] = useState(false)
  const [isSavingPedido, setIsSavingPedido] = useState(false)
  
  // Estados para busca de produtos
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false)
  const [searchProduto, setSearchProduto] = useState('')
  const [isViewAquisicaoDialogOpen, setIsViewAquisicaoDialogOpen] = useState(false)
  const [isLoadingProdutosAquisicao, setIsLoadingProdutosAquisicao] = useState(false)
  const [produtosAquisicao, setProdutosAquisicao] = useState<Produto[]>([])
  const [selectedAquisicaoProdutos, setSelectedAquisicaoProdutos] = useState<Set<string>>(new Set())
  
  // Estados para seleção de aquisição
  const [selectedAquisicao, setSelectedAquisicao] = useState<string>('')
  
  // Estados para formulário
  const [editFormData, setEditFormData] = useState({
    secretaria_id: '',
    setor_id: '',
    data_pedido: '',
    observacoes: ''
  })
  const [editItens, setEditItens] = useState<any[]>([])
  const [fornecedorPermitidoEdit, setFornecedorPermitidoEdit] = useState<Fornecedor | null>(null)
  
  // Carregar dados iniciais
  useEffect(() => {
    loadSecretarias()
    loadAquisicoes()
    loadPedido(pedidoId)
  }, [pedidoId])
  
  // Carregar setores quando secretaria é selecionada
  useEffect(() => {
    if (editFormData.secretaria_id) {
      loadSetores(parseInt(editFormData.secretaria_id))
    } else {
      setSetores([])
    }
  }, [editFormData.secretaria_id])
  
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
  
  const loadPedido = async (pedidoId: number) => {
    try {
      setIsLoadingPedido(true)
      const response = await fetch(`/api/pedidos/${pedidoId}`)
      const data = await response.json()
      
      if (data.success) {
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
        onClose()
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar pedido',
        description: 'Tente novamente mais tarde'
      })
      onClose()
    } finally {
      setIsLoadingPedido(false)
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
      
      if (!selectedAquisicao) {
        toast({
          variant: 'destructive',
          title: 'Aquisição não selecionada',
          description: 'Selecione uma aquisição primeiro para ver os produtos.'
        })
        return
      }
      
      const url = `/api/produtos-aquisicao?aquisicao_id=${selectedAquisicao}&limit=500`
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
  
  const onSelectProducts = (produtosSelecionados: Produto[]) => {
    produtosSelecionados.forEach(produto => {
      adicionarItemEditavel(produto, '1')
    })
    setIsViewAquisicaoDialogOpen(false)
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
    
    setEditItens(prevEditItens => {
      const itemExistente = prevEditItens.find(item =>
        item.produto?.produto_aquisicao_id === produto.produto_aquisicao_id ||
        item.produto_id === produto.produto_aquisicao_id
      )
      
      if (itemExistente) {
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
    const qtdNumerica = parseFloat(quantidade.toString().replace(',', '.'))
    
    if (qtdNumerica <= 0) {
      removerItemEditavel(produtoId)
    } else {
      setEditItens(editItens.map(item =>
        item.produto?.produto_aquisicao_id === produtoId ||
        item.produto_id === produtoId
          ? { ...item, quantidade }
          : item
      ))
    }
  }
  
  const handleSavePedido = async () => {
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
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
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
            if (item.produto && item.produto.produto_aquisicao_id) {
              return {
                produto_aquisicao_id: item.produto.produto_aquisicao_id,
                quantidade: item.quantidade,
                observacao: item.observacao
              }
            } else {
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
        onSave()
        onClose()
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
  
  const handleCancelEdit = () => {
    onClose()
  }
  
  if (isLoadingPedido) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-muted-foreground">Carregando pedido...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Informações do Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Número do Pedido</Label>
          <p className="text-sm font-semibold">{pedidoId}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Data do Pedido</Label>
          <Input
            type="date"
            className="w-full"
            value={editFormData.data_pedido}
            onChange={(e) => setEditFormData({ ...editFormData, data_pedido: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Aquisição (opcional)</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedAquisicao}
            onChange={(e) => {
              setSelectedAquisicao(e.target.value)
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
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Secretaria</Label>
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
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Setor</Label>
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
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Observações</Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={editFormData.observacoes}
          onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
          placeholder="Observações sobre o pedido..."
        />
      </div>

      {/* Itens do Pedido */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Itens do Pedido ({editItens.length})</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={loadProdutosAquisicao}
            disabled={!selectedAquisicao || isLoadingProdutosAquisicao}
          >
            <Package className="mr-2 h-4 w-4" />
            Ver Produtos da Aquisição
          </Button>
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-semibold">
                  TOTAL DO PEDIDO:
                </TableCell>
                <TableCell className="font-semibold">
                  R$ {editItens.reduce((total, item) => {
                    return total + ((item.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
                  }, 0).toFixed(2)}
                </TableCell>
                <TableCell colSpan={1}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingPedido}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={() => {
          // Implementar impressão se necessário
          toast({
            title: 'Impressão',
            description: 'Funcionalidade de impressão em desenvolvimento'
          })
        }}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button onClick={handleSavePedido} disabled={isSavingPedido}>
          {isSavingPedido ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Salvar Alterações
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
