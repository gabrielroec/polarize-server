import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

// Criar aplicação Express
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://polarize-brown.vercel.app"],
    methods: ["GET", "POST"],
  })
);

// Criar servidor HTTP
const httpServer = createServer(app);

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://polarize-brown.vercel.app"],
    methods: ["GET", "POST"],
  },
});

// Interface para usuário na fila
interface QueuedUser {
  socketId: string;
  name: string;
  alignment: "left" | "right";
}

// Estrutura da fila
const waitingQueue = {
  left: [] as QueuedUser[],
  right: [] as QueuedUser[],
};

// Função para tentar fazer match
function tryMatch() {
  if (waitingQueue.left.length > 0 && waitingQueue.right.length > 0) {
    // Pegar o primeiro usuário de cada fila
    const leftUser = waitingQueue.left.shift()!;
    const rightUser = waitingQueue.right.shift()!;

    console.log("Match encontrado!", {
      left: leftUser.name,
      right: rightUser.name,
    });

    // Notificar os usuários sobre o match
    io.to(leftUser.socketId).emit("match", {
      opponent: {
        name: rightUser.name,
        alignment: rightUser.alignment,
      },
    });

    io.to(rightUser.socketId).emit("match", {
      opponent: {
        name: leftUser.name,
        alignment: leftUser.alignment,
      },
    });
  }
}

// Eventos do Socket.IO
io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  // Evento de entrada na fila
  socket.on("joinQueue", (data: { name: string; alignment: "left" | "right" }) => {
    const user: QueuedUser = {
      socketId: socket.id,
      name: data.name,
      alignment: data.alignment,
    };

    // Adicionar à fila apropriada
    waitingQueue[data.alignment].push(user);
    console.log(`Usuário ${data.name} entrou na fila ${data.alignment}`);
    console.log("Estado atual da fila:", waitingQueue);

    // Tentar fazer match
    tryMatch();
  });

  // Evento de desconexão
  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
    removeFromQueue(socket.id);
  });
});

// Função para remover usuário da fila
function removeFromQueue(socketId: string) {
  waitingQueue.left = waitingQueue.left.filter((user) => user.socketId !== socketId);
  waitingQueue.right = waitingQueue.right.filter((user) => user.socketId !== socketId);
  console.log("Estado atual da fila após remoção:", waitingQueue);
}

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
