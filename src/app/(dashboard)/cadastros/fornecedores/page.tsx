'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Plus,
  Edit,
  Trash2,
  Building2,
  Loader2,
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
import { useToast } from '@/hooks/use-toast'

interface Fornecedor {
  id: number
  codigo: string
  nome: string
  cnpj: string | null
  contato: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  ativo: boolean
}

export default function FornecedoresPage() {
  const { toast } = useToast()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    cnpj: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: ''
  })

  const loadFornecedores = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/fornecedores')
      const data = await response.json()
      
      if (data.success) {
        setFornecedores(data.data.fornecedores)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar fornecedores',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar fornecedores',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    // Validação
    if (!formData.codigo || !formData.nome) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Código e nome são obrigatórios'
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Fornecedor criado com sucesso',
          description: 'O fornecedor foi cadastrado'
        })
        setIsDialogOpen(false)
        setFormData({
          codigo: '',
          nome: '',
          cnpj: '',
          contato: '',
          telefone: '',
          email: '',
          endereco: ''
        })
        loadFornecedores()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar fornecedor',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar fornecedor',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedFornecedor) return

    // Validação
    if (!formData.codigo || !formData.nome) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Código e nome são obrigatórios'
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/fornecedores/${selectedFornecedor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Fornecedor atualizado com sucesso',
          description: 'Os dados foram salvos'
        })
        setIsDialogOpen(false)
        setSelectedFornecedor(null)
        setIsEditMode(false)
        setFormData({
          codigo: '',
          nome: '',
          cnpj: '',
          contato: '',
          telefone: '',
          email: '',
          endereco: ''
        })
        loadFornecedores()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar fornecedor',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar fornecedor',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/fornecedores/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Fornecedor excluído com sucesso',
          description: 'O fornecedor foi removido do sistema'
        })
        loadFornecedores()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir fornecedor',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir fornecedor',
        description: 'Tente novamente mais tarde'
      })
    }
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor)
    setFormData({
      codigo: fornecedor.codigo,
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj || '',
      contato: fornecedor.contato || '',
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      endereco: fornecedor.endereco || ''
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedFornecedor(null)
    setFormData({
      codigo: '',
      nome: '',
      cnpj: '',
      contato: '',
      telefone: '',
      email: '',
      endereco: ''
    })
    setIsEditMode(false)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedFornecedor(null)
    setIsEditMode(false)
    setFormData({
      codigo: '',
      nome: '',
      cnpj: '',
      contato: '',
      telefone: '',
      email: '',
      endereco: ''
    })
  }

  useEffect(() => {
    loadFornecedores()
  }, [])

  return (
    <div className="space-y-6">
      <Header
        title="Fornecedores"
        subtitle="Gerencie os fornecedores e seus dados de contato"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Fornecedores
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando...' : `Total de ${fornecedores.length} fornecedor(es) cadastrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
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
                ) : fornecedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum fornecedor cadastrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.codigo}</TableCell>
                      <TableCell>{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.cnpj || '-'}</TableCell>
                      <TableCell>{fornecedor.contato || '-'}</TableCell>
                      <TableCell>{fornecedor.telefone || '-'}</TableCell>
                      <TableCell>{fornecedor.email || '-'}</TableCell>
                      <TableCell>
                        {fornecedor.ativo ? (
                          <span className="text-green-600">Ativo</span>
                        ) : (
                          <span className="text-red-600">Inativo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(fornecedor)}
                          disabled={!fornecedor.ativo}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(fornecedor.id)}
                          disabled={!fornecedor.ativo}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8} className="text-right font-semibold">
                    Total: {fornecedores.length} fornecedor(es)
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Atualize os dados do fornecedor' : 'Preencha os dados para cadastrar um novo fornecedor'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="Código do fornecedor"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome do fornecedor"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contato">Nome do Contato</Label>
              <Input
                id="contato"
                placeholder="Nome da pessoa de contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 0000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@fornecedor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Endereço completo"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={isEditMode ? handleUpdate : handleCreate} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
