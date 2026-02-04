'use client'

import { CriarPedidoTab } from './CriarPedidoTab'
import { VisualizarPedidoTab } from './VisualizarPedidoTab'
import { EditarPedidoTab } from './EditarPedidoTab'

export type PedidoWindowType = 'criar' | 'visualizar' | 'editar'

export interface PedidoWindowProps {
  id: string
  type: PedidoWindowType
  data?: any
  onClose: () => void
  onPedidoCriado?: (pedidos: any[]) => void
  onEdit?: (pedidoId: number) => void
  onSave?: () => void
}

export function PedidoWindow({
  id,
  type,
  data,
  onClose,
  onPedidoCriado,
  onEdit,
  onSave
}: PedidoWindowProps) {
  switch (type) {
    case 'criar':
      return (
        <CriarPedidoTab
          onClose={onClose}
          onPedidoCriado={(pedidos) => {
            if (onPedidoCriado) {
              onPedidoCriado(pedidos)
            }
          }}
        />
      )
    case 'visualizar':
      return (
        <VisualizarPedidoTab
          pedidoId={data?.pedidoId}
          onClose={onClose}
          onEdit={(pedidoId) => {
            if (onEdit) {
              onEdit(pedidoId)
            }
          }}
        />
      )
    case 'editar':
      return (
        <EditarPedidoTab
          pedidoId={data?.pedidoId}
          onClose={onClose}
          onSave={() => {
            if (onSave) {
              onSave()
            }
          }}
        />
      )
    default:
      return null
  }
}
