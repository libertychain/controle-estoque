# API Documentation - Sistema de Controle de Estoque

## Base URL

```
http://localhost:3000/api
```

## Headers Comuns

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

## Respostas Padrão

### Sucesso
```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso"
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro",
    "details": {}
  }
}
```

---

## AUTENTICAÇÃO

### POST /auth/login

Login de usuário.

**Request:**
```json
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "usuario@email.com",
      "perfil": {
        "id": 1,
        "nome": "Administrador"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/logout

Logout de usuário.

**Response (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### GET /auth/me

Obter usuário autenticado.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "usuario@email.com",
    "perfil": {
      "id": 1,
      "nome": "Administrador",
      "permissoes": [
        {
          "id": 1,
          "nome": "estoque.criar"
        }
      ]
    }
  }
}
```

---

## CADASTROS

### PERFIS

### GET /cadastros/perfis

Listar todos os perfis.

**Query Params:**
- `page` (number) - Página atual (default: 1)
- `limit` (number) - Itens por página (default: 20)
- `ativo` (boolean) - Filtrar por ativo

**Response (200):**
```json
{
  "success": true,
  "data": {
    "perfis": [
      {
        "id": 1,
        "nome": "Administrador",
        "descricao": "Acesso completo ao sistema",
        "ativo": true,
        "permissoes_count": 20
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### POST /cadastros/perfis

Criar novo perfil.

**Request:**
```json
{
  "nome": "Gestor de Estoque",
  "descricao": "Gerencia estoque e pedidos",
  "permissoes": [1, 2, 3, 4, 5]
}
```

### PUT /cadastros/perfis/:id

Atualizar perfil.

### DELETE /cadastros/perfis/:id

Remover perfil (soft delete).

---

### USUÁRIOS

### GET /cadastros/usuarios

Listar todos os usuários.

**Query Params:**
- `page`, `limit`, `ativo`
- `nome` - Busca por nome
- `email` - Busca por email
- `perfil_id` - Filtrar por perfil

**Response (200):**
```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": 1,
        "nome": "João Silva",
        "email": "joao@email.com",
        "perfil": {
          "id": 1,
          "nome": "Administrador"
        },
        "ativo": true,
        "criado_em": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### POST /cadastros/usuarios

Criar novo usuário.

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@email.com",
  "senha": "Senha@123",
  "perfil_id": 2
}
```

### PUT /cadastros/usuarios/:id

Atualizar usuário.

**Request:**
```json
{
  "nome": "Maria Santos Silva",
  "email": "maria.silva@email.com",
  "perfil_id": 3,
  "ativo": true
}
```

### DELETE /cadastros/usuarios/:id

Remover usuário (soft delete).

---

### FORNECEDORES

### GET /cadastros/fornecedores

Listar todos os fornecedores.

**Query Params:**
- `page`, `limit`, `ativo`
- `nome` - Busca por nome
- `cnpj` - Busca por CNPJ

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fornecedores": [
      {
        "id": 1,
        "codigo": "FOR-2024-0001",
        "nome": "Papelaria Central Ltda",
        "cnpj": "12.345.678/0001-90",
        "contato": "João Oliveira",
        "telefone": "(11) 1234-5678",
        "email": "contato@papelaria.com",
        "endereco": "Rua A, 123",
        "ativo": true,
        "criado_em": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### POST /cadastros/fornecedores

Criar novo fornecedor.

**Request:**
```json
{
  "nome": "Material Escolar SA",
  "cnpj": "98.765.432/0001-10",
  "contato": "Ana Costa",
  "telefone": "(11) 9876-5432",
  "email": "vendas@materialescolar.com",
  "endereco": "Av. B, 456"
}
```

### PUT /cadastros/fornecedores/:id

Atualizar fornecedor.

### DELETE /cadastros/fornecedores/:id

Remover fornecedor (soft delete).

---

### SECRETARIAS

### GET /cadastros/secretarias

Listar todas as secretarias.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "secretarias": [
      {
        "id": 1,
        "nome": "Secretaria de Educação",
        "sigla": "SEDUC",
        "ativo": true,
        "setores_count": 5
      }
    ]
  }
}
```

### POST /cadastros/secretarias

Criar nova secretaria.

**Request:**
```json
{
  "nome": "Secretaria de Saúde",
  "sigla": "SAÚDE"
}
```

### PUT /cadastros/secretarias/:id

### DELETE /cadastros/secretarias/:id

---

### SETORES

### GET /cadastros/setores

Listar todos os setores.

**Query Params:**
- `secretaria_id` - Filtrar por secretaria

**Response (200):**
```json
{
  "success": true,
  "data": {
    "setores": [
      {
        "id": 1,
        "nome": "Departamento de Ensino Fundamental",
        "secretaria": {
          "id": 1,
          "nome": "Secretaria de Educação",
          "sigla": "SEDUC"
        },
        "ativo": true
      }
    ]
  }
}
```

### POST /cadastros/setores

Criar novo setor.

**Request:**
```json
{
  "nome": "Departamento de Nutrição",
  "secretaria_id": 2
}
```

### PUT /cadastros/setores/:id

### DELETE /cadastros/setores/:id

---

### CATEGORIAS

### GET /cadastros/categorias

Listar todas as categorias.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categorias": [
      {
        "id": 1,
        "nome": "Papelaria",
        "descricao": "Itens de papelaria em geral",
        "ativo": true,
        "produtos_count": 150
      }
    ]
  }
}
```

### POST /cadastros/categorias

Criar nova categoria.

**Request:**
```json
{
  "nome": "Informática",
  "descricao": "Equipamentos e acessórios de informática"
}
```

### PUT /cadastros/categorias/:id

### DELETE /cadastros/categorias/:id

---

### UNIDADES

### GET /cadastros/unidades

Listar todas as unidades de medida.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unidades": [
      {
        "id": 1,
        "sigla": "UN",
        "descricao": "Unidade",
        "ativo": true
      },
      {
        "id": 2,
        "sigla": "CX",
        "descricao": "Caixa",
        "ativo": true
      },
      {
        "id": 3,
        "sigla": "KG",
        "descricao": "Quilograma",
        "ativo": true
      }
    ]
  }
}
```

### POST /cadastros/unidades

Criar nova unidade.

**Request:**
```json
{
  "sigla": "M",
  "descricao": "Metro"
}
```

### PUT /cadastros/unidades/:id

### DELETE /cadastros/unidades/:id

---

### MARCAS

### GET /cadastros/marcas

Listar todas as marcas.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marcas": [
      {
        "id": 1,
        "nome": "Faber-Castell",
        "ativo": true,
        "produtos_count": 25
      }
    ]
  }
}
```

### POST /cadastros/marcas

Criar nova marca.

**Request:**
```json
{
  "nome": "Tilibra"
}
```

### PUT /cadastros/marcas/:id

### DELETE /cadastros/marcas/:id

---

## ESTOQUE

### PRODUTOS

### GET /estoque/produtos

Listar todos os produtos.

**Query Params:**
- `page`, `limit`, `ativo`
- `codigo` - Busca por código
- `descricao` - Busca por descrição
- `categoria_id` - Filtrar por categoria
- `marca_id` - Filtrar por marca
- `fornecedor_id` - Filtrar por fornecedor
- `saldo_critico` - Retorna produtos com saldo abaixo do mínimo

**Response (200):**
```json
{
  "success": true,
  "data": {
    "produtos": [
      {
        "id": 1,
        "codigo": "PRD-2024-0001",
        "descricao": "Caneta esferográfica azul",
        "categoria": {
          "id": 1,
          "nome": "Papelaria"
        },
        "unidade": {
          "id": 1,
          "sigla": "UN",
          "descricao": "Unidade"
        },
        "marca": {
          "id": 1,
          "nome": "Faber-Castell"
        },
        "fornecedor": {
          "id": 1,
          "codigo": "FOR-2024-0001",
          "nome": "Papelaria Central Ltda"
        },
        "saldo_atual": 500,
        "saldo_minimo": 100,
        "localizacao": "A1-P02",
        "ativo": true,
        "criado_em": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### GET /estoque/produtos/:id

Obter detalhes de um produto.

### POST /estoque/produtos

Criar novo produto.

**Request:**
```json
{
  "descricao": "Lápis preto HB",
  "categoria_id": 1,
  "unidade_id": 1,
  "marca_id": 1,
  "fornecedor_id": 1,
  "saldo_minimo": 50,
  "localizacao": "A1-P03"
}
```

### PUT /estoque/produtos/:id

Atualizar produto.

**Request:**
```json
{
  "descricao": "Lápis preto HB 2B",
  "saldo_minimo": 75,
  "localizacao": "A1-P04"
}
```

### DELETE /estoque/produtos/:id

Remover produto (soft delete).

---

### MOVIMENTAÇÕES

### GET /estoque/movimentacoes

Listar movimentações de estoque.

**Query Params:**
- `page`, `limit`
- `produto_id` - Filtrar por produto
- `tipo` - ENTROADA, SAIDA, TRANSFERENCIA
- `data_inicio` - Data inicial (YYYY-MM-DD)
- `data_fim` - Data final (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "movimentacoes": [
      {
        "id": 1,
        "produto": {
          "codigo": "PRD-2024-0001",
          "descricao": "Caneta esferográfica azul"
        },
        "tipo": "ENTRADA",
        "quantidade": 1000,
        "saldo_anterior": 0,
        "saldo_novo": 1000,
        "data": "2024-01-15T14:30:00Z",
        "observacao": "Entrada inicial",
        "usuario": {
          "nome": "João Silva"
        }
      }
    ],
    "pagination": {}
  }
}
```

### POST /estoque/movimentacoes

Registrar movimentação de estoque.

**Request:**
```json
{
  "produto_id": 1,
  "tipo": "ENTRADA",
  "quantidade": 500,
  "observacao": "Reposição de estoque"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "produto": {
      "codigo": "PRD-2024-0001",
      "descricao": "Caneta esferográfica azul"
    },
    "tipo": "ENTRADA",
    "quantidade": 500,
    "saldo_anterior": 1000,
    "saldo_novo": 1500,
    "data": "2024-01-20T10:15:00Z"
  },
  "message": "Movimentação registrada com sucesso"
}
```

### POST /estoque/entrada

Entrada de produtos (atalho).

**Request:**
```json
{
  "produto_id": 1,
  "quantidade": 200,
  "observacao": "Nota fiscal 1234"
}
```

### POST /estoque/saida

Saída de produtos (atalho).

**Request:**
```json
{
  "produto_id": 1,
  "quantidade": 50,
  "observacao": "Pedido PED-2024-0010"
}
```

---

## AQUISIÇÕES (LICITAÇÕES)

### GET /aquisicoes

Listar todas as aquisições.

**Query Params:**
- `page`, `limit`, `ativo`
- `numero_proc` - Busca por número do processo
- `modalidade` - Filtrar por modalidade
- `fornecedor_id` - Filtrar por fornecedor

**Response (200):**
```json
{
  "success": true,
  "data": {
    "aquisicoes": [
      {
        "id": 1,
        "numero_proc": "LIC-2024-0001",
        "modalidade": "PREGAO",
        "fornecedor": {
          "id": 1,
          "codigo": "FOR-2024-0001",
          "nome": "Papelaria Central Ltda"
        },
        "numero_contrato": "001/2024",
        "data_inicio": "2024-01-01",
        "data_fim": "2024-12-31",
        "possui_aditivos": true,
        "aditivos_count": 1,
        "produtos_count": 15,
        "ativo": true,
        "criado_em": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

### GET /aquisicoes/:id

Obter detalhes de uma aquisição com produtos e aditivos.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero_proc": "LIC-2024-0001",
    "modalidade": "PREGAO",
    "fornecedor": {
      "id": 1,
      "codigo": "FOR-2024-0001",
      "nome": "Papelaria Central Ltda"
    },
    "numero_contrato": "001/2024",
    "data_inicio": "2024-01-01",
    "data_fim": "2024-12-31",
    "observacoes": "Renovação anual",
    "possui_aditivos": true,
    "aditivos": [
      {
        "id": 1,
        "descricao": "Prorrogação de prazo",
        "data_inicio": "2024-12-31",
        "data_fim": "2025-06-30"
      }
    ],
    "produtos": [
      {
        "id": 1,
        "descricao": "Caneta esferográfica azul",
        "unidade": "UN",
        "quantidade": 5000,
        "marca": "Faber-Castell",
        "preco_unitario": 1.50,
        "prazo_entrega": 30
      }
    ]
  }
}
```

### POST /aquisicoes

Criar nova aquisição.

**Request:**
```json
{
  "numero_proc": "LIC-2024-0002",
  "modalidade": "PREGAO",
  "fornecedor_id": 1,
  "numero_contrato": "002/2024",
  "data_inicio": "2024-03-01",
  "data_fim": "2025-02-28",
  "observacoes": "Material escolar",
  "possui_aditivos": false
}
```

### PUT /aquisicoes/:id

Atualizar aquisição.

### DELETE /aquisicoes/:id

Remover aquisição (soft delete).

---

### ADITIVOS

### GET /aquisicoes/:aquisicao_id/aditivos

Listar aditivos de uma aquisição.

### POST /aquisicoes/:aquisicao_id/aditivos

Adicionar aditivo à aquisição.

**Request:**
```json
{
  "descricao": "Prorrogação de vigência",
  "data_inicio": "2025-02-28",
  "data_fim": "2025-08-31"
}
```

### PUT /aquisicoes/:aquisicao_id/aditivos/:id

Atualizar aditivo.

### DELETE /aquisicoes/:aquisicao_id/aditivos/:id

Remover aditivo.

---

### PRODUTOS DA AQUISIÇÃO

### GET /aquisicoes/:aquisicao_id/produtos

Listar produtos da aquisição.

### POST /aquisicoes/:aquisicao_id/produtos

Adicionar produto à aquisição.

**Request:**
```json
{
  "descricao": "Borracha branca",
  "unidade": "UN",
  "quantidade": 1000,
  "marca": "Faber-Castell",
  "preco_unitario": 0.80,
  "prazo_entrega": 15
}
```

### PUT /aquisicoes/:aquisicao_id/produtos/:id

Atualizar produto da aquisição.

### DELETE /aquisicoes/:aquisicao_id/produtos/:id

Remover produto da aquisição.

---

### IMPORTAÇÃO

### POST /aquisicoes/:aquisicao_id/importar

Importar produtos de arquivo CSV/Excel.

**Request:**
```javascript
// FormData
{
  arquivo: File,
  opcoes: {
    primeira_linha_cabecalho: true,
    colunas: {
      descricao: "Descrição",
      unidade: "Unidade",
      quantidade: "Quantidade",
      marca: "Marca",
      preco: "Preço Unitário",
      prazo: "Prazo de Entrega"
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    importados: 25,
    duplicados: 2,
    erros: [
      {
        linha: 5,
        erro: "Quantidade inválida"
      }
    ],
    produtos: [...]
  },
  "message": "Importação concluída"
}
```

---

## PEDIDOS

### GET /pedidos

Listar todos os pedidos.

**Query Params:**
- `page`, `limit`, `ativo`
- `numero` - Busca por número do pedido
- `status` - ABERTO, APROVADO, FINALIZADO, CANCELADO
- `secretaria_id` - Filtrar por secretaria
- `setor_id` - Filtrar por setor
- `data_inicio` - Data inicial
- `data_fim` - Data final

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pedidos": [
      {
        "id": 1,
        "numero": "PED-2024-0001",
        "data_pedido": "2024-01-20T10:00:00Z",
        "secretaria": {
          "id": 1,
          "nome": "Secretaria de Educação",
          "sigla": "SEDUC"
        },
        "setor": {
          "id": 1,
          "nome": "Departamento de Ensino Fundamental"
        },
        "status": "FINALIZADO",
        "usuario": {
          "nome": "João Silva"
        },
        "itens_count": 10,
        "pdf_path": "/arquivos/pedidos/PED-2024-0001_20240120.pdf",
        "ativo": true
      }
    ],
    "pagination": {}
  }
}
```

### GET /pedidos/:id

Obter detalhes de um pedido.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero": "PED-2024-0001",
    "data_pedido": "2024-01-20T10:00:00Z",
    "secretaria": {
      "id": 1,
      "nome": "Secretaria de Educação"
    },
    "setor": {
      "id": 1,
      "nome": "Departamento de Ensino Fundamental"
    },
    "status": "FINALIZADO",
    "observacoes": "Entrega urgente",
    "usuario": {
      "nome": "João Silva"
    },
    "itens": [
      {
        "id": 1,
        "produto": {
          "codigo": "PRD-2024-0001",
          "descricao": "Caneta esferográfica azul"
        },
        "quantidade": 100,
        "disponivel": true,
        "observacao": null
      }
    ],
    "fornecedores": [
      {
        "fornecedor_id": 1,
        "fornecedor_nome": "Papelaria Central Ltda",
        "itens": [...]
      }
    ]
  }
}
```

### POST /pedidos

Criar novo pedido.

**Request:**
```json
{
  "secretaria_id": 1,
  "setor_id": 1,
  "observacoes": "Entrega até 15/02",
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 100
    },
    {
      "produto_id": 2,
      "quantidade": 50
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "numero": "PED-2024-0002",
    "data_pedido": "2024-01-25T14:30:00Z",
    "status": "ABERTO"
  },
  "message": "Pedido criado com sucesso"
}
```

### PUT /pedidos/:id

Atualizar pedido.

### DELETE /pedidos/:id

Remover pedido (soft delete).

---

### STATUS

### PUT /pedidos/:id/status

Alterar status do pedido.

**Request:**
```json
{
  "status": "APROVADO"
}
```

### POST /pedidos/:id/finalizar

Finalizar pedido e gerar PDF.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero": "PED-2024-0001",
    "status": "FINALIZADO",
    "pdf_path": "/arquivos/pedidos/PED-2024-0001_20240120.pdf"
  },
  "message": "Pedido finalizado com sucesso",
  "pdf_gerado": true
}
```

### GET /pedidos/:id/pdf

Baixar PDF do pedido.

**Response (200):**
```javascript
// Binary PDF file
Content-Type: application/pdf
Content-Disposition: attachment; filename="PED-2024-0001_20240120.pdf"
```

---

### CRIAÇÃO AUTOMÁTICA

### POST /pedidos/automatico

Criar pedido automaticamente via LLM.

**Request:**
```json
{
  "secretaria": "Secretaria de Educação",
  "setor": "Departamento de Ensino Fundamental",
  "descricao": "Preciso de 100 canetas azuis, 50 lápis e 200 borrachas para uso escolar"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pedido": {
      "id": 3,
      "numero": "PED-2024-0003",
      "status": "ABERTO"
    },
    "analise": {
      "itens_identificados": 3,
      "fornecedores_encontrados": 2,
      "saldo_verificado": true,
      "itens_disponiveis": 3,
      "itens_indisponiveis": 0
    }
  }
}
```

---

## RELATÓRIOS

### GET /relatorios/estoque

Relatório de estoque atual.

**Query Params:**
- `formato` - pdf, excel (default: json)
- `categoria_id` - Filtrar por categoria
- `saldo_critico` - Apenas saldo crítico

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_produtos": 250,
    "total_valor": 150000.00,
    "saldo_critico": 15,
    "produtos": [...]
  }
}
```

### GET /relatorios/consumo-secretaria

Relatório de consumo por secretaria.

**Query Params:**
- `data_inicio`, `data_fim`
- `secretaria_id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "inicio": "2024-01-01",
      "fim": "2024-01-31"
    },
    "secretarias": [
      {
        "id": 1,
        "nome": "Secretaria de Educação",
        "sigla": "SEDUC",
        "total_pedidos": 45,
        "total_itens": 234,
        "valor_total": 45000.00
      }
    ]
  }
}
```

### GET /relatorios/consumo-setor

Relatório de consumo por setor.

**Query Params:**
- `data_inicio`, `data_fim`
- `setor_id`

### GET /relatorios/fornecedor

Relatório por fornecedor.

**Query Params:**
- `data_inicio`, `data_fim`
- `fornecedor_id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fornecedor": {
      "id": 1,
      "codigo": "FOR-2024-0001",
      "nome": "Papelaria Central Ltda"
    },
    "periodo": {
      "inicio": "2024-01-01",
      "fim": "2024-01-31"
    },
    "estatisticas": {
      "total_pedidos": 12,
      "total_itens": 85,
      "valor_total": 12500.00,
      "media_por_pedido": 1041.67
    }
  }
}
```

### GET /relatorios/pedidos-periodo

Relatório de pedidos por período.

**Query Params:**
- `data_inicio`, `data_fim`
- `status`

### GET /relatorios/atrasos

Relatório de atrasos de entrega.

**Query Params:**
- `data_inicio`, `data_fim`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_atrasos": 8,
    "media_dias_atraso": 3.5,
    "pedidos_atrasados": [...]
  }
}
```

### GET /relatorios/saldo-critico

Relatório de saldo crítico.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_produtos": 15,
    "categorias": [
      {
        "nome": "Papelaria",
        "quantidade": 10
      }
    ],
    "produtos": [...]
  }
}
```

---

## LLM

### POST /llm/normalizar

Normalizar descrição de produto.

**Request:**
```json
{
  "descricao": "caneta azul esferografica faber castell ponta fina"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "descricao_normalizada": "Caneta esferográfica azul ponta fina",
    "marca_sugerida": "Faber-Castell",
    "categoria_sugerida": "Papelaria",
    "unidade_sugerida": "UN",
    "confianca": 0.92
  }
}
```

### POST /llm/interpretar-pedido

Interpretar pedido em linguagem natural.

**Request:**
```json
{
  "texto": "Preciso de 50 canetas azuis e 100 folhas de papel A4 para a secretaria de educação"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "secretaria": "Secretaria de Educação",
    "itens": [
      {
        "produto_sugerido": "Caneta esferográfica azul",
        "produto_id": 1,
        "quantidade": 50,
        "disponivel": true,
        "saldo_atual": 500
      },
      {
        "produto_sugerido": "Papel A4",
        "produto_id": 5,
        "quantidade": 100,
        "disponivel": false,
        "saldo_atual": 50,
        "sugestao": "Estoque insuficiente. Saldo atual: 50"
      }
    ],
    "resumo": "Identificados 2 itens. 1 disponível, 1 com estoque insuficiente."
  }
}
```

### POST /llm/agrupar-fornecedor

Agrupar itens por fornecedor.

**Request:**
```json
{
  "itens": [
    { "produto_id": 1, "quantidade": 50 },
    { "produto_id": 2, "quantidade": 100 },
    { "produto_id": 3, "quantidade": 25 }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fornecedores": [
      {
        "fornecedor_id": 1,
        "fornecedor_nome": "Papelaria Central Ltda",
        "itens": [
          { "produto_id": 1, "quantidade": 50 },
          { "produto_id": 2, "quantidade": 100 }
        ],
        "subtotal": 275.00
      },
      {
        "fornecedor_id": 2,
        "fornecedor_nome": "Material Escolar SA",
        "itens": [
          { "produto_id": 3, "quantidade": 25 }
        ],
        "subtotal": 100.00
      }
    ],
    "total_geral": 375.00
  }
}
```

### POST /llm/relatorio-textual

Gerar relatório em texto.

**Request:**
```json
{
  "tipo": "estoque",
  "periodo": {
    "inicio": "2024-01-01",
    "fim": "2024-01-31"
  },
  "detalhes": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "relatorio": "Durante o mês de janeiro de 2024, o sistema registrou um total de 250 produtos em estoque... [texto completo gerado pela LLM]",
    "resumo_executivo": "O estoque permanece estável com 15 itens em nível crítico que requerem atenção imediata.",
    "pontos_criticos": [
      "15 produtos com saldo abaixo do mínimo",
      "2 produtos zerados"
    ]
  }
}
```

### POST /llm/perguntar

Pergunta sobre estoque (chat).

**Request:**
```json
{
  "pergunta": "Qual o saldo de canetas azuis?"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resposta": "O saldo atual de canetas azuis (código: PRD-2024-0001) é de 500 unidades. O saldo mínimo é 100, portanto o estoque está acima do nível crítico.",
    "contexto": {
      "produto_codigo": "PRD-2024-0001",
      "produto_descricao": "Caneta esferográfica azul",
      "saldo_atual": 500,
      "saldo_minimo": 100
    }
  }
}
```

---

## AUTOMAÇÃO

### GET /automacao

Listar automações.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "automacoes": [
      {
        "id": 1,
        "descricao": "Consulta de preços em fornecedores",
        "status": "CONCLUIDO",
        "data_criacao": "2024-01-20T10:00:00Z",
        "duracao_segundos": 45,
        "video_path": "/arquivos/automacoes/aut-1.mp4"
      }
    ]
  }
}
```

### POST /automacao

Criar nova automação.

**Request:**
```json
{
  "descricao_tarefa": "Consultar o site da Papelaria Central e verificar os preços de canetas",
  "tipo": "WEB_SCRAPING",
  "configuracao": {
    "url": "https://www.papelariacentral.com",
    "seletor_preco": ".price",
    "seletor_produto": ".product"
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "status": "EM_ANDAMENTO",
    "mensagem": "Automação iniciada"
  }
}
```

### GET /automacao/:id

Obter status e resultado de uma automação.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "descricao_tarefa": "Consultar preços de canetas",
    "status": "CONCLUIDO",
    "plano_execucao": {
      "passos": [
        "Abrir site do fornecedor",
        "Navegar para seção de papelaria",
        "Localizar canetas",
        "Extrair preços"
      ]
    },
    "logs": [
      {
        "timestamp": "2024-01-20T10:00:05Z",
        "nivel": "INFO",
        "mensagem": "Iniciando automação"
      }
    ],
    "resultado": {
      "produtos_encontrados": 15,
      "dados_extraidos": [...]
    },
    "video_url": "/arquivos/automacoes/aut-2.mp4"
  }
}
```

### GET /automacao/:id/video

Baixar vídeo da automação.

### DELETE /automacao/:id

Remover automação.

---

## AUDITORIA

### GET /auditoria

Listar registros de auditoria.

**Query Params:**
- `page`, `limit`
- `usuario_id` - Filtrar por usuário
- `tabela` - Filtrar por tabela
- `acao` - INSERT, UPDATE, DELETE
- `data_inicio`, `data_fim`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "registros": [
      {
        "id": 1,
        "usuario": {
          "id": 1,
          "nome": "João Silva"
        },
        "acao": "UPDATE",
        "tabela": "produtos",
        "registro_id": 5,
        "dados_antigos": {
          "descricao": "Caneta azul"
        },
        "dados_novos": {
          "descricao": "Caneta esferográfica azul"
        },
        "ip": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "criado_em": "2024-01-20T15:30:00Z"
      }
    ],
    "pagination": {}
  }
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| UNAUTHORIZED | Usuário não autenticado |
| FORBIDDEN | Permissão insuficiente |
| NOT_FOUND | Recurso não encontrado |
| VALIDATION_ERROR | Erro de validação |
| DUPLICATE | Registro duplicado |
| INSUFFICIENT_STOCK | Saldo insuficiente |
| LLM_ERROR | Erro no processamento LLM |
| AUTOMATION_ERROR | Erro na automação |
| INTERNAL_ERROR | Erro interno do servidor |

---

## Rate Limiting

- **100 requisições por minuto** por IP
- **1000 requisições por hora** por usuário autenticado

Headers de Rate Limit:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705780800
```

---

## Webhooks (Futuro)

### POST /webhooks

Registrar webhook.

**Request:**
```json
{
  "url": "https://api.seusistema.com/webhook",
  "eventos": [
    "pedido.criado",
    "pedido.finalizado",
    "estoque.critico"
  ],
  "ativo": true
}
```
