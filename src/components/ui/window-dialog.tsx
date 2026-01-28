'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WindowDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  initialPosition?: { x: number; y: number }
}

export function WindowDialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  initialPosition
}: WindowDialogProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState(initialPosition || { x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 900, height: 600 })
  const windowRef = useRef<HTMLDivElement>(null)

  // Função para maximizar a janela
  const handleMaximize = () => {
    if (isMaximized) {
      // Restaurar tamanho original
      setSize({ width: 900, height: 600 })
      setIsMaximized(false)
    } else {
      // Maximizar para tela cheia
      setSize({ width: window.innerWidth, height: window.innerHeight })
      setPosition({ x: 0, y: 0 })
      setIsMaximized(true)
    }
  }

  // Função para minimizar a janela
  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // Funções para drag da janela
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return // Não permitir drag quando maximizado
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMaximized) return

    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    }

    // Limitar a janela dentro da tela
    const maxX = window.innerWidth - size.width
    const maxY = window.innerHeight - (isMinimized ? 40 : size.height)

    setPosition({
      x: Math.max(0, Math.min(newPosition.x, maxX)),
      y: Math.max(0, Math.min(newPosition.y, maxY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Adicionar event listeners para drag
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove as any)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isOpen, isDragging, isMaximized, dragOffset, position, size, isMinimized])

  // Não renderizar se não estiver aberto
  if (!isOpen) return null

  return (
    <div
      ref={windowRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMaximized ? '100vw' : `${size.width}px`,
        height: isMinimized ? '40px' : (isMaximized ? '100vh' : `${size.height}px`),
        cursor: isDragging ? 'move' : 'default',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header da janela */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMinimize}
            className="h-8 w-8"
            title={isMinimized ? 'Restaurar' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMaximize}
            className="h-8 w-8"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo da janela */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {children}
      </div>

      {/* Footer da janela */}
      {footer && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-border bg-muted/50">
          {footer}
        </div>
      )}
    </div>
  )
}
