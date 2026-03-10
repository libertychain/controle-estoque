'use client'

import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFetch } from '@/hooks/use-fetch'
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
  FileText,
  Eye,
  FilePlus,
  Loader2,
  XCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

// Tipos
interface ProdutoAquisicao {
  descricao: string
  unidade: string
  marca?: string | null
  quantidade: string // Alterado para string para aceitar valores quebrados
  preco_unitario: number
  prazo_entrega?: number | null
}

interface Fornecedor {
  id: number
  codigo: string
  nome: string
  cnpj?: string | null
  contato?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  ativo: boolean
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
  numero_contrato: string | null
  data_inicio: string | null
  data_fim: string | null
  possui_aditivos: boolean
  observacoes: string | null
  ativo: boolean
  criado_em: string
  atualizado: string
  _count?: {
    produtos: number
    aditivos: number
  }
}

const modalidades = {
  'PREGAO': 'Pregão',
  'DISPENSA': 'Dispensa',
  'INEXIGIBILIDADE': 'Inexigibilidade',
  'CHAMADA_PUBLICA': 'Chamada Pública'
}

export default function AquisicoesPage() {
  const { toast } = useToast()
  const { fetch: authenticatedFetch } = useFetch()
  const [searchTerm, setSearchTerm] = useState('')
  const [aquisicoes, setAquisicoes] = useState<Aquisicao[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFornecedores, setIsLoadingFornecedores] = useState(true)
  const [isNewAquisicaoOpen, setIsNewAquisicaoOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [activeTab, setActiveTab] = useState('dados-gerais')
  
  // Estado para edição
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAquisicaoId, setEditingAquisicaoId] = useState<number | null>(null)
  
  // Estado para os campos do formulário de nova aquisição
  const [formData, setFormData] = useState({
    numero_proc: '',
    modalidade: '',
    fornecedor: '',
    numero_contrato: '',
    data_inicio: '',
    data_fim: '',
    observacoes: ''
  })
  
  // Estado para os produtos importados
  const [produtosImportados, setProdutosImportados] = useState<ProdutoAquisicao[]>([])
  
  // Referência para o input de arquivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar aquisições e fornecedores ao montar o componente
  useEffect(() => {
    loadAquisicoes()
    loadFornecedores()
  }, [])

  // Função para carregar aquisições
  const loadAquisicoes = async () => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch('/api/aquisicoes')
      const data = await response.json()
      
      if (data.success) {
        setAquisicoes(data.data.aquisicoes)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar aquisições',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar aquisições:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar aquisições',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para carregar fornecedores
  const loadFornecedores = async () => {
    try {
      setIsLoadingFornecedores(true)
      const response = await authenticatedFetch('/api/fornecedores')
      const data = await response.json()
      
      if (data.success) {
        setFornecedores(data.data.fornecedores)
      } else {
        console.error('Erro ao carregar fornecedores:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    } finally {
      setIsLoadingFornecedores(false)
    }
  }

  // Função para carregar aquisição para edição
  const loadAquisicaoForEdit = async (id: number) => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`/api/aquisicoes/${id}`)
      const data = await response.json()
      
      if (data.success) {
        const aquisicao = data.data.aquisicao
        setEditingAquisicaoId(id)
        setIsEditMode(true)
        setIsNewAquisicaoOpen(true)
        setFormData({
          numero_proc: aquisicao.numero_proc,
          modalidade: aquisicao.modalidade,
          fornecedor: aquisicao.fornecedor.id.toString(),
          numero_contrato: aquisicao.numero_contrato || '',
          data_inicio: aquisicao.data_inicio ? aquisicao.data_inicio.split('T')[0] : '',
          data_fim: aquisicao.data_fim ? aquisicao.data_fim.split('T')[0] : '',
          observacoes: aquisicao.observacoes || ''
        })
        setProdutosImportados(aquisicao.produtos || [])
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar aquisição',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar aquisição:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar aquisição',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar aquisição
  const handleUpdateAquisicao = async () => {
    if (!editingAquisicaoId) return

    // Validação básica
    if (!formData.numero_proc || !formData.modalidade || !formData.fornecedor) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha o número do processo, modalidade e fornecedor'
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await authenticatedFetch(`/api/aquisicoes/${editingAquisicaoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          fornecedor_id: formData.fornecedor,
          produtos: produtosImportados
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Aquisição atualizada com sucesso',
          description: 'A aquisição foi atualizada no sistema'
        })
        setIsNewAquisicaoOpen(false)
        setIsEditMode(false)
        setEditingAquisicaoId(null)
        setActiveTab('dados-gerais')
        // Resetar formulário
        setFormData({
          numero_proc: '',
          modalidade: '',
          fornecedor: '',
          numero_contrato: '',
          data_inicio: '',
          data_fim: '',
          observacoes: ''
        })
        setProdutosImportados([])
        // Recarregar lista de aquisições
        loadAquisicoes()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar aquisição',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar aquisição:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar aquisição',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Função para excluir aquisição
  const handleDeleteAquisicao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta aquisição? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/aquisicoes/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Aquisição excluída com sucesso',
          description: 'A aquisição foi removida do sistema'
        })
        // Recarregar lista de aquisições
        loadAquisicoes()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir aquisição',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir aquisição:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir aquisição',
        description: 'Tente novamente mais tarde'
      })
    }
  }

  // Função para importar planilha
  const handleImportarPlanilha = async (file: File) => {
    try {
      setIsImporting(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await authenticatedFetch('/api/aquisicoes/importar-produtos', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setProdutosImportados(data.data.produtos)
        toast({
          title: 'Importação realizada com sucesso',
          description: `${data.data.total} produtos importados`
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao importar planilha',
          description: data.error?.message || 'Verifique o formato do arquivo'
        })
      }
    } catch (error) {
      console.error('Erro ao importar planilha:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao importar planilha',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsImporting(false)
      // Resetar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Função para salvar aquisição (criar ou atualizar)
  const handleSalvarAquisicao = async () => {
    if (isEditMode) {
      await handleUpdateAquisicao()
    } else {
      // Validação básica
      if (!formData.numero_proc || !formData.modalidade || !formData.fornecedor) {
        toast({
          variant: 'destructive',
          title: 'Campos obrigatórios',
          description: 'Preencha o número do processo, modalidade e fornecedor'
        })
        return
      }

      try {
        setIsSaving(true)
        const response = await authenticatedFetch('/api/aquisicoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            fornecedor_id: formData.fornecedor,
            produtos: produtosImportados
          })
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: 'Aquisição criada com sucesso',
            description: 'A aquisição foi cadastrada no sistema'
          })
          setIsNewAquisicaoOpen(false)
          setActiveTab('dados-gerais')
          // Resetar formulário
          setFormData({
            numero_proc: '',
            modalidade: '',
            fornecedor: '',
            numero_contrato: '',
            data_inicio: '',
            data_fim: '',
            observacoes: ''
          })
          setProdutosImportados([])
          // Recarregar lista de aquisições
          loadAquisicoes()
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao criar aquisição',
            description: data.error?.message || 'Tente novamente mais tarde'
          })
        }
      } catch (error) {
        console.error('Erro ao criar aquisição:', error)
        toast({
          variant: 'destructive',
          title: 'Erro ao criar aquisição',
          description: 'Tente novamente mais tarde'
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Função para limpar os dados da aba ativa
  const handleClearActiveTab = () => {
    if (activeTab === 'dados-gerais') {
      setFormData({
        numero_proc: '',
        modalidade: '',
        fornecedor: '',
        numero_contrato: '',
        data_inicio: '',
        data_fim: '',
        observacoes: ''
      })
      toast({
        title: 'Dados Gerais limpos',
        description: 'Os campos da aba Dados Gerais foram resetados'
      })
    } else if (activeTab === 'produtos') {
      setProdutosImportados([])
      toast({
        title: 'Produtos limpos',
        description: 'A lista de produtos foi removida'
      })
    }
  }

  // Função para adicionar novo produto
  const handleAdicionarProduto = () => {
    const novoProduto: ProdutoAquisicao = {
      descricao: '',
      unidade: '',
      marca: '',
      quantidade: '1', // Alterado para string
      preco_unitario: 0,
      prazo_entrega: null
    }
    setProdutosImportados([...produtosImportados, novoProduto])
  }

  // Função para atualizar um produto
  const handleAtualizarProduto = (index: number, campo: keyof ProdutoAquisicao, valor: any) => {
    const novosProdutos = [...produtosImportados]
    novosProdutos[index] = { ...novosProdutos[index], [campo]: valor }
    setProdutosImportados(novosProdutos)
  }

  // Função para remover um produto
  const handleRemoverProduto = (index: number) => {
    const novosProdutos = produtosImportados.filter((_, i) => i !== index)
    setProdutosImportados(novosProdutos)
  }

  const filteredAquisicoes = aquisicoes.filter((aquisicao) =>
    aquisicao.numero_proc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aquisicao.fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aquisicao.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Header
        title="Aquisições"
        subtitle="Gerencie as licitações e contratos"
      />

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número do processo, fornecedor ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isNewAquisicaoOpen} onOpenChange={(open) => {
          setIsNewAquisicaoOpen(open)
          if (open) {
            // Ao abrir o diálogo, resetar para modo de criação
            setIsEditMode(false)
            setEditingAquisicaoId(null)
            setFormData({
              numero_proc: '',
              modalidade: '',
              fornecedor: '',
              numero_contrato: '',
              data_inicio: '',
              data_fim: '',
              observacoes: ''
            })
            setProdutosImportados([])
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Aquisição
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Editar Aquisição' : 'Cadastrar Nova Aquisição'}</DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Edite os dados da licitação. Você poderá adicionar produtos e aditivos após a edição.'
                  : 'Preencha os dados da licitação. Você poderá adicionar produtos e aditivos após o cadastro.'
                }
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                  <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
                  <TabsTrigger value="produtos">Produtos</TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearActiveTab}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Limpar {activeTab === 'dados-gerais' ? 'Dados Gerais' : 'Produtos'}
                </Button>
              </div>
              <TabsContent value="dados-gerais" className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="numero_proc" className="text-right">
                    Nº Processo *
                  </Label>
                  <Input
                    id="numero_proc"
                    className="col-span-3"
                    placeholder="Ex: LIC-2024-0001"
                    value={formData.numero_proc}
                    onChange={(e) => setFormData({ ...formData, numero_proc: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="modalidade" className="text-right">
                    Modalidade *
                  </Label>
                  <select
                    id="modalidade"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.modalidade}
                    onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="PREGAO">Pregão</option>
                    <option value="DISPENSA">Dispensa</option>
                    <option value="INEXIGIBILIDADE">Inexigibilidade</option>
                    <option value="CHAMADA_PUBLICA">Chamada Pública</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fornecedor" className="text-right">
                    Fornecedor *
                  </Label>
                  <select
                    id="fornecedor"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    disabled={isLoadingFornecedores}
                  >
                    <option value="">Selecione...</option>
                    {isLoadingFornecedores ? (
                      <option value="" disabled>Carregando fornecedores...</option>
                    ) : fornecedores.length === 0 ? (
                      <option value="" disabled>Nenhum fornecedor cadastrado</option>
                    ) : (
                      fornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id.toString()}>
                          {fornecedor.codigo} - {fornecedor.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="numero_contrato" className="text-right">
                    Nº Contrato
                  </Label>
                  <Input
                    id="numero_contrato"
                    className="col-span-3"
                    placeholder="Ex: 001/2024"
                    value={formData.numero_contrato}
                    onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="data_inicio" className="text-right">
                    Data Inicial
                  </Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    className="col-span-3"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="data_fim" className="text-right">
                    Data Final
                  </Label>
                  <Input
                    id="data_fim"
                    type="date"
                    className="col-span-3"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="observacoes" className="text-right">
                    Observações
                  </Label>
                  <textarea
                    id="observacoes"
                    className="col-span-3 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Observações sobre a aquisição..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </TabsContent>
              <TabsContent value="produtos" className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Adicione os produtos desta aquisição. Você pode importar de um arquivo Excel/CSV ou adicionar manualmente.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAdicionarProduto}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Produto
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImportarPlanilha(file)
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FilePlus className="mr-2 h-4 w-4" />
                      )}
                      {isImporting ? 'Importando...' : 'Importar Planilha'}
                    </Button>
                  </div>
                </div>
                {produtosImportados.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Preço Unit.</TableHead>
                          <TableHead>Prazo (dias)</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtosImportados.map((produto, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={produto.descricao}
                                onChange={(e) => handleAtualizarProduto(index, 'descricao', e.target.value)}
                                placeholder="Descrição do produto"
                                className="min-w-[300px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={produto.unidade}
                                onChange={(e) => handleAtualizarProduto(index, 'unidade', e.target.value)}
                                placeholder="Ex: UN"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={produto.marca || ''}
                                onChange={(e) => handleAtualizarProduto(index, 'marca', e.target.value)}
                                placeholder="Marca"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={produto.quantidade}
                                onChange={(e) => handleAtualizarProduto(index, 'quantidade', e.target.value)}
                                placeholder="Ex: 5,5796871565655"
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={produto.preco_unitario}
                                onChange={(e) => handleAtualizarProduto(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={produto.prazo_entrega || ''}
                                onChange={(e) => handleAtualizarProduto(index, 'prazo_entrega', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Dias"
                                min="1"
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoverProduto(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum produto adicionado ainda
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewAquisicaoOpen(false)
                  setIsEditMode(false)
                  setEditingAquisicaoId(null)
                  setActiveTab('dados-gerais')
                  // Resetar o formulário ao cancelar
                  setFormData({
                    numero_proc: '',
                    modalidade: '',
                    fornecedor: '',
                    numero_contrato: '',
                    data_inicio: '',
                    data_fim: '',
                    observacoes: ''
                  })
                  setProdutosImportados([])
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSalvarAquisicao} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEditMode ? 'Salvar Alterações' : 'Salvar Aquisição'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aquisições Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Licitações e Contratos
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando...' : `Total de ${filteredAquisicoes.length} aquisições cadastradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Processo</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Nº Contrato</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <p className="text-muted-foreground">Carregando...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAquisicoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma aquisição encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAquisicoes.map((aquisicao) => (
                    <TableRow key={aquisicao.id}>
                      <TableCell className="font-medium">
                        {aquisicao.numero_proc}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {modalidades[aquisicao.modalidade as keyof typeof modalidades]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{aquisicao.fornecedor.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {aquisicao.fornecedor.codigo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{aquisicao.numero_contrato || '-'}</TableCell>
                      <TableCell>
                        {aquisicao.data_inicio && aquisicao.data_fim ? (
                          <div className="text-sm">
                            <p>{new Date(aquisicao.data_inicio).toLocaleDateString('pt-BR')}</p>
                            <p className="text-muted-foreground">
                              até {new Date(aquisicao.data_fim).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{aquisicao._count?.produtos || 0}</Badge>
                          {aquisicao.possui_aditivos && (
                            <Badge variant="secondary">
                              {aquisicao._count?.aditivos || 0} aditivo(s)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => loadAquisicaoForEdit(aquisicao.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => loadAquisicaoForEdit(aquisicao.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FilePlus className="mr-2 h-4 w-4" />
                              Adicionar Produtos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteAquisicao(aquisicao.id)}
                            >
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
