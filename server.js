const express = require('express');
const { exec } = require('child_process');
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

app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.json({ output: 'No command provided' });
  }

  exec(command, { timeout: 30000, shell: '/bin/sh' }, (error, stdout, stderr) => {
    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += stderr;
    if (error) output += error.message;
    if (!output) output = '(no output)';
    res.json({ output });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
