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

let ctrlActive = false;

document.addEventListener('keydown', (e) => {
  if (ctrlActive && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
    const ctrlKey = e.key.toLowerCase();
    const code = ctrlKey.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      socket.emit('terminal:write', String.fromCharCode(code - 96));
      e.preventDefault();
      return;
    }
  }
  if (e.ctrlKey && !ctrlActive) {
    e.preventDefault();
  }
  if (!ctrlActive && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
    return;
  }
  if (e.ctrlKey) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Control') {
    ctrlActive = false;
    document.getElementById('btn-ctrl').classList.remove('ctrl-active');
  }
});

document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

const toolbar = document.querySelector('.toolbar');

function handleVisualViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  
  const isKeyboardOpen = viewport.height < window.innerHeight * 0.75;
  const keyboardHeight = window.innerHeight - viewport.height - (viewport.offsetTop || 0);
  
  if (isKeyboardOpen) {
    toolbar.classList.add('keyboard-open');
    toolbar.style.bottom = keyboardHeight + 'px';
  } else {
    toolbar.classList.remove('keyboard-open');
    toolbar.style.bottom = '';
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

let mobileInput = document.getElementById('mobile-input');

function createMobileInput() {
  if (mobileInput) return;
  
  mobileInput = document.createElement('input');
  mobileInput.type = 'text';
  mobileInput.id = 'mobile-input';
  mobileInput.autocomplete = 'off';
  mobileInput.autocorrect = 'off';
  mobileInput.autocapitalize = 'off';
  mobileInput.spellcheck = false;
  mobileInput.style.cssText = 'position:fixed;top:-1000px;left:-1000px;width:1px;height:1px;opacity:0;';
  document.body.appendChild(mobileInput);
  
  mobileInput.addEventListener('input', (e) => {
    const data = mobileInput.value;
    if (data) {
      socket.emit('terminal:write', data);
      mobileInput.value = '';
    }
  });

  mobileInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      socket.emit('terminal:write', '\r');
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      socket.emit('terminal:write', '\x7f');
      e.preventDefault();
    } else if (e.key === 'Delete') {
      socket.emit('terminal:write', '\x1b[3~');
      e.preventDefault();
    } else if (e.key === 'Tab') {
      socket.emit('terminal:write', '\t');
      e.preventDefault();
    } else if (ctrlActive && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      const ctrlKey = e.key.toLowerCase();
      const code = ctrlKey.charCodeAt(0);
      if (code >= 97 && code <= 122) {
        socket.emit('terminal:write', String.fromCharCode(code - 96));
        e.preventDefault();
      }
    } else if (e.ctrlKey) {
      e.preventDefault();
    }
  });
}

function focusMobileInput() {
  createMobileInput();
  mobileInput.focus();
}

document.getElementById('terminal-container').addEventListener('click', focusMobileInput);
document.getElementById('terminal-container').addEventListener('touchstart', focusMobileInput, { passive: true });

function sendKey(key) {
  socket.emit('terminal:write', key);
  setTimeout(() => {
    if (mobileInput) mobileInput.focus();
  }, 10);
}

function toggleCtrl() {
  ctrlActive = !ctrlActive;
  document.getElementById('btn-ctrl').classList.toggle('ctrl-active', ctrlActive);
  setTimeout(() => {
    if (mobileInput) mobileInput.focus();
  }, 10);
}

async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    socket.emit('terminal:write', text);
  } catch {
    alert('Clipboard not allowed');
  }
  setTimeout(() => {
    if (mobileInput) mobileInput.focus();
  }, 10);
}
