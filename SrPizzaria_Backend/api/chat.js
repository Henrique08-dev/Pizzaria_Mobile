module.exports = (app) => {
  const getMessages = async (req, res) => {
    try {
      const messages = await app
        .db("chat")
        .select("chat.*", "users.nome as user_name")
        .leftJoin("users", "users.id", "chat.user_id")
        .orderBy("chat.created_at", "asc");

      return res.json(messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      return res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  };

  const saveMessage = async (req, res) => {
    console.log("Recebendo requisição para salvar mensagem:", req.body);
    console.log("Usuário autenticado:", req.user);

    if (!req.body.message) {
      console.log("Erro: Mensagem não informada");
      return res.status(400).send("Mensagem não informada");
    }

    try {
      const result = await app
        .db("chat")
        .insert({
          user_id: req.user.id,
          message: req.body.message,
        })
        .returning("id");

      let messageId;
      if (Array.isArray(result)) {
        messageId = result[0];
        if (typeof messageId === "object" && messageId.id) {
          messageId = messageId.id;
        }
      } else {
        messageId = result;
      }

      console.log(`Coloque o ID da mensagem: ${messageId}`);

      const newMessage = await app
        .db("chat")
        .select("chat.*", "users.nome as user_name")
        .leftJoin("users", "users.id", "chat.user_id")
        .where("chat.id", messageId)
        .first();

      if (app.io) {
        app.io.to("chatroom").emit("new_message", newMessage);
      }

      res.status(201).json(newMessage);
    } catch (err) {
      console.error("Erro na Inserção da Mensagem:", err);
      res.status(400).json({ error: err.message });
    }
  };

  const updateMessage = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { message } = req.body;

      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "mensagem não pode ser vazia" });
      }

      const existingMessage = await app
        .db("chat")
        .where({ id, user_id: userId })
        .first();

      if (!existingMessage) {
        return res
          .status(403)
          .json({ error: "Só voce pode editar suas mensagens" });
      }

      await app.db("chat").where({ id }).update({
        message,
        updated_at: new Date(),
        is_edited: true,
      });

      const updatedMessage = await app
        .db("chat")
        .select("chat.*", "users.nome as user_name")
        .leftJoin("users", "users.id", "chat.user_id")
        .where("chat.id", id)
        .first();

      if (app.io) {
        app.io.to("chatroom").emit("atualizar_mensagem", updatedMessage);
      }

      return res.json(updatedMessage);
    } catch (error) {
      console.error("Erro ao atualizar mensagem:", error);
      return res.status(500).json({ error: "Erro ao atualizar mensagem" });
    }
  };

  const deleteMessage = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const messageId = parseInt(id, 10);

      console.log(
        `Tentando excluir mensagem com ID: ${messageId} pelo usuário: ${userId}`
      );

      const existingMessage = await app
        .db("chat")
        .where({ id: messageId, user_id: userId })
        .first();

      if (!existingMessage) {
        console.log(
          `Permissão negada: O usuário ${userId} tentou excluir a mensagem ${messageId} que não lhe pertence`
        );
        return res
          .status(403)
          .json({ error: "Você só pode apagar suas próprias mensagens" });
      }

      console.log(`Deletando a mensagem: `, existingMessage);

      await app.db("chat").where({ id: messageId }).del();

      if (app.io) {
        console.log(
          `transmitindo evento delete_message para sala de bate-papo com dados:`,
          { id: messageId }
        );
        app.io.to("chatroom").emit("delete_message", { id: messageId });
        console.log(
          `O evento de exclusão da mensagem ${messageId} foi transmitido`
        );
      } else {
        console.log(
          "Socket.IO não disponível, evento de exclusão não transmitido"
        );
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
      return res.status(500).json({ error: "Erro ao deletar mensagem:" });
    }
  };

  if (app.io) {
    app.io.on("conectado", (socket) => {
      console.log("Usuario conectado:", socket.id);

      socket.join("chatroom");

      const rooms = socket.rooms;
      console.log(`Socket ${socket.id} entrou na sala:`, Array.from(rooms));

      const authToken = socket.handshake.auth.token;
      console.log(
        `Socket ${socket.id} autenticado com o token: ${
          authToken ? "Sim" : "Não"
        }`
      );

      socket.on("desconectado", () => {
        console.log("Usuario desconectado:", socket.id);
      });
    });
  }

  return {
    getMessages,
    saveMessage,
    updateMessage,
    deleteMessage,
  };
};
