const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();

const server = http.createServer(app);
const io = socketIo(server);

io.on("connection", (socket) => {
  console.log("New client connected");
});

server.listen(3003, () => {
  console.log("Server is running on port 3003");
});
