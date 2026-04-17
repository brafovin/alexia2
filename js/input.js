// Normalized input state. Attach once to window/canvas; read from `input` each frame.

export const input = {
  keys: new Set(),
  pressed: new Set(),     // keys that went down this frame
  mouseX: 0,
  mouseY: 0,
  mouseDown: false,
  mouseClicked: false,    // transient one-frame click
};

let canvasEl = null;

export function bindInput(canvas) {
  canvasEl = canvas;

  window.addEventListener("keydown", (e) => {
    const k = normalize(e.key);
    if (!input.keys.has(k)) input.pressed.add(k);
    input.keys.add(k);
    // prevent page scroll / form-like keys from affecting the page
    if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  }, { passive: false });

  window.addEventListener("keyup", (e) => {
    input.keys.delete(normalize(e.key));
  });

  canvas.addEventListener("mousemove", updateMouse);
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.mouseClicked = true;
      updateMouse(e);
    }
  });
  canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) input.mouseDown = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mouseleave", () => { input.mouseDown = false; });
}

function normalize(k) {
  return k.length === 1 ? k.toLowerCase() : k.toLowerCase();
}

function updateMouse(e) {
  if (!canvasEl) return;
  const r = canvasEl.getBoundingClientRect();
  input.mouseX = ((e.clientX - r.left) / r.width) * canvasEl.width;
  input.mouseY = ((e.clientY - r.top) / r.height) * canvasEl.height;
}

// Call at the end of each frame to clear one-shot states.
export function endFrame() {
  input.pressed.clear();
  input.mouseClicked = false;
}

export function justPressed(k) { return input.pressed.has(k); }
export function held(k) { return input.keys.has(k); }
