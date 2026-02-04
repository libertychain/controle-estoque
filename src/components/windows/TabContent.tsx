'use client'

import { ReactNode, memo, useCallback } from 'react'

export interface TabContentProps {
  windowId: string
  children: ReactNode
  isActive?: boolean
}

/**
 * Componente wrapper para conteúdo de cada aba/janela.
 * Preserva o estado entre trocas de aba usando React.memo.
 */
export const TabContent = memo(function TabContent({
  windowId,
  children,
  isActive = false
}: TabContentProps) {
  // Callback para otimizar re-renders
  const renderContent = useCallback(() => {
    return children
  }, [children])

  return (
    <div
      className="h-full w-full"
      data-window-id={windowId}
      role="tabpanel"
      aria-hidden={!isActive}
    >
      {renderContent()}
    </div>
  )
})

/**
 * Componente para renderizar múltiplos TabContents baseado em janelas ativas.
 * Útil para gerenciar o estado de múltiplas janelas/abas simultaneamente.
 */
export interface TabContentsProps {
  windows: Array<{
    id: string
    renderContent: () => ReactNode
  }>
  activeWindowId: string | null
}

export function TabContents({ windows, activeWindowId }: TabContentsProps) {
  return (
    <div className="relative w-full h-full">
      {windows.map((window) => (
        <TabContent
          key={window.id}
          windowId={window.id}
          isActive={window.id === activeWindowId}
        >
          <div
            className={`
              absolute inset-0 transition-opacity duration-200
              ${window.id === activeWindowId ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}
            `}
          >
            {window.renderContent()}
          </div>
        </TabContent>
      ))}
    </div>
  )
}
