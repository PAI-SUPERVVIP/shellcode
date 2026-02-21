const express = require('express');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME || process.cwd(),
  env: process.env
});

let outputBuffer = '';

ptyProcess.onData((data) => {
  outputBuffer += data;
});

app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.json({ output: 'No command provided' });
  }

  outputBuffer = '';
  ptyProcess.write(command + '\r');

  setTimeout(() => {
    res.json({ output: outputBuffer || '(no output)' });
  }, 500);
});

app.get('/api/output', (req, res) => {
  res.json({ output: outputBuffer });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
