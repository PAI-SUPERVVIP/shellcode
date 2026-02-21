const term = new Terminal({
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'monospace',
  theme: {
    background: '#000000',
    foreground: '#00ff00'
  }
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal-container'));
fitAddon.fit();

const socket = io();
let ctrlActive = false;

term.onData((data) => {
  socket.emit('terminal:write', data);
});

socket.on('terminal:data', (data) => {
  term.write(data);
});

window.addEventListener('resize', () => {
  fitAddon.fit();
  socket.emit('resize', {
    cols: term.cols,
    rows: term.rows
  });
});

socket.emit('resize', {
  cols: term.cols,
  rows: term.rows
});

term.focus();

function sendKey(key) {
  socket.emit('terminal:write', key);
}

function toggleCtrl() {
  ctrlActive = !ctrlActive;
  document.getElementById('btn-ctrl').classList.toggle('ctrl-active', ctrlActive);
  socket.emit('terminal:write', ctrlActive ? '\x1b' : '');
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    socket.emit('terminal:write', text);
  } catch {
    alert('Clipboard not allowed');
  }
}
