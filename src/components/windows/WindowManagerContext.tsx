'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Tipos para o sistema de janelas
export interface WindowData {
  id: string
  title: string
  type: string
  data?: any
  position: { x: number; y: number }
  zIndex: number
  isMaximized: boolean
  isMinimized: boolean
  size: { width: number; height: number }
}

export interface WindowManagerContextType {
  windows: WindowData[]
  activeWindowId: string | null
  openWindow: (title: string, type: string, data?: any) => string
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void
  updateWindowSize: (id: string, size: { width: number; height: number }) => void
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined)

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowData[]>([])
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [maxZIndex, setMaxZIndex] = useState(100)

  const openWindow = useCallback((title: string, type: string, data?: any): string => {
    const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newWindow: WindowData = {
      id,
      title,
      type,
      data,
      position: {
        x: 100 + (windows.length * 30) % 200,
        y: 100 + (windows.length * 30) % 200
      },
      zIndex: maxZIndex + 1,
      isMaximized: false,
      isMinimized: false,
      size: { width: 900, height: 600 }
    }
    
    setWindows(prev => [...prev, newWindow])
    setActiveWindowId(id)
    setMaxZIndex(prev => prev + 1)
    
    return id
  }, [windows.length, maxZIndex])

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id))
    if (activeWindowId === id) {
      const remainingWindows = windows.filter(w => w.id !== id)
      setActiveWindowId(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null)
    }
  }, [activeWindowId, windows])

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id)
    setMaxZIndex(prev => prev + 1)
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: maxZIndex + 1, isMinimized: false, isMaximized: false } : w
    ))
  }, [maxZIndex])

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: true, isMinimized: false } : w
    ))
  }, [])

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: false, isMinimized: false } : w
    ))
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: true, isMaximized: false } : w
    ))
  }, [])

  const updateWindowPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position } : w
    ))
  }, [])

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, size } : w
    ))
  }, [])

  const value: WindowManagerContextType = {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    maximizeWindow,
    restoreWindow,
    minimizeWindow,
    updateWindowPosition,
    updateWindowSize
  }

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export function useWindowManager() {
  const context = useContext(WindowManagerContext)
  if (context === undefined) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider')
  }
  return context
}
