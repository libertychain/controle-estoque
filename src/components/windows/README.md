# Sistema de Janelas Móveis e Abas

Este diretório contém os componentes base para implementar um sistema de janelas móveis com abas no topo, estilo navegador/IDE.

## Componentes

### WindowManagerProvider

Contexto React para gerenciar múltiplas janelas/abas. Deve ser envolvido na raiz da aplicação onde o sistema de janelas será utilizado.

**Funções disponíveis:**
- `openWindow(title, type, data)`: Abre uma nova janela e retorna o ID
- `closeWindow(id)`: Fecha uma janela pelo ID
- `focusWindow(id)`: Traz uma janela para frente (aumenta z-index)
- `maximizeWindow(id)`: Maximiza uma janela
- `restoreWindow(id)`: Restaura uma janela (desmaximiza/desminimiza)
- `minimizeWindow(id)`: Minimiza uma janela
- `updateWindowPosition(id, position)`: Atualiza a posição de uma janela
- `updateWindowSize(id, size)`: Atualiza o tamanho de uma janela

**Estado disponível:**
- `windows`: Array de janelas abertas
- `activeWindowId`: ID da janela ativa/focada

### DraggableWindow

Componente de janela arrastável com suporte a maximização, minimização e restauração.

**Props:**
- `id`: Identificador único da janela
- `title`: Título exibido no header
- `children`: Conteúdo da janela
- `footer`: (opcional) Conteúdo do footer
- `isOpen`: Controla se a janela está visível
- `onClose`: Callback ao fechar a janela
- `initialPosition`: (opcional) Posição inicial {x, y}
- `isMaximized`: (opcional) Estado de maximização
- `isMinimized`: (opcional) Estado de minimização
- `onMaximize`: (opcional) Callback ao maximizar
- `onRestore`: (opcional) Callback ao restaurar
- `onMinimize`: (opcional) Callback ao minimizar
- `onFocus`: (opcional) Callback ao focar a janela
- `zIndex`: (opcional) Z-index da janela

### TabBar

Barra de abas no topo da interface, estilo navegador/IDE.

**Props:**
- `windows`: Array de janelas para exibir como abas
- `activeWindowId`: ID da aba ativa
- `onTabClick`: Callback ao clicar em uma aba
- `onTabClose`: Callback ao fechar uma aba

### TabContent

Componente wrapper para conteúdo de cada aba. Preserva estado entre trocas usando React.memo.

**Props:**
- `windowId`: ID da janela/aba
- `children`: Conteúdo da aba
- `isActive`: (opcional) Indica se a aba está ativa

### TabContents

Componente para renderizar múltiplos TabContents simultaneamente, gerenciando a visibilidade baseada na aba ativa.

**Props:**
- `windows`: Array de janelas com função renderContent
- `activeWindowId`: ID da janela ativa

## Exemplo de Uso

```tsx
'use client'

import { WindowManagerProvider, useWindowManager, TabBar, TabContents, DraggableWindow } from '@/components/windows'

function WindowContainer() {
  const { windows, activeWindowId } = useWindowManager()

  return (
    <div className="h-screen flex flex-col">
      <TabBar
        windows={windows}
        activeWindowId={activeWindowId}
        onTabClick={(id) => useWindowManager().focusWindow(id)}
        onTabClose={(id) => useWindowManager().closeWindow(id)}
      />
      
      <div className="flex-1 relative">
        {windows.map((window) => (
          <DraggableWindow
            key={window.id}
            id={window.id}
            title={window.title}
            isOpen={!window.isMinimized}
            onClose={() => useWindowManager().closeWindow(window.id)}
            isMaximized={window.isMaximized}
            isMinimized={window.isMinimized}
            onMaximize={() => useWindowManager().maximizeWindow(window.id)}
            onRestore={() => useWindowManager().restoreWindow(window.id)}
            onMinimize={() => useWindowManager().minimizeWindow(window.id)}
            onFocus={() => useWindowManager().focusWindow(window.id)}
            zIndex={window.zIndex}
          >
            {/* Conteúdo da janela */}
            <div>
              {window.data?.content}
            </div>
          </DraggableWindow>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <WindowManagerProvider>
      <WindowContainer />
    </WindowManagerProvider>
  )
}
```

## Integração com Componentes Específicos

Para integrar com componentes específicos (ex: pedidos), você pode usar o tipo da janela para renderizar conteúdo diferente:

```tsx
function renderWindowContent(window: WindowData) {
  switch (window.type) {
    case 'pedido':
      return <PedidoDetails pedidoId={window.data?.pedidoId} />
    case 'criar-pedido':
      return <CriarPedidoForm />
    default:
      return <div>Tipo de janela desconhecido</div>
  }
}
```

## Estilização

Todos os componentes utilizam classes do Tailwind CSS e seguem o sistema de design do projeto (shadcn/ui). As cores e estilos são consistentes com o restante da aplicação.

## Próximos Passos

Para integrar este sistema com a página de pedidos:

1. Envolver a página com `WindowManagerProvider`
2. Substituir os modais fixos por janelas gerenciadas pelo contexto
3. Usar `TabBar` para exibir as janelas abertas como abas
4. Usar `DraggableWindow` para renderizar cada janela
5. Migrar o estado local para o contexto global
