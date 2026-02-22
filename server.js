const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const shell = process.env.SHELL || 'sh';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME || process.cwd(),
  env: process.env
});

ptyProcess.onData((data) => {
  io.emit('terminal:data', data);
});

io.on('connection', (socket) => {
  socket.on('terminal:write', (data) => {
    ptyProcess.write(data);
  });

  socket.on('resize', (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
