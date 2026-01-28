# Modelo de Banco de Dados

## Diagrama Entidade-Relacionamento (DER)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Usuario   │       │   Perfil    │       │ Permissao  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │       │ id          │
│ nome        │  │    │ nome        │       │ nome        │
│ email       │  │    │ descricao  │       │ descricao  │
│ senha       │  │    └─────────────┘       └─────────────┘
│ perfil_id   │┘└───────────┐                 │
│ ativo       │            │                 │
│ criado_em   │            │                 │
│ atualizado  │            │                 │
└─────────────┘            │                 │
                           │                 │
                    ┌──────┴──────┐   ┌─────┴─────┐
                    │Perfil_Permissao│  │        │
                    └─────────────────┘  │        │
                                          │        │
┌─────────────┐       ┌─────────────┐       │        │
│ Fornecedor  │       │ Secretaria │       │        │
├─────────────┤       ├─────────────┤       │        │
│ id          │       │ id          │       │        │
│ codigo      │       │ nome        │       │        │
│ nome        │       │ sigla       │       │        │
│ cnpj        │       │ ativo       │       │        │
│ contato     │       └─────────────┘       │        │
│ telefone    │              │              │        │
│ email       │              │              │        │
│ endereco    │       ┌──────┴──────┐       │        │
│ ativo       │       │   Setor     │       │        │
│ criado_em   │       ├─────────────┤       │        │
│ atualizado  │       │ id          │       │        │
└─────────────┘       │ nome        │       │        │
                     │ secretaria_id│──────┘        │
                     │ ativo       │               │
                     └─────────────┘               │
                                                   │
┌─────────────┐       ┌─────────────┐              │
│ Categoria   │       │    Marca    │              │
├─────────────┤       ├─────────────┤              │
│ id          │       │ id          │              │
│ nome        │       │ nome        │              │
│ descricao  │       │ ativo       │              │
│ ativo       │       └─────────────┘              │
└─────────────┘                                 │
                                                │
┌─────────────┐       ┌─────────────┐              │
│   Unidade   │       │   Produto   │              │
├─────────────┤       ├─────────────┤              │
│ id          │       │ id          │              │
│ sigla       │       │ codigo      │              │
│ descricao  │       │ descricao  │              │
│ ativo       │       │ categoria_id│──────┐       │
└─────────────┘       │ unidade_id  │      │       │
                     │ marca_id    │      │       │
                     │ fornecedor_id│     │       │
                     │ saldo_atual │      │       │
                     │ saldo_minimo│      │       │
                     │ localizacao │      │       │
                     │ ativo       │      │       │
                     └─────────────┘      │       │
                                          │       │
                           ┌──────────────┘       │
                           │                      │
┌─────────────┐       ┌─────────────┐              │
│ Aquisicao   │       │AditivoContrato│             │
├─────────────┤       ├─────────────┤              │
│ id          │       │ id          │              │
│ numero_proc │       │ aquisicao_id│──────────────┘
│ modalidade  │       │ descricao  │
│ fornecedor_id│     │ data_inicio │
│ numero_contrato │  │ data_fim    │
│ data_inicio │       └─────────────┘
│ data_fim    │
│ observacoes │       ┌─────────────┐
│ possui_aditivos│   │ProdutoAquisicao│
│ ativo       │       ├─────────────┤
└─────────────┘       │ id          │
       │              │ aquisicao_id│──┐
       │              │ produto_id  │  │
       │              │ descricao  │  │
       │              │ unidade     │  │
       │              │ quantidade  │  │
       │              │ marca       │  │
       │              │ preco_unit  │  │
       │              │ prazo_entrega│ │
       │              └─────────────┘  │
       │                               │
       │         ┌─────────────────────┘
       │         │
       │         │
┌─────────────┐  │  ┌─────────────┐
│   Pedido    │  │  │MovimentacaoEstoque│
├─────────────┤  │  ├─────────────┤
│ id          │  │  │ id          │
│ numero      │  │  │ produto_id  │
│ data_pedido │  │  │ tipo        │
│ secretaria_id│ │  │ quantidade  │
│ setor_id    │  │  │ data        │
│ status      │  │  │ observacao  │
│ usuario_id  │  │  │ usuario_id  │
│ pdf_path    │  │  └─────────────┘
│ ativo       │
└─────────────┘
       │
       │
┌─────────────┐
│ItemPedido   │
├─────────────┤
│ id          │
│ pedido_id   │
│ produto_id  │
│ quantidade  │
│ disponivel  │
│ observacao  │
└─────────────┘

┌─────────────┐
│   Auditoria │
├─────────────┤
│ id          │
│ usuario_id  │
│ acao        │
│ tabela      │
│ registro_id │
│ dados_antigos│
│ dados_novos│
│ ip          │
│ user_agent  │
│ criado_em   │
└─────────────┘
```

## Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// ============================================
// USUÁRIOS E AUTENTICAÇÃO
// ============================================

model Perfil {
  id          Int          @id @default(autoincrement())
  nome        String       @unique
  descricao  String?
  permissoes  Permissao[]
  usuarios    Usuario[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt

  @@map("perfis")
}

model Permissao {
  id          Int          @id @default(autoincrement())
  nome        String       @unique
  descricao  String
  perfis      Perfil[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())

  @@map("permissoes")
}

model Usuario {
  id          Int          @id @default(autoincrement())
  nome        String
  email       String       @unique
  senha       String
  perfil_id   Int
  perfil      Perfil       @relation(fields: [perfil_id], references: [id])
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt
  auditorias  Auditoria[]

  @@map("usuarios")
}

// ============================================
// CADASTROS BÁSICOS
// ============================================

model Secretaria {
  id          Int          @id @default(autoincrement())
  nome        String
  sigla       String       @unique
  setores     Setor[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt

  @@map("secretarias")
}

model Setor {
  id             Int           @id @default(autoincrement())
  nome           String
  secretaria_id  Int
  secretaria     Secretaria    @relation(fields: [secretaria_id], references: [id])
  pedidos        Pedido[]
  ativo          Boolean       @default(true)
  criado_em      DateTime      @default(now())
  atualizado     DateTime      @updatedAt

  @@map("setores")
}

model Fornecedor {
  id          Int          @id @default(autoincrement())
  codigo      String       @unique
  nome        String
  cnpj        String?      @unique
  contato     String?
  telefone    String?
  email       String?
  endereco    String?
  produtos    Produto[]
  aquisicoes  Aquisicao[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt

  @@map("fornecedores")
}

model Categoria {
  id          Int          @id @default(autoincrement())
  nome        String       @unique
  descricao  String?
  produtos    Produto[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt

  @@map("categorias")
}

model Unidade {
  id          Int          @id @default(autoincrement())
  sigla       String       @unique
  descricao  String
  produtos    Produto[]
  produtoAquisicoes ProdutoAquisicao[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt

  @@map("unidades")
}

model Marca {
  id          Int          @id @default(autoincrement())
  nome        String       @unique
  produtos    Produto[]
  produtoAquisicoes ProdutoAquisicao[]
  ativo       Boolean      @default(true)
  criado_em   DateTime     @default(now())
  atualizado  DateTime     @updatedAt

  @@map("marcas")
}

// ============================================
// ESTOQUE
// ============================================

model Produto {
  id              Int                  @id @default(autoincrement())
  codigo          String               @unique
  descricao       String
  categoria_id    Int
  categoria       Categoria            @relation(fields: [categoria_id], references: [id])
  unidade_id      Int
  unidade         Unidade              @relation(fields: [unidade_id], references: [id])
  marca_id        Int?
  marca           Marca?               @relation(fields: [marca_id], references: [id])
  fornecedor_id   Int?
  fornecedor      Fornecedor?          @relation(fields: [fornecedor_id], references: [id])
  saldo_atual     Float                @default(0)
  saldo_minimo    Float                @default(0)
  localizacao     String?
  ativo           Boolean              @default(true)
  criado_em       DateTime             @default(now())
  atualizado      DateTime             @updatedAt

  movimentacoes   MovimentacaoEstoque[]
  itensPedido     ItemPedido[]
  produtoAquisicoes ProdutoAquisicao[]

  @@map("produtos")
}

model MovimentacaoEstoque {
  id          Int          @id @default(autoincrement())
  produto_id  Int
  produto     Produto      @relation(fields: [produto_id], references: [id])
  tipo        String       // 'ENTRADA', 'SAIDA', 'TRANSFERENCIA'
  quantidade  Float
  saldo_anterior Float
  saldo_novo  Float
  data        DateTime     @default(now())
  observacao  String?
  usuario_id  Int
  usuario     Usuario      @relation(fields: [usuario_id], references: [id])

  @@map("movimentacoes_estoque")
}

// ============================================
// AQUISIÇÕES (LICITAÇÕES)
// ============================================

model Aquisicao {
  id              Int                  @id @default(autoincrement())
  numero_proc     String
  modalidade      String               // 'PREGAO', 'DISPENSA', 'INEXIGIBILIDADE', 'CHAMADA_PUBLICA'
  fornecedor_id   Int
  fornecedor      Fornecedor           @relation(fields: [fornecedor_id], references: [id])
  numero_contrato String?
  data_inicio     DateTime?
  data_fim        DateTime?
  observacoes     String?
  possui_aditivos Boolean              @default(false)
  ativo           Boolean              @default(true)
  criado_em       DateTime             @default(now())
  atualizado      DateTime             @updatedAt

  aditivos        AditivoContrato[]
  produtos        ProdutoAquisicao[]

  @@map("aquisicoes")
}

model AditivoContrato {
  id              Int          @id @default(autoincrement())
  aquisicao_id    Int
  aquisicao       Aquisicao    @relation(fields: [aquisicao_id], references: [id])
  descricao       String
  data_inicio     DateTime
  data_fim        DateTime
  criado_em       DateTime     @default(now())

  @@map("aditivos_contrato")
}

model ProdutoAquisicao {
  id              Int          @id @default(autoincrement())
  aquisicao_id    Int
  aquisicao       Aquisicao    @relation(fields: [aquisicao_id], references: [id])
  descricao       String
  unidade         String
  unidade_obj     Unidade?     @relation("ProdutoAquisicaoUnidade", fields: [unidade_id], references: [id])
  unidade_id      Int?
  quantidade      Float
  marca           String?
  marca_obj       Marca?       @relation("ProdutoAquisicaoMarca", fields: [marca_id], references: [id])
  marca_id        Int?
  preco_unitario  Float
  prazo_entrega   Int?
  criado_em       DateTime     @default(now())

  @@map("produtos_aquisicao")
}

// ============================================
// PEDIDOS
// ============================================

enum PedidoStatus {
  ABERTO
  APROVADO
  FINALIZADO
  CANCELADO
}

model Pedido {
  id              Int          @id @default(autoincrement())
  numero          String       @unique
  data_pedido     DateTime     @default(now())
  secretaria_id   Int
  secretaria      Secretaria   @relation(fields: [secretaria_id], references: [id])
  setor_id        Int
  setor           Setor        @relation(fields: [setor_id], references: [id])
  status          PedidoStatus @default(ABERTO)
  usuario_id      Int
  usuario         Usuario      @relation(fields: [usuario_id], references: [id])
  pdf_path        String?
  observacoes     String?
  ativo           Boolean      @default(true)
  criado_em       DateTime     @default(now())
  atualizado      DateTime     @updatedAt

  itens           ItemPedido[]

  @@map("pedidos")
}

model ItemPedido {
  id          Int          @id @default(autoincrement())
  pedido_id   Int
  pedido      Pedido       @relation(fields: [pedido_id], references: [id])
  produto_id  Int
  produto     Produto      @relation(fields: [produto_id], references: [id])
  quantidade  Float
  disponivel  Boolean      @default(true)
  observacao  String?

  @@map("itens_pedido")
}

// ============================================
// AUDITORIA
// ============================================

model Auditoria {
  id              Int      @id @default(autoincrement())
  usuario_id      Int?
  usuario         Usuario? @relation(fields: [usuario_id], references: [id])
  acao            String   // 'INSERT', 'UPDATE', 'DELETE'
  tabela          String
  registro_id     Int?
  dados_antigos   String?  // JSON string
  dados_novos     String?  // JSON string
  ip              String?
  user_agent      String?
  criado_em       DateTime @default(now())

  @@map("auditoria")
  @@index([tabela, registro_id])
  @@index([usuario_id])
  @@index([criado_em])
}
```

## Índices e Otimizações

```sql
-- Índices adicionais para performance
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX idx_aquisicoes_numero ON aquisicoes(numero_proc);
CREATE INDEX idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(data);
CREATE INDEX idx_auditoria_usuario_tabela ON auditoria(usuario_id, tabela);
```

## Relacionamentos Importantes

### 1. Produtos
- **Categoria** (N:1) - Cada produto pertence a uma categoria
- **Unidade** (N:1) - Cada produto tem uma unidade de medida
- **Marca** (N:1) opcional - Cada produto pode ter uma marca
- **Fornecedor** (N:1) opcional - Fornecedor principal do produto
- **Movimentações** (1:N) - Histórico completo de movimentações
- **Itens de Pedido** (1:N) - O produto pode estar em vários pedidos

### 2. Aquisições
- **Fornecedor** (N:1) - Cada aquisição tem um fornecedor
- **Aditivos** (1:N) - Uma aquisição pode ter múltiplos aditivos
- **Produtos da Aquisição** (1:N) - Uma aquisição tem vários produtos

### 3. Pedidos
- **Secretaria** (N:1) - Cada pedido vai para uma secretaria
- **Setor** (N:1) - Cada pedido vai para um setor
- **Usuário** (N:1) - Usuário que criou o pedido
- **Itens** (1:N) - Um pedido tem vários itens

### 4. Auditoria
- **Usuário** (N:1) opcional - Usuário que realizou a ação
- Registra todas as operações INSERT, UPDATE, DELETE

## Considerações de Design

### 1. Código Automático
- **Produtos**: Código gerado automaticamente no formato `PRD-{ANO}-{NUMERO}`
- **Fornecedores**: Código gerado automaticamente no formato `FOR-{ANO}-{NUMERO}`
- **Pedidos**: Número gerado automaticamente no formato `PED-{ANO}-{NUMERO}`

### 2. Estados e Enums
- **Modalidades de Licitação**: PREGAO, DISPENSA, INEXIGIBILIDADE, CHAMADA_PUBLICA
- **Status de Pedido**: ABERTO, APROVADO, FINALIZADO, CANCELADO
- **Tipos de Movimentação**: ENTRADA, SAIDA, TRANSFERENCIA

### 3. Rastreabilidade
- Todas as tabelas principais têm campos `criado_em` e `atualizado`
- Auditoria completa com dados antes/depois
- Usuário responsável sempre registrado

### 4. Soft Delete
- Campo `ativo` em todas as entidades principais
- Permite recuperação de dados excluídos
- Consultas filtram por `ativo = true` por padrão

### 5. Performance
- Índices em campos frequentemente consultados
- Campos JSON para dados flexíveis
- Cache em memória para consultas repetitivas

## Migração para Banco de Dados Produção

O schema está desenhado para ser facilmente migrado de SQLite para PostgreSQL:

1. Alterar `datasource` em schema.prisma
2. Ajustar tipos de dados específicos
3. Executar `prisma db push` ou migrations
4. Testar todas as funcionalidades

Benefícios do PostgreSQL em produção:
- Melhor performance com grandes volumes
- Concorrência superior
- Replicação e backup
- Full-text search nativo
- Tipos de dados mais avançados
