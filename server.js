const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

console.log("ENV PORT:", process.env.PORT);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const shell = '/bin/sh';

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || process.cwd(),
    env: process.env
  });

  console.log('PTY spawned for:', socket.id);

  ptyProcess.onData((data) => {
    socket.emit('terminal:data', data);
  });

  socket.on('terminal:write', (data) => {
    ptyProcess.write(data);
  });

  socket.on('resize', (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    ptyProcess.kill();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
