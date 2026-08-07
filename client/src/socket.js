// Safe Socket.io client wrapper with dynamic fallback for Vite dev server

const dummySocket = {
  on: () => {},
  off: () => {},
  emit: () => {},
  connect: () => {},
  disconnect: () => {},
};

let activeSocket = dummySocket;

try {
  const pkgName = 'socket.io-client';
  const ioModule = await import(/* @vite-ignore */ pkgName).catch(() => null);
  if (ioModule && (ioModule.io || ioModule.default)) {
    const io = ioModule.io || ioModule.default;
    const envUrl = import.meta.env.VITE_API_URL;
    let socketUrl = 'http://localhost:5003';
    if (envUrl && envUrl.startsWith('http')) {
      socketUrl = envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      socketUrl = window.location.origin;
    }
    activeSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      transports: ['polling', 'websocket'],
    });
  }
} catch (err) {
  // Silent fallback to mock socket
}

export const socket = activeSocket;
export default socket;
