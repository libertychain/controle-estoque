# Arquitetura do Sistema - Controle de Estoque para Licitações Públicas

## 1. Visão Geral

O sistema é uma aplicação web corporativa para gerenciamento completo de estoque em processos de licitação pública, com integração de inteligência artificial através de LLM local e automação web com Selenoid.

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js 15 (App Router) | 15.x |
| Linguagem | TypeScript | 5.x |
| Estilização | Tailwind CSS 4 | 4.x |
| UI Components | shadcn/ui | Latest |
| Backend API | Next.js API Routes | - |
| ORM | Prisma | Latest |
| Banco de Dados | SQLite (Prisma Client) | Latest |
| LLM Local | Ollama (Qwen2.5-3B) | Latest |
| Automação Web | Selenium + Selenoid | Latest |
| Autenticação | NextAuth.js v4 | Latest |
| State Management | Zustand + TanStack Query | Latest |
| Exportação PDF | jsPDF / react-pdf | Latest |
| Exportação Excel | xlsx | Latest |

## 2. Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTAÇÃO                              │
│                     (Next.js Frontend)                          │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │    Estoque  │ │ Aquisições  │ │   Pedidos   │ │ Relatórios │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │  Cadastros  │ │  Automação  │ │  Dashboard  │ │  LLM Chat  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                             │
│                        (Next.js API Routes)                      │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │    Auth     │ │     CRUD    │ │     LLM      │ │Automação   │  │
│  │   Middleware│ │   Endpoints │ │   Service    │ │   Service  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         SERVIÇOS DE DOMÍNIO                       │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │  Estoque    │ │  Licitacao  │ │    Pedido    │ │  LLM Agent │  │
│  │  Service    │ │  Service    │ │   Service    │ │  Service   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │  Auditoria  │ │  Relatorio  │ │ Automação    │ │ Auth       │  │
│  │  Service    │ │  Service    │ │   Agent      │ │ Service    │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       CAMADA DE DADOS                             │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │   Prisma    │ │  Memória    │ │    LLM       │ │ Selenoid   │  │
│  │   ORM       │ │  Cache      │ │   Local      │ │  Service   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      INFRAESTRUTURA                              │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │   SQLite    │ │  Ollama     │ │  Selenoid    │ │   Files    │  │
│  │   Database  │ │   Server    │ │  Container   │ │   Storage  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Estrutura de Pastas

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── estoque/
│   │   │   ├── page.tsx
│   │   │   ├── produtos/
│   │   │   └── movimentacoes/
│   │   ├── aquisicoes/
│   │   │   ├── page.tsx
│   │   │   ├── nova/
│   │   │   └── [id]/
│   │   ├── pedidos/
│   │   │   ├── page.tsx
│   │   │   ├── novo/
│   │   │   ├── [id]/
│   │   │   └── impressao/
│   │   ├── relatorios/
│   │   │   └── page.tsx
│   │   ├── cadastros/
│   │   │   ├── usuarios/
│   │   │   ├── fornecedores/
│   │   │   ├── secretarias/
│   │   │   ├── setores/
│   │   │   ├── categorias/
│   │   │   ├── unidades/
│   │   │   └── marcas/
│   │   ├── automacao/
│   │   │   └── page.tsx
│   │   ├── llm/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   ├── estoque/
│   │   │   ├── produtos/
│   │   │   └── movimentacoes/
│   │   ├── aquisicoes/
│   │   ├── pedidos/
│   │   ├── cadastros/
│   │   ├── llm/
│   │   │   ├── normalizar/
│   │   │   ├── interpretar/
│   │   │   └── relatorio/
│   │   └── automacao/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── estoque/
│   ├── aquisicoes/
│   ├── pedidos/
│   ├── relatorios/
│   └── automacao/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── llm/
│   │   └── client.ts
│   ├── selenoid/
│   │   └── client.ts
│   └── utils/
├── services/
│   ├── estoque.service.ts
│   ├── aquisicao.service.ts
│   ├── pedido.service.ts
│   ├── relatorio.service.ts
│   ├── llm.service.ts
│   └── automacao.service.ts
├── types/
│   ├── estoque.ts
│   ├── aquisicao.ts
│   ├── pedido.ts
│   └── index.ts
└── hooks/
mini-services/
├── selenoid-service/
│   ├── index.ts
│   ├── package.json
│   └── handlers/
prisma/
├── schema.prisma
└── migrations/
docs/
├── arquitetura.md
├── api.md
├── llm-prompts.md
└── requisitos.md
```

## 4. Princípios Arquiteturais

### 4.1 Separação de Responsabilidades
- **Presentation Layer**: UI components e páginas Next.js
- **API Layer**: Endpoints REST com validação
- **Service Layer**: Lógica de negócio e integrações
- **Data Layer**: Prisma ORM e cache

### 4.2 Single Responsibility
- Cada serviço cuida de um domínio específico
- Componentes focados em uma responsabilidade
- APIs com escopo bem definido

### 4.3 Open/Closed Principle
- Serviços extensíveis sem modificação
- Strategy pattern para diferentes implementações
- Factory pattern para criação de objetos

### 4.4 Dependency Inversion
- Dependência de abstrações (interfaces)
- Injeção de dependências
- Mock fácil para testes

## 5. Segurança

### 5.1 Autenticação
- NextAuth.js v4 com JWT
- Sessões seguras com httpOnly cookies
- Refresh tokens quando necessário

### 5.2 Autorização
- RBAC (Role-Based Access Control)
- Permissões granulares por módulo
- Middleware de verificação em APIs

### 5.3 Validação
- Zod para validação de schemas
- Sanitização de inputs
- Prepared statements (Prisma)

### 5.4 Auditoria
- Log de todas as operações críticas
- Rastreabilidade completa
- Imutabilidade de registros de auditoria

## 6. Performance

### 6.1 Caching
- Cache em memória para consultas frequentes
- Cache de resultados de LLM
- React Query para client-side caching

### 6.2 Lazy Loading
- Code splitting por rotas
- Virtualização de listas longas
- Paginação em todas as listas

### 6.3 Otimizações
- Server Components onde possível
- Streaming de dados
- Indexação apropriada no banco

## 7. Escalabilidade

### 7.1 Horizontal
- Stateless APIs
- Balanceamento de carga possível
- Serviços de LLM e Selenoid separados

### 7.2 Vertical
- Melhorias de hardware isoladas
- Cache distribuído quando necessário
- Separação de banco de dados

## 8. Integrações

### 8.1 LLM Local (Ollama)
- Modelo: Qwen2.5-3B (~2.5GB)
- Sem GPU (CPU-only)
- API HTTP local
- Prompts estruturados para cada caso de uso

### 8.2 Selenoid
- Mini-service independente (porta 3003)
- Selenium WebDriver
- Gravação de vídeo
- Suporte a múltiplos navegadores

### 8.3 Exportações
- PDF: jsPDF com templates
- Excel: xlsx com formatação

## 9. Monitoramento

### 9.1 Logs
- Estruturados (JSON)
- Níveis: error, warn, info, debug
- Rotacionamento automático

### 9.2 Métricas
- Tempo de resposta de APIs
- Uso de LLM
- Erros por módulo
- Performance geral

## 10. Boas Práticas

### 10.1 Código
- TypeScript strict mode
- ESLint com regras customizadas
- Prettier para formatação
- Code reviews obrigatórios

### 10.2 Testes
- Unit tests para serviços
- Integration tests para APIs
- E2E tests para fluxos críticos

### 10.3 Documentação
- JSDoc em funções públicas
- Comentários em lógica complexa
- Documentação de APIs em OpenAPI/Swagger

## 11. Compliance

### 11.1 LGPD
- Dados pessoais protegidos
- Consentimento explícito
- Direito ao esquecimento

### 11.2 Licitações
- Rastreabilidade completa
- Auditoria de movimentações
- Compliance com Lei 8.666/93 e 14.133/21

## 12. Deployment

### 12.1 Desenvolvimento
- Bun para desenvolvimento rápido
- Hot reload automático
- Ambiente isolado

### 12.2 Produção
- Build otimizado
- Container Docker
- CI/CD pipeline

## 13. Diagrama de Sequência - Fluxo Principal de Pedido

```
Usuário           Frontend          API          Service        DB     LLM
  │                  │               │             │            │      │
  │ Cria pedido      │               │             │            │      │
  ├─────────────────>│               │             │            │      │
  │                  │ POST /api/pedidos          │            │      │
  │                  ├─────────────>│             │            │      │
  │                  │               │ validar    │            │      │
  │                  │               ├────────────>│            │      │
  │                  │               │<────────────└──────────>│      │
  │                  │               │             │            │      │
  │                  │               │ processar   │            │      │
  │                  │               ├────────────>│            │      │
  │                  │               │             │ normalizar │      │
  │                  │               │             ├───────────>│      │
  │                  │               │             │<───────────┘      │
  │                  │               │ verificar saldo            │      │
  │                  │               │<──────────────────────────┘      │
  │                  │<─────────────┤             │                   │
  │<─────────────────┤               │             │                   │
  │ Pedido criado    │               │             │                   │
```

## 14. Considerações Acadêmicas (TCC)

### 14.1 Justificativa Técnica
- Uso de Next.js 15: framework moderno, SSR, performance
- SQLite: adequado para demonstração, migrável para PostgreSQL
- LLM local: privacidade, custo zero, compliance

### 14.2 Inovação
- Integração de LLM em processo de licitação
- Automação inteligente com Selenoid
- Arquitetura modular e extensível

### 14.3 Aplicabilidade
- Solução real para problema real
- Escalável para diferentes portes
- Compliance com legislação brasileira

### 14.4 Metodologia
- Desenvolvimento orientado a domínio (DDD)
- Arquitetura em camadas
- Testes automatizados
- Documentação completa

## 15. Referências

1. Lei 8.666/93 - Licitações Públicas
2. Lei 14.133/21 - Novo Marco das Licitações
3. LGPD - Lei 13.709/18
4. Next.js 15 Documentation
5. Prisma ORM Documentation
6. Ollama - Running LLM Locally
7. Selenium WebDriver Documentation
8. Selenoid - Docker-based Selenium Grid
