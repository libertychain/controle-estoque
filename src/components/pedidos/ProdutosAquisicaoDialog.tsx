'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

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

export interface ProdutosAquisicaoDialogProps {
  open: boolean
  onClose: () => void
  produtos: Produto[]
  isLoading?: boolean
  onSelectProducts: (produtos: Produto[]) => void
}

export function ProdutosAquisicaoDialog({
  open,
  onClose,
  produtos,
  isLoading = false,
  onSelectProducts,
}: ProdutosAquisicaoDialogProps) {
  const [selectedProdutos, setSelectedProdutos] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProdutos(new Set(produtos.map(p => String(p.id))))
    } else {
      setSelectedProdutos(new Set())
    }
  }

  const handleSelectProduct = (produtoId: string, checked: boolean) => {
    setSelectedProdutos((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(produtoId)
      } else {
        newSet.delete(produtoId)
      }
      return newSet
    })
  }

  const handleAddSelected = () => {
    const produtosSelecionados = produtos.filter((produto) =>
      selectedProdutos.has(String(produto.id))
    )
    onSelectProducts(produtosSelecionados)
    setSelectedProdutos(new Set())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Produtos da Aquisição</DialogTitle>
          <DialogDescription>
            Selecione os produtos que deseja adicionar ao pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : produtos.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={produtos.length > 0 && produtos.every((p) => selectedProdutos.has(String(p.id)))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedProdutos.has(String(produto.id))}
                          onChange={(e) => handleSelectProduct(String(produto.id), e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {produto.codigo}
                      </TableCell>
                      <TableCell className="min-w-[250px] max-w-[400px]">
                        <p className="font-medium break-words">{produto.descricao}</p>
                      </TableCell>
                      <TableCell>
                        {produto.marca ? (
                          <span className="text-sm">{produto.marca.nome}</span>
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
                        <Badge variant={produto.saldo_atual > 0 ? 'outline' : 'destructive'}>
                          {produto.saldo_atual} {produto.unidade?.sigla}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum produto encontrado para esta aquisição.</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => setSelectedProdutos(new Set())}
            disabled={selectedProdutos.size === 0}
          >
            Limpar Seleção
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedProdutos.size === 0}
            >
              Adicionar {selectedProdutos.size} Selecionado(s)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
