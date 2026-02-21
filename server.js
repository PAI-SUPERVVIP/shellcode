const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.json({ output: 'No command provided' });
  }

  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += stderr;
    if (error) output += error.message;
    res.json({ output: output || '(no output)' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
