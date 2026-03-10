# Conceitos do Sistema de Controle de Estoque

**Data:** 15/02/2026  
**Versão:** 1.0  
**Status:** Documentação de Conceitos

---

## Visão Geral

Este documento define os principais conceitos do domínio de licitações públicas e controle de estoque, fornecendo uma base de conhecimento para o assistente LLM explicar o funcionamento do sistema.

---

## Estoque

### Saldo Atual
Quantidade disponível de um produto no estoque em um determinado momento. Representa a quantidade física que pode ser utilizada para atender pedidos.

**Exemplo:** Se o saldo atual de canetas é 100 unidades, significa que há 100 canetas disponíveis para uso.

### Saldo Mínimo
Quantidade mínima que deve estar disponível em estoque para garantir o funcionamento normal das atividades. É um limite de segurança definido para cada produto.

**Exemplo:** O saldo mínimo de canetas pode ser 50 unidades. Quando o saldo atual atingir ou ficar abaixo de 50, o produto deve ser reposto.

### Estoque Crítico
Situação em que o saldo atual é menor ou igual ao saldo mínimo. Indica que o produto precisa de reposição urgente.

**Exemplo:** Se o saldo atual de canetas é 30 e o saldo mínimo é 50, o estoque está crítico.

### Produto Zerado
Situação em que o saldo atual é zero. O produto não está disponível para uso.

**Exemplo:** Se o saldo atual de canetas é 0, não há canetas disponíveis.

### Categoria
Classificação organizacional de produtos. Produtos com características semelhantes são agrupados na mesma categoria para facilitar a gestão.

**Exemplos:**
- Papelaria
- Limpeza
- Informática
- Material de Escritório

### Unidade de Medida
Unidade utilizada para quantificar o produto. Cada produto tem uma unidade de medida específica.

**Exemplos:**
- UN (unidade)
- CX (caixa)
- PCT (pacote)
- KG (quilograma)
- L (litro)

### Marca
Fabricante ou fornecedor do produto. Ajuda na identificação e padronização de materiais.

**Exemplo:** Faber-Castell, Pilot, Bic.

---

## Aquisições

### O que é uma Aquisição
Uma aquisição é o processo de compra de bens ou serviços através de licitação pública. No sistema, representa um contrato ou processo de compra que resulta na entrada de produtos no estoque.

### Fluxo de Aquisições
1. **Planejamento:** Identificação da necessidade de produtos
2. **Licitação:** Processo formal de seleção de fornecedores
3. **Contratação:** Assinatura do contrato com o fornecedor vencedor
4. **Entrega:** Recebimento dos produtos
5. **Entrada no Estoque:** Registro dos produtos no sistema

### Tipos de Aquisições
- **Pregão:** Modalidade de licitação para compras comuns, caracterizada pela disputa pelo menor preço
- **Dispensa:** Modalidade aplicável em casos específicos previstos em lei
- **Inexigibilidade:** Quando não há possibilidade de competição

### Elementos de uma Aquisição
- **Número do Processo:** Identificador único do processo de licitação
- **Fornecedor:** Empresa vencedora da licitação
- **Data de Início:** Data de início do contrato
- **Data de Fim:** Data de término do contrato
- **Lista de Produtos:** Produtos contratados com quantidades e preços

---

## Pedidos

### O que é um Pedido
Um pedido é uma solicitação formal de produtos de estoque para uma secretaria ou setor específico. Representa a saída de produtos do estoque para atendimento de necessidades internas.

### Estados de um Pedido
1. **Rascunho:** Pedido criado mas não finalizado
2. **Pendente:** Pedido aguardando aprovação
3. **Aprovado:** Pedido aprovado e pronto para finalização
4. **Finalizado:** Pedido concluído e produtos retirados do estoque
5. **Cancelado:** Pedido cancelado antes da finalização

### Relacionamento com Aquisições
Pedidos e aquisiços estão relacionados através dos produtos:
- Produtos entram no estoque através de aquisições
- Produtos saem do estoque através de pedidos
- O saldo atual é calculado considerando entradas (aquisições) e saídas (pedidos)

### Elementos de um Pedido
- **Secretaria:** Unidade administrativa solicitante
- **Setor:** Departamento específico dentro da secretaria
- **Data do Pedido:** Data de criação da solicitação
- **Itens:** Lista de produtos com quantidades solicitadas
- **Status:** Estado atual do pedido
- **Aprovador:** Usuário que aprovou o pedido

---

## Licitações Públicas

### Conceitos Básicos
Licitação é o procedimento administrativo mediante o qual a administração pública seleciona a proposta mais vantajosa para o contrato de seu interesse.

### Princípios da Licitação
- **Legalidade:** Conformidade com a lei
- **Impessoalidade:** Tratamento igualitário a todos
- **Moralidade:** Conduta ética
- **Publicidade:** Transparência do processo
- **Eficiência:** Melhor aproveitamento dos recursos
- **Julgamento pelo Critério de Menor Preço:** Seleção da proposta mais econômica

### Modalidades de Licitação
1. **Pregão:** Para compras de bens comuns
2. **Concorrência:** Para obras e serviços de grande vulto
3. **Tomada de Preços:** Para obras e serviços de menor valor
4. **Convite:** Para pequenas compras
5. **Dispensa:** Casos específicos sem necessidade de licitação
6. **Inexigibilidade:** Quando não há competição possível

### Fases da Licitação
1. **Preparação:** Elaboração do edital
2. **Publicação:** Divulgação do edital
3. **Apresentação de Propostas:** Recebimento das propostas dos fornecedores
4. **Julgamento:** Análise e classificação das propostas
5. **Homologação:** Aprovação do resultado
6. **Contratação:** Assinatura do contrato

---

## Secretaria e Setor

### Secretaria
Unidade administrativa de nível superior na estrutura organizacional. Exemplos: Secretaria de Educação, Secretaria de Saúde, Secretaria de Finanças.

### Setor
Subdivisão dentro de uma secretaria. Exemplos: Departamento de Ensino Fundamental, Departamento de Nutrição, Departamento de Contabilidade.

### Relacionamento
Cada secretaria pode ter múltiplos setores. Pedidos são feitos para uma secretaria e setor específicos.

---

## Fornecedor

### O que é um Fornecedor
Empresa ou pessoa física que fornece bens ou serviços à administração pública através de contratos de licitação.

### Informações do Fornecedor
- **CNPJ:** Cadastro Nacional da Pessoa Jurídica
- **Nome:** Razão social da empresa
- **Contato:** Telefone e e-mail
- **Endereço:** Localização física

### Relacionamento com Produtos
Cada fornecedor pode fornecer múltiplos produtos. Cada produto pode ter um fornecedor principal.

---

## Movimentações de Estoque

### Tipos de Movimentações
1. **Entrada:** Aumento do saldo (ex: recebimento de aquisição)
2. **Saída:** Diminuição do saldo (ex: atendimento de pedido)
3. **Ajuste:** Correção do saldo (ex: contagem física)
4. **Transferência:** Movimento entre locais

### Registro de Movimentações
Todas as movimentações são registradas com:
- Data e hora
- Tipo de movimentação
- Quantidade
- Produto
- Responsável
- Motivo

---

## Cálculo de Saldos

### Saldo Atual
O saldo atual é calculado dinamicamente considerando:
- Saldo inicial
- Entradas (aquisições)
- Saídas (pedidos)
- Ajustes

### Fórmula
```
Saldo Atual = Saldo Inicial + Entradas - Saídas + Ajustes
```

### Atualização Automática
O sistema atualiza automaticamente os saldos quando:
- Uma aquisição é finalizada (entrada)
- Um pedido é finalizado (saída)
- Um ajuste é registrado

---

## Relatórios

### Tipos de Relatórios
1. **Relatório de Estoque:** Visão geral de todos os produtos
2. **Relatório de Estoque Crítico:** Produtos que precisam de reposição
3. **Relatório de Movimentações:** Histórico de entradas e saídas
4. **Relatório de Pedidos:** Histórico de solicitações
5. **Relatório de Aquisições:** Histórico de compras

### Utilidade dos Relatórios
- Planejamento de compras
- Controle de estoque
- Tomada de decisões
- Auditoria e compliance

---

## Integrações

### Sistema de Gestão de Pessoas
Possível integração para identificar usuários e permissões.

### Sistema Financeiro
Possível integração para processamento de pagamentos de fornecedores.

### Sistema de Patrimônio
Possível integração para controle de bens permanentes.

---

## Segurança

### Controle de Acesso
- Autenticação de usuários
- Autorização baseada em perfis
- Registro de auditoria

### Permissões
- **Administrador:** Acesso total
- **Gestor de Estoque:** Gerenciar produtos e movimentações
- **Solicitante:** Criar pedidos
- **Aprovador:** Aprovar pedidos

---

## Melhores Práticas

### Gestão de Estoque
1. Manter saldos mínimos adequados
2. Monitorar estoque crítico regularmente
3. Realizar contagens físicas periódicas
4. Planejar compras com antecedência
5. Diversificar fornecedores

### Gestão de Pedidos
1. Solicitar apenas o necessário
2. Aprovar pedidos rapidamente
3. Cancelar pedidos não utilizados
4. Manter histórico de pedidos

### Gestão de Aquisições
1. Planejar com antecedência
2. Especificar produtos claramente
3. Avaliar fornecedores
4. Monitorar prazos de entrega

---

**Fim do Documento**
