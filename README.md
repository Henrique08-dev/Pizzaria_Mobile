# SRPizzaria - Aplicativo Mobile

Bem-vindo ao repositório do aplicativo mobile da **SRPizzaria**! Este projeto consiste em um aplicativo React Native/Expo para clientes fazerem pedidos de pizza de forma rápida e intuitiva, integrado com um backend Node.js/Express.

## 🚀 Tecnologias Utilizadas

### Frontend (Mobile)
- **Expo SDK 52** - Framework para desenvolvimento React Native
- **React Native** - Framework para desenvolvimento mobile
- **Expo Router** - Roteamento para navegação entre telas
- **Axios** - Cliente HTTP para consumo da API
- **Socket.IO Client** - Comunicação em tempo real
- **Async Storage** - Armazenamento local
- **React Navigation** - Navegação entre telas
- **Moment.js** - Manipulação de datas
- **Expo Vector Icons** - Ícones para a interface

### Backend
- **Node.js** - Ambiente de execução JavaScript
- **Express.js** - Framework web para API REST
- **Knex.js** - Query builder para SQL
- **PostgreSQL/SQLite** - Banco de dados
- **JWT** - Autenticação por tokens
- **Socket.IO** - Comunicação em tempo real
- **Bcrypt** - Criptografia de senhas
- **Google Generative AI** - Integração com Gemini AI para atendimento inteligente

## ✨ Funcionalidades

### Para o Cliente
- 📱 **Cardápio Digital** - Visualize todas as pizzas e produtos disponíveis
- 🛒 **Carrinho de Compras** - Adicione itens e faça pedidos
- 🔐 **Autenticação** - Login e cadastro de usuários
- 💬 **Chat Inteligente** - Tire dúvidas usando a IA do Gemini sobre:
  - Consulta rápida do cardápio
  - Diretrizes do estabelecimento
  - Histórico de pedidos e gastos
  - Informações sobre produtos
- 📊 **Histórico de Pedidos** - Acompanhe seus últimos pedidos
- 🔔 **Notificações em Tempo Real** - Acompanhe status do pedido via Socket.IO
- 📄 **Comprovantes** - Geração de PDF para pedidos

### Para a Administração
- 👥 **Gestão de Usuários** - Controle de clientes
- 🍕 **Gestão de Produtos** - Cadastro e edição do cardápio
- 📦 **Gestão de Pedidos** - Controle de status e entregas
- 🤖 **Assistente IA** - Suporte automatizado para clientes

## 🔌 Integração com Gemini AI

O sistema utiliza a API do Google Gemini para fornecer um assistente inteligente que pode:

- **Responder perguntas** sobre o cardápio e produtos
- **Fornecer informações** sobre políticas da pizzaria
- **Consultar histórico** de pedidos do cliente
- **Recomendar produtos** baseado no perfil do usuário
- **Tirar dúvidas** sobre horários, formas de pagamento, etc.
