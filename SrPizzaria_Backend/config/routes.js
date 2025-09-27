module.exports = (app) => {
  app.post("/signup", app.api.user.save); // Rota para criar um novo usuário7
  app.post("/signin", app.api.auth.signin); // Rota para autenticar um usuário

  app
    .route("/pedidos")
    .all(app.config.passport.authenticate()) // Middleware para autenticação
    .get(app.api.pedidos.getPedidos) // Rota para obter pedidos
    .post(app.api.pedidos.save); // Rota para criar um novo pedido

  app
    .route("/pedidos/:id")
    .all(app.config.passport.authenticate()) // Middleware para autenticação
    .delete(app.api.pedidos.remove); // Rota para deletar um pedido

  app
    .route("/pedidos/:id/toggle")
    .all(app.config.passport.authenticate()) // Middleware para autenticação
    .put(app.api.pedidos.togglePedidos); // Rota para alternar o status de um pedido

  app
    .route("/produtos")
    .get(app.api.produtos.getProdutos) // Rota para obter produtos
    .post(app.api.produtos.save); // Rota para criar um novo produto

  app
    .route("/produtos/:id")
    .get(app.api.produtos.getProdutoById) // Rota para obter um produto por ID
    .delete(app.api.produtos.remove); // Rota para deletar um produto

  app
    .route("/produtos/categoria/:categoria")
    .get(app.api.produtos.getProdutosByCategoria); // Rota para obter produtos por categoria

  app
    .route("/chat")
    .all(app.config.passport.authenticate()) // Middleware para autenticação
    .get(app.api.chat.getMessages) // Rota para obter mensagens
    .post(app.api.chat.saveMessage); // Rota para criar uma nova mensagem

  app
    .route("/chat/:id")
    .all(app.config.passport.authenticate()) // Middleware para autenticação
    .put(app.api.chat.updateMessage)
    .delete(app.api.chat.deleteMessage); // Rota para deletar uma mensagem
  app
    .route("/chatAI")
    .all(app.config.passport.authenticate()) // Middleware de autenticação
    .post(app.api.chatAI.chatAI);
};
