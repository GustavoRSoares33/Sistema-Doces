# Sistema de Doces

Aplicação web desenvolvida em **React** para gerenciamento e venda de doces, com autenticação de usuários, carrinho de compras, histórico de pedidos e área administrativa.

O projeto utiliza **Firebase Authentication** e **Cloud Firestore** para autenticação e persistência dos dados.

## 🍬 Sobre o projeto

O sistema foi criado para centralizar a venda de doces em uma interface simples e responsiva.

Usuários autenticados podem visualizar os produtos, adicionar itens ao carrinho, consultar compras anteriores e acompanhar valores pendentes.

Usuários administradores possuem acesso a ferramentas adicionais para gerenciamento de produtos e fechamento de vendas.

## ✨ Funcionalidades

### Usuários

- Cadastro e autenticação com Firebase
- Verificação de e-mail
- Login e logout
- Perfil do usuário
- Histórico de compras
- Consulta de valores pendentes

### Loja

- Listagem de doces cadastrados
- Carrinho de compras
- Controle de quantidade dos itens
- Cálculo automático do valor total
- Fluxo de finalização da compra

### Pagamentos

- Fluxo de pagamento via Pix
- Fluxo de pagamento via VR
- Registro de vendas no Firestore
- Controle de pagamentos pendentes

### Área administrativa

- Cadastro de produtos
- Edição de produtos
- Exclusão de produtos
- Painel de fechamento
- Fechamento de vendas via Pix
- Fechamento de vendas via VR
- Geração de relatórios em PDF

## 🛠️ Tecnologias utilizadas

- React
- JavaScript
- Firebase Authentication
- Cloud Firestore
- Tailwind CSS
- DaisyUI
- jsPDF
- jsPDF AutoTable
- Create React App

## 📁 Estrutura principal

```text
src/
├── components/
│   ├── Admin/
│   ├── Cabeçalho/
│   ├── Carrinho/
│   ├── TelaLoja/
│   ├── DoceCard.jsx
│   ├── HistoricoCompras.jsx
│   └── Login.jsx
├── firebase.js
├── config.js
├── App.js
├── index.css
└── index.js
```

## 🔐 Perfis de acesso

O sistema possui dois tipos principais de uso:

- **Usuário:** acessa a loja, carrinho, histórico e informações de compras.
- **Administrador:** além das funções de usuário, possui acesso ao gerenciamento de produtos e aos painéis de fechamento.

## 🚀 Como executar

### Pré-requisitos

- Node.js
- npm
- Projeto configurado no Firebase

Clone o repositório:

```bash
git clone https://github.com/GustavoRSoares33/Sistema-Doces.git
cd Sistema-Doces
```

Instale as dependências:

```bash
npm install
```

Inicie a aplicação:

```bash
npm start
```

A aplicação será aberta em:

```text
http://localhost:3000
```

## 🔥 Configuração do Firebase

Para executar o sistema em outro ambiente, configure um projeto no Firebase com:

- Authentication
- Firestore Database

Depois, configure as credenciais necessárias no arquivo de configuração utilizado pelo projeto.

> Nunca publique senhas, tokens ou credenciais privadas do Firebase em repositórios públicos.

## 📄 Relatórios

A aplicação utiliza **jsPDF** e **jsPDF AutoTable** para geração de documentos PDF a partir dos dados administrativos.

## 📚 Conceitos praticados

- Componentização com React
- React Hooks
- Autenticação
- Persistência em banco NoSQL
- Controle de estado
- CRUD
- Carrinho de compras
- Controle de acesso por perfil
- Integração com Firebase
- Geração de relatórios em PDF
- Interfaces responsivas

---

Projeto desenvolvido para prática de desenvolvimento web com React e Firebase.
