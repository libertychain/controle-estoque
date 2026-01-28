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
  PenTool,
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

interface SecretarioCompras {
  id: number
  nome: string
  cargo: string
  matricula: string | null
  email: string | null
  telefone: string | null
  ativo: boolean
}

export default function SecretariosComprasPage() {
  const { toast } = useToast()
  const [secretarios, setSecretarios] = useState<SecretarioCompras[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedSecretario, setSelectedSecretario] = useState<SecretarioCompras | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    cargo: 'Secretário(a) de Compras',
    matricula: '',
    email: '',
    telefone: ''
  })

  const loadSecretarios = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/secretarios-compras')
      const data = await response.json()
      
      if (data.success) {
        setSecretarios(data.data.secretarios)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar secretários',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar secretários:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar secretários',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    // Validação
    if (!formData.nome) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O nome do secretário é obrigatório'
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/secretarios-compras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Secretário criado com sucesso',
          description: 'O secretário de compras foi cadastrado'
        })
        setIsDialogOpen(false)
        setFormData({
          nome: '',
          cargo: 'Secretário(a) de Compras',
          matricula: '',
          email: '',
          telefone: ''
        })
        loadSecretarios()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar secretário',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao criar secretário:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar secretário',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedSecretario) return

    // Validação
    if (!formData.nome) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O nome do secretário é obrigatório'
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/secretarios-compras/${selectedSecretario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Secretário atualizado com sucesso',
          description: 'Os dados foram salvos'
        })
        setIsDialogOpen(false)
        setSelectedSecretario(null)
        setIsEditMode(false)
        setFormData({
          nome: '',
          cargo: 'Secretário(a) de Compras',
          matricula: '',
          email: '',
          telefone: ''
        })
        loadSecretarios()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar secretário',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar secretário:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar secretário',
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este secretário? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/secretarios-compras/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Secretário excluído com sucesso',
          description: 'O secretário foi removido do sistema'
        })
        loadSecretarios()
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir secretário',
          description: data.error?.message || 'Tente novamente mais tarde'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir secretário:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir secretário',
        description: 'Tente novamente mais tarde'
      })
    }
  }

  const handleEdit = (secretario: SecretarioCompras) => {
    setSelectedSecretario(secretario)
    setFormData({
      nome: secretario.nome,
      cargo: secretario.cargo,
      matricula: secretario.matricula || '',
      email: secretario.email || '',
      telefone: secretario.telefone || ''
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedSecretario(null)
    setFormData({
      nome: '',
      cargo: 'Secretário(a) de Compras',
      matricula: '',
      email: '',
      telefone: ''
    })
    setIsEditMode(false)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedSecretario(null)
    setIsEditMode(false)
    setFormData({
      nome: '',
      cargo: 'Secretário(a) de Compras',
      matricula: '',
      email: '',
      telefone: ''
    })
  }

  useEffect(() => {
    loadSecretarios()
  }, [])

  return (
    <div className="space-y-6">
      <Header
        title="Secretários de Compras"
        subtitle="Cadastre os secretários de compras para assinatura dos pedidos"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Lista de Secretários
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Secretário
            </Button>
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando...' : `Total de ${secretarios.length} secretário(s) cadastrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : secretarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum secretário cadastrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  secretarios.map((secretario) => (
                    <TableRow key={secretario.id}>
                      <TableCell className="font-medium">{secretario.nome}</TableCell>
                      <TableCell>{secretario.cargo}</TableCell>
                      <TableCell>{secretario.matricula || '-'}</TableCell>
                      <TableCell>{secretario.email || '-'}</TableCell>
                      <TableCell>{secretario.telefone || '-'}</TableCell>
                      <TableCell>
                        {secretario.ativo ? (
                          <span className="text-green-600">Ativo</span>
                        ) : (
                          <span className="text-red-600">Inativo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(secretario)}
                          disabled={!secretario.ativo}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(secretario.id)}
                          disabled={!secretario.ativo}
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
                  <TableCell colSpan={7} className="text-right font-semibold">
                    Total: {secretarios.length} secretário(s)
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
              {isEditMode ? 'Editar Secretário' : 'Novo Secretário'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Atualize os dados do secretário de compras' : 'Preencha os dados para cadastrar um novo secretário de compras'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome completo do secretário"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                placeholder="Cargo do secretário"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                placeholder="Matrícula funcional"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email de contato"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="Telefone de contato"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
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
