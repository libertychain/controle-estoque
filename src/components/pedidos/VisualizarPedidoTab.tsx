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
import { Loader2, Printer, Edit, Trash2, Eye } from 'lucide-react'

// Tipos
export interface Pedido {
  id: number
  numero: string
  data_pedido: string
  secretaria: { id: number; nome: string; sigla: string }
  setor: { id: number; nome: string }
  _count?: {
    itens: number
  }
  observacoes: string | null
  itens?: any[]
}

export interface VisualizarPedidoTabProps {
  pedidoId: number
  onClose: () => void
  onEdit: (pedidoId: number) => void
}

export function VisualizarPedidoTab({ pedidoId, onClose, onEdit }: VisualizarPedidoTabProps) {
  const { toast } = useToast()
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [isLoadingPedido, setIsLoadingPedido] = useState(false)
  
  useEffect(() => {
    loadPedido(pedidoId)
  }, [pedidoId])
  
  const loadPedido = async (pedidoId: number) => {
    try {
      setIsLoadingPedido(true)
      const response = await fetch(`/api/pedidos/${pedidoId}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedPedido(data.data.pedido)
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
        onClose()
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
  
  if (isLoadingPedido) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-muted-foreground">Carregando pedido...</p>
      </div>
    )
  }
  
  if (!selectedPedido) {
    return null
  }
  
  return (
    <div className="space-y-4">
      {/* Informações do Pedido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Número do Pedido</Label>
          <p className="text-sm font-semibold">{selectedPedido.numero}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Data do Pedido</Label>
          <p className="text-sm">{new Date(selectedPedido.data_pedido).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Secretaria</Label>
          <>
            <p className="text-sm">{selectedPedido.secretaria.nome}</p>
            <p className="text-xs text-muted-foreground">{selectedPedido.secretaria.sigla}</p>
          </>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Setor</Label>
          <p className="text-sm">{selectedPedido.setor.nome}</p>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Observações</Label>
        <p className="text-sm">{selectedPedido.observacoes || 'Nenhuma observação'}</p>
      </div>

      {/* Itens do Pedido */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Itens do Pedido ({selectedPedido.itens?.length || 0})</Label>
        
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedPedido.itens && selectedPedido.itens.length > 0 ? (
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
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-semibold">
                  TOTAL DO PEDIDO:
                </TableCell>
                <TableCell className="font-semibold">
                  R$ {(selectedPedido.itens || []).reduce((total, item) => {
                    return total + ((item.preco_unitario || 0) * parseFloat(item.quantidade.toString().replace(',', '.')))
                  }, 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
        <Button variant="outline" onClick={() => onEdit(selectedPedido.id)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button variant="outline" onClick={handlePrintPedido}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="destructive" onClick={handleDeletePedido}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </div>
    </div>
  )
}
