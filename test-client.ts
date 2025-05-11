import { io } from "socket.io-client";

// Conectar ao servidor
const socket = io("http://localhost:3001");

// Evento de conexão
socket.on("connect", () => {
  console.log("Conectado ao servidor!");

  // Simular entrada na fila
  socket.emit("joinQueue", {
    name: "Usuário Teste",
    alignment: "left",
  });
});

// Evento de match
socket.on("match", (data) => {
  console.log("Match encontrado!", data);
});

// Evento de desconexão
socket.on("disconnect", () => {
  console.log("Desconectado do servidor");
});
