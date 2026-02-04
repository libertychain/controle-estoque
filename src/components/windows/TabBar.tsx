'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface TabBarProps {
  windows: Array<{
    id: string
    title: string
    type: string
    isMinimized?: boolean
  }>
  activeWindowId: string | null
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
}

export function TabBar({
  windows,
  activeWindowId,
  onTabClick,
  onTabClose
}: TabBarProps) {
  if (windows.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 bg-muted/30 border-b border-border">
        <p className="text-sm text-muted-foreground">Nenhuma janela aberta</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 h-12 bg-muted/30 border-b border-border px-2 overflow-x-auto">
      {windows.map((window) => {
        const isActive = window.id === activeWindowId
        const isMinimized = window.isMinimized

        return (
          <div
            key={window.id}
            className={`
              group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer select-none
              transition-all duration-200 min-w-[150px] max-w-[250px]
              ${isActive 
                ? 'bg-background border border-border border-b-0 shadow-sm' 
                : 'hover:bg-background/50 border border-transparent'
              }
              ${isMinimized ? 'opacity-60' : ''}
            `}
            onClick={() => onTabClick(window.id)}
          >
            {/* Ícone baseado no tipo de janela */}
            <span className="text-sm font-medium truncate flex-1">
              {window.title}
            </span>

            {/* Indicador de janela minimizada */}
            {isMinimized && (
              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                <span className="w-1.5 h-1.5 bg-current rounded-full" />
              </Badge>
            )}

            {/* Botão de fechar */}
            <Button
              variant="ghost"
              size="icon"
              className={`
                h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-destructive hover:text-destructive-foreground
              `}
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(window.id)
              }}
              title="Fechar"
            >
              <X className="h-3 w-3" />
            </Button>

            {/* Indicador de aba ativa */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </div>
        )
      })}
    </div>
  )
}
