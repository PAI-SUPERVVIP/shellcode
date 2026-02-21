const express = require('express');
const { spawn } = require('child_process');
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

const pty = spawn('/bin/sh', ['-i'], {
  env: process.env,
  cwd: '/'
});

let outputBuffer = '';

pty.stdout.on('data', (data) => {
  outputBuffer += data.toString();
});

pty.stderr.on('data', (data) => {
  outputBuffer += data.toString();
});

pty.on('error', (err) => {
  outputBuffer += '\nError: ' + err.message;
});

app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.json({ output: 'No command provided' });
  }

  outputBuffer = '';
  pty.write(command + '\n');

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
