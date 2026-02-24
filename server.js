const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);

console.log("ENV PORT:", process.env.PORT);
console.log("Starting server...");

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.get('/health', (req, res) => {
  console.log('Health check hit');
  res.status(200).send('OK');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  console.log('Root path hit');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/download', (req, res) => {
  const filePath = path.join(__dirname, 'test.txt');
  res.download(filePath);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log('Socket.io server initialized');

io.engine.on('connection_error', (err) => {
  console.log('Connection error:', err.code, err.message);
});

const shell = '/bin/bash';

console.log('Shell path:', shell);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, socket.conn.transport.name);
  console.log('Socket handshake:', socket.handshake);

  let ptyProcess;
  try {
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: process.env.HOME || process.cwd(),
      env: process.env
    });
    console.log('PTY spawned for:', socket.id);
  } catch (err) {
    console.error('PTY spawn error:', err);
    return;
  }

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
