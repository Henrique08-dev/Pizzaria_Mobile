const { askAI } = require("../services/aiService");
const getUserData = require("../services/database");
const { loadContext } = require("../context/pdfParser");
const jwt = require("jwt-simple");
const { authSecret } = require("../.env");

module.exports = (app) => {
  let contextData = "";
  let isContextLoaded = false;

  // Carrega o contexto
  const loadAppContext = async () => {
    try {
      contextData = await loadContext();
      isContextLoaded = true;
      console.log("Contexto preparado com sucesso!");
    } catch (err) {
      console.error("Usando contexto fallback:", err.message);
      contextData = `
        Nome do Estabelecimento: Sr.Pizzaria
        [CARDÁPIO]
        - Pizza Calabresa: R$30,00
        - Pizza Margherita: R$32,00
        - Coca-Cola: R$5,00
        
        [ENTREGAS]
        - Taxa: R$5 (grátis acima de R$80)
        - Tempo: 30-45 minutos
        
        (Modo fallback ativado)
      `;
      isContextLoaded = true;
    }
  };

  // Configuração do Socket.IO
  const initializeSocket = () => {
    app.io.on("conexão", (socket) => {
      console.log("Um usuário se conectou:", socket.id);

      // Autenticação via Socket
      socket.on("autenticação", (token) => {
        try {
          const decoded = jwt.decode(token, authSecret);
          socket.userId = decoded.id;
          socket.emit("autenticado");
          console.log(
            `Socket ${socket.id} autenticado para usuário ${socket.userId}`
          );
        } catch (err) {
          console.error("Falha na autenticação:", err);
          socket.emit("não autorizado", { error: "Token inválido" });
        }
      });

      // Mensagens do Chat
      socket.on("chat_message", async (message) => {
        if (!socket.userId) {
          socket.emit("chat_response", "Por favor, autentique-se primeiro.");
          return;
        }

        try {
          if (!isContextLoaded) {
            await loadAppContext();
          }

          const userData = await getUserData(socket.userId, app.db);
          const pedidos = userData.pedidos || [];
          const totalGasto = userData.totalGasto || 0;

          const prompt = `
            INSTRUÇÕES:
            1. Você é o atendente da Sr.Pizzaria
            2. Use APENAS as informações abaixo
            3. Seja breve e objetivo
            
            INFORMAÇÕES DA PIZZARIA:
            ${contextData}
            
            DADOS DO CLIENTE:
            - Nome: ${userData.nome || "Cliente"}
            - Pedidos recentes: ${
              pedidos.length > 0 ? pedidos.length + " pedidos" : "Nenhum"
            }
            - Total gasto: R$${totalGasto.toFixed(2)}
            
            PERGUNTA:
            "${message}"
            
            RESPOSTA:
          `;

          const answer = await askAI(prompt);
          socket.emit("chat_response", answer);
        } catch (error) {
          console.error("Erro ao processar mensagem:", error);
          socket.emit(
            "chat_response",
            "Desculpe, houve um erro. Tente novamente."
          );
        }
      });

      socket.on("desconectado", () => {
        console.log("Usuário desconectado:", socket.id);
      });
    });
  };

  // Inicialização do serviço
  const initialize = async () => {
    await loadAppContext();
    initializeSocket();
  };

  // Rota principal do Chat AI
  const chatAI = async (req, res) => {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res
        .status(400)
        .json({ error: "Mensagem e ID do usuário são obrigatórios." });
    }

    try {
      if (!isContextLoaded) {
        await loadAppContext();
      }

      const userData = await getUserData(userId, app.db);
      const pedidos = userData.pedidos || [];
      const totalGasto = userData.totalGasto || 0;

      const prompt = `
        INSTRUÇÕES:
        1. Você é o atendente da Sr.Pizzaria
        2. Responda com base nas informações abaixo
        3. Formate respostas claras
        
        CONTEXTO:
        ${contextData}
        
        CLIENTE:
        - Nome: ${userData.nome || "Cliente"}
        - Últimos pedidos: ${
          pedidos
            .slice(0, 3)
            .map((p) => p.item)
            .join(", ") || "Nenhum"
        }
        - Gasto total: R$${totalGasto.toFixed(2)}
        
        PERGUNTA:
        "${message}"
        
        RESPOSTA:
      `;

      const answer = await askAI(prompt);
      res.json({ response: answer });
    } catch (error) {
      console.error("Erro na rota /chatAI:", error);
      res.status(500).json({ error: "Erro ao processar sua solicitação." });
    }
  };

  // Rota para criar pedidos
  app.post("/api/pedidos", async (req, res) => {
    try {
      const { user_id, item, valor, quantidade } = req.body;

      if (!user_id || !item || valor === undefined || !quantidade) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      const [novoPedido] = await app
        .db("pedidos")
        .insert({
          user_id,
          item,
          valor: parseFloat(valor),
          quantidade: parseInt(quantidade),
        })
        .returning("*");

      res.json(novoPedido);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      res.status(500).json({ error: "Erro ao criar pedido" });
    }
  });

  // Rota para listar pedidos
  app.get("/api/pedidos", async (req, res) => {
    try {
      const { user_id } = req.query;
      let query = app.db("pedidos");

      if (user_id) {
        query = query.where({ user_id });
      }

      const pedidos = await query.select("*");
      res.json(pedidos);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar pedidos" });
    }
  });

  // Rota para buscar pedido específico
  app.get("/api/pedidos/:id", async (req, res) => {
    try {
      const pedido = await app
        .db("pedidos")
        .where({ id: req.params.id })
        .first();

      pedido
        ? res.json(pedido)
        : res.status(404).json({ error: "Pedido não encontrado" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar pedido" });
    }
  });

  // Rota para deletar pedido específico
  app.delete("/api/pedidos/:id", async (req, res) => {
    try {
      const pedido = await app
        .db("pedidos")
        .where({ id: req.params.id })
        .first();

      if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      await app.db("pedidos").where({ id: req.params.id }).del();
      res.status(200).json({ message: "Pedido deletado com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar pedido" });
    }
  });

  // Inicializa o serviço
  initialize().catch((err) => {
    console.error("Erro na inicialização do ChatAI:", err);
  });

  return { chatAI };
};
