require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  transports: ["websocket", "polling"],
});

const db = require("./config/db");
const consign = require("consign");

app.db = db;
app.io = io;

// Carregando os modulos com consign
consign()
  .include("./config/passport.js")
  .then("./config/middlewares.js")
  .then("./api")
  .then("./config/routes.js")
  .into(app);

io.on("conexão", (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  const token = socket.handshake.auth.token;
  if (token) {
    console.log(`Socket ${socket.id} autenticado com o token`);
  }
  socket.join("chatroom");
  console.log(`Socket ${socket.id} entrou na chatroom`);

  socket.on("desconectado", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });

  socket.emit("conectado", { status: "ok", socketId: socket.id });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} com o Socket.IO`);
  console.log(`Socket.IO configurado com: websocket, polling`);
});
