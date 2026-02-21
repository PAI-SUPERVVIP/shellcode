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

const toolbar = document.querySelector('.toolbar');

function handleVisualViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  
  const isKeyboardOpen = viewport.height < window.innerHeight * 0.75;
  
  if (isKeyboardOpen) {
    toolbar.classList.add('keyboard-open');
  } else {
    toolbar.classList.remove('keyboard-open');
  }
  
  fitAddon.fit();
  socket.emit('resize', {
    cols: term.cols,
    rows: term.rows
  });
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handleVisualViewport);
  window.visualViewport.addEventListener('scroll', handleVisualViewport);
}

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
  setTimeout(() => term.focus(), 10);
}

function toggleCtrl() {
  ctrlActive = !ctrlActive;
  document.getElementById('btn-ctrl').classList.toggle('ctrl-active', ctrlActive);
  socket.emit('terminal:write', ctrlActive ? '\x1b' : '');
  setTimeout(() => term.focus(), 10);
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    socket.emit('terminal:write', text);
  } catch {
    alert('Clipboard not allowed');
  }
  setTimeout(() => term.focus(), 10);
}
