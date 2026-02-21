const express = require('express');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 🔥 เลือก shell ให้ชัดเจน
let shell;
if (os.platform() === 'win32') {
  shell = 'powershell.exe';
} else {
  shell = '/bin/bash';   // บังคับใช้ bash
}

// 🔥 spawn bash ตั้งแต่ server เริ่ม
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: '/',
  env: process.env
});

let outputBuffer = '';

ptyProcess.onData((data) => {
  outputBuffer += data;
});

// 🔥 execute command
app.post('/api/exec', (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.json({ output: 'No command provided' });
  }

  outputBuffer = '';

  // ใช้ \n สำหรับ Linux
  ptyProcess.write(command + '\n');

  setTimeout(() => {
    res.json({ output: outputBuffer || '(no output)' });
    outputBuffer = '';
  }, 300);
});

// optional: ดู output ล่าสุด
app.get('/api/output', (req, res) => {
  res.json({ output: outputBuffer });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web Bash running on port ${PORT}`);
});
