const WS_URL = 'ws://localhost:8081/ws';

let socket: WebSocket | null = null;
let reconnectTimeout = 1000;

// small EventTarget wrapper we'll export so callers can use addEventListener('message', ...)
const emitter = new EventTarget();

function connect() {
  socket = new WebSocket(WS_URL);

  socket.addEventListener('open', () => {
    // console.log('ws open');
    reconnectTimeout = 1000;
    // optionally notify listeners of open
    emitter.dispatchEvent(new Event('open'));
  });

  socket.addEventListener('message', (ev) => {
    // forward raw message as MessageEvent so listeners receiving ev.data continue to work
    try {
      const forwarded = new MessageEvent('message', { data: ev.data });
      emitter.dispatchEvent(forwarded);
    } catch (e) {
      // fallback: dispatch plain Event with detail on window
      const fallback = new CustomEvent('message', { detail: ev.data });
      emitter.dispatchEvent(fallback);
    }

    try {
      const data = JSON.parse(ev.data);
      // console.log('ws message', data);
      // also emit a high-level custom event if code elsewhere uses it
      if (data && data.type) {
        emitter.dispatchEvent(new CustomEvent(data.type, { detail: data }));
      }
    } catch (e) {
      // ignore non-JSON
    }
  });

  socket.addEventListener('close', (ev) => {
    // console.warn('ws closed', ev.reason || ev);
    emitter.dispatchEvent(new CloseEvent('close'));
    setTimeout(connect, reconnectTimeout);
    reconnectTimeout = Math.min(30000, reconnectTimeout * 1.5);
  });

  socket.addEventListener('error', (err) => {
    // console.error('ws error', err);
    emitter.dispatchEvent(new Event('error'));
    socket?.close();
  });
}

connect();

export default {
  // allow existing code to call addEventListener('message', handler)
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) =>
    emitter.addEventListener(type, listener),
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) =>
    emitter.removeEventListener(type, listener),
  send: (obj: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(obj));
  }
};
